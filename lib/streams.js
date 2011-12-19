var util = require('util')
, fs = require('fs')
, path = require('path')
, events = require('events')
, async = require('async');

function BufferedWriteStream(stream) {
    var that = this;
    this.stream = stream;
    this.buffer = [];
    this.canWrite = false;
    this.bytes = 0;

    this.stream.on("open", function() {
        that.canWrite = true;
        that.flushBuffer();
    });

    this.stream.on("error", function (err) {
        that.emit("error", err);
    });

    this.stream.on("drain", function() {
        that.canWrite = true;
        that.flushBuffer();
    });
}

util.inherits(BufferedWriteStream, events.EventEmitter);

Object.defineProperty(
    BufferedWriteStream.prototype,
    "fd",
    {
        get: function() { return this.stream.fd; },
        set: function(newFd) {
            this.stream.fd = newFd;
            this.bytes = 0;
        }
    }
);

Object.defineProperty(
    BufferedWriteStream.prototype,
    "bytesWritten",
    {
        get: function() { return this.bytes; }
    }
);

BufferedWriteStream.prototype.write = function(data, encoding) {
    this.buffer.push({ data: data, encoding: encoding });
    this.flushBuffer();
}

BufferedWriteStream.prototype.end = function(data, encoding) {
    if (data) {
        this.buffer.push({ data: data, encoding: encoding });
    }
    this.flushBufferEvenIfCannotWrite();
}

BufferedWriteStream.prototype.writeToStream = function(toWrite) {
    this.bytes += toWrite.data.length;
    this.canWrite = this.stream.write(toWrite.data, toWrite.encoding);
}

BufferedWriteStream.prototype.flushBufferEvenIfCannotWrite = function() {
    while (this.buffer.length > 0) {
        this.writeToStream(this.buffer.shift());
    }
}

BufferedWriteStream.prototype.flushBuffer = function() {
    while (this.buffer.length > 0 && this.canWrite) {
        this.writeToStream(this.buffer.shift());
    }
}

function RollingFileStream (filename, size, backups, options) {
    this.filename = filename;
    this.size = size;
    this.backups = backups || 1;
    this.options = options || { encoding: "utf8", mode: 0644, flags: 'a' };
    this.rolling = false;
    this.writesWhileRolling = [];

    throwErrorIfArgumentsAreNotValid();

    RollingFileStream.super_.call(this, this.filename, this.options);
    this.bytesWritten = currentFileSize(this.filename);

    function currentFileSize(file) {
        var fileSize = 0;
        try {
            fileSize = fs.statSync(file).size;
        } catch (e) {
            //file does not exist
        }
        return fileSize;
    }

    function throwErrorIfArgumentsAreNotValid() {
        if (!filename || !size || size <= 0) {
            throw new Error("You must specify a filename and file size");
        }
    }
}
util.inherits(RollingFileStream, fs.FileWriteStream);

RollingFileStream.prototype.write = function(data, encoding) {
    if (this.rolling) {
        this.writesWhileRolling.push({ data: data, encoding: encoding });
        return false;
    } else {
        var canWrite = RollingFileStream.super_.prototype.write.call(this, data, encoding);
        //this.bytesWritten += data.length;
        console.log("bytesWritten: %d, max: %d", this.bytesWritten, this.size);
        if (this.bytesWritten >= this.size) {
            this.roll();
        }
        return canWrite;
    }
}

RollingFileStream.prototype.roll = function () {
    var that = this,
        nameMatcher = new RegExp('^' + path.basename(this.filename));

    function justTheseFiles (item) {
        return nameMatcher.test(item);
    }

    function index(filename) {
        return parseInt(filename.substring((path.basename(that.filename) + '.').length), 10) || 0;
    }

    function byIndex(a, b) {
        if (index(a) > index(b)) {
            return 1;
        } else if (index(a) < index(b) ) {
            return -1;
        } else {
            return 0;
        }
    }

    function increaseFileIndex (fileToRename, cb) {
        var idx = index(fileToRename);
        console.log("Index of %s is %d", fileToRename, idx);
        if (idx < that.backups) {
            //on windows, you can get a EEXIST error if you rename a file to an existing file
            //so, we'll try to delete the file we're renaming to first
            fs.unlink(that.filename + '.' + (idx+1), function (err) {
                //ignore err: if we could not delete, it's most likely that it doesn't exist
                console.log("Renaming %s -> %s", fileToRename, that.filename + '.' + (idx+1));
                fs.rename(path.join(path.dirname(that.filename), fileToRename), that.filename + '.' + (idx + 1), cb);
            });
        } else {
            cb();
        }
    }

    function renameTheFiles(cb) {
        //roll the backups (rename file.n to file.n+1, where n <= numBackups)
        console.log("Renaming the old files");
        fs.readdir(path.dirname(that.filename), function (err, files) {
            async.forEachSeries(
                files.filter(justTheseFiles).sort(byIndex).reverse(),
                increaseFileIndex,
                cb
            );
        });
    }

    function openANewFile(cb) {
        console.log("Opening a new file");
        fs.open(
            that.filename,
            that.options.flags,
            that.options.mode,
            function (err, fd) {
                console.log("opened new file");
                var oldLogFileFD = that.fd;
                that.fd = fd;
                that.writable = true;
                fs.close(oldLogFileFD, function() {
                    that.bytesWritten = 0;
                    cb();
                });
            }
        );
    }

    function emptyRollingQueue(cb) {
        console.log("emptying the rolling queue");
        var toWrite;
        while ((toWrite = that.writesWhileRolling.shift())) {
            RollingFileStream.super_.prototype.write.call(that, toWrite.data, toWrite.encoding);
            that.bytesWritten += toWrite.data.length;
        }
        that.rolling = false;
        cb();
    }

    console.log("Starting roll");
    console.log("Queueing up data until we've finished rolling");
    this.rolling = true;
    console.log("Flushing underlying stream");
    this.flush();

    async.series([
        renameTheFiles,
        openANewFile,
        emptyRollingQueue
    ]);

}

exports.RollingFileStream = RollingFileStream;
exports.BufferedWriteStream = BufferedWriteStream;