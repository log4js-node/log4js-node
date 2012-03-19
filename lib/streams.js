var util = require('util'),
fs = require('fs'),
path = require('path'),
events = require('events'),
async = require('async');

function debug(message) {
//    util.debug(message);
//    console.log(message);
}

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
};

BufferedWriteStream.prototype.end = function(data, encoding) {
    if (data) {
        this.buffer.push({ data: data, encoding: encoding });
    }
    this.flushBufferEvenIfCannotWrite();
};

BufferedWriteStream.prototype.writeToStream = function(toWrite) {
    this.bytes += toWrite.data.length;
    this.canWrite = this.stream.write(toWrite.data, toWrite.encoding);
};

BufferedWriteStream.prototype.flushBufferEvenIfCannotWrite = function() {
    while (this.buffer.length > 0) {
        this.writeToStream(this.buffer.shift());
    }
};

BufferedWriteStream.prototype.flushBuffer = function() {
    while (this.buffer.length > 0 && this.canWrite) {
        this.writeToStream(this.buffer.shift());
    }
};

function BaseRollingFileStream(filename, options) {
    this.filename = filename;
    this.options = options || { encoding: 'utf8', mode: 0644, flags: 'a' };
    this.rolling = false;
    this.writesWhileRolling = [];
    this.currentSize = 0;

    function currentFileSize(file) {
        var fileSize = 0;
        try {
            fileSize = fs.statSync(file).size;
        } catch (e) {
            // file does not exist
        }
        return fileSize;
    }

    function throwErrorIfArgumentsAreNotValid() {
        if (!filename) {
            throw new Error("You must specify a filename");
        }
    }

    throwErrorIfArgumentsAreNotValid();

    BaseRollingFileStream.super_.call(this, this.filename, this.options);
    this.currentSize = currentFileSize(this.filename);
}
util.inherits(BaseRollingFileStream, fs.FileWriteStream);

BaseRollingFileStream.prototype.initRolling = function() {
    var that = this;

    function emptyRollingQueue() {
        debug("emptying the rolling queue");
        var toWrite;
        while ((toWrite = that.writesWhileRolling.shift())) {
            BaseRollingFileStream.super_.prototype.write.call(that, toWrite.data, toWrite.encoding);
            that.currentSize += toWrite.data.length;
            if (that.shouldRoll()) {
                that.flush();
                return true;
            }
        }
        that.flush();
        return false;
    }

    this.rolling = true;
    this.roll(this.filename, function() {
        that.currentSize = 0;
        that.rolling = emptyRollingQueue();
        if (that.rolling) {
            process.nextTick(function() { that.initRolling(); });
        }
    });
};

BaseRollingFileStream.prototype.write = function(data, encoding) {
    if (this.rolling) {
        this.writesWhileRolling.push({ data: data, encoding: encoding });
        return false;
    } else {
        var canWrite = BaseRollingFileStream.super_.prototype.write.call(this, data, encoding);
        this.currentSize += data.length;
        debug('current size = ' + this.currentSize);
        if (this.shouldRoll()) {
            this.initRolling();
        }
        return canWrite;
    }
};

BaseRollingFileStream.prototype.shouldRoll = function() {
    return false; // default behaviour is never to roll
};

BaseRollingFileStream.prototype.roll = function(filename, callback) {
    callback(); // default behaviour is not to do anything
};


function RollingFileStream (filename, size, backups, options) {
    this.size = size;
    this.backups = backups || 1;

    function throwErrorIfArgumentsAreNotValid() {
        if (!filename || !size || size <= 0) {
            throw new Error("You must specify a filename and file size");
        }
    }

    throwErrorIfArgumentsAreNotValid();

    RollingFileStream.super_.call(this, filename, options);
}
util.inherits(RollingFileStream, BaseRollingFileStream);

RollingFileStream.prototype.shouldRoll = function() {
    return this.currentSize >= this.size;
};

RollingFileStream.prototype.roll = function(filename, callback) {
    var that = this,
        nameMatcher = new RegExp('^' + path.basename(filename));

    function justTheseFiles (item) {
        return nameMatcher.test(item);
    }

    function index(filename_) {
        return parseInt(filename_.substring((path.basename(filename) + '.').length), 10) || 0;
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
        debug('Index of ' + fileToRename + ' is ' + idx);
        if (idx < that.backups) {
            //on windows, you can get a EEXIST error if you rename a file to an existing file
            //so, we'll try to delete the file we're renaming to first
            fs.unlink(filename + '.' + (idx+1), function (err) {
                //ignore err: if we could not delete, it's most likely that it doesn't exist
                debug('Renaming ' + fileToRename + ' -> ' + filename + '.' + (idx+1));
                fs.rename(path.join(path.dirname(filename), fileToRename), filename + '.' + (idx + 1), cb);
            });
        } else {
            cb();
        }
    }

    function renameTheFiles(cb) {
        //roll the backups (rename file.n to file.n+1, where n <= numBackups)
        debug("Renaming the old files");
        fs.readdir(path.dirname(filename), function (err, files) {
            async.forEachSeries(
                files.filter(justTheseFiles).sort(byIndex).reverse(),
                increaseFileIndex,
                cb
            );
        });
    }

    function openANewFile(cb) {
        debug("Opening a new file");
        fs.open(
            filename,
            that.options.flags,
            that.options.mode,
            function (err, fd) {
                debug("opened new file");
                var oldLogFileFD = that.fd;
                that.fd = fd;
                that.writable = true;
                fs.close(oldLogFileFD, cb);
            }
        );
    }

    debug("Starting roll");
    debug("Queueing up data until we've finished rolling");
    debug("Flushing underlying stream");
    this.flush();

    async.series([
        renameTheFiles,
        openANewFile
    ], callback);

};


exports.BaseRollingFileStream = BaseRollingFileStream;
exports.RollingFileStream = RollingFileStream;
exports.BufferedWriteStream = BufferedWriteStream;
