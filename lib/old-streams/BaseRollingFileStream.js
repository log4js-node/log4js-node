var fs = require('fs'),
    util = require('util');

function debug(message) {
//    console.log(message);
}

module.exports = BaseRollingFileStream;

function BaseRollingFileStream(filename, options) {

debug("In BaseRollingFileStream");
    this.filename = filename;
    this.options = options || { encoding: 'utf8', mode: 0644, flags: 'a' };
    this.rolling = false;
    this.writesWhileRolling = [];
    this.currentSize = 0;
    this.rollBeforeWrite = false;

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
debug("Calling BaseRollingFileStream.super");
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
    var canWrite = false;
    if (this.rolling) {
        this.writesWhileRolling.push({ data: data, encoding: encoding });
    } else {
        if (this.rollBeforeWrite && this.shouldRoll()) {
            this.writesWhileRolling.push({ data: data, encoding: encoding });
            this.initRolling();
        } else {
            canWrite = BaseRollingFileStream.super_.prototype.write.call(this, data, encoding);
            this.currentSize += data.length;
            debug('current size = ' + this.currentSize);

            if (!this.rollBeforeWrite && this.shouldRoll()) {
                this.initRolling();
            }
        }
    }
    return canWrite;
};

BaseRollingFileStream.prototype.shouldRoll = function() {
    return false; // default behaviour is never to roll
};

BaseRollingFileStream.prototype.roll = function(filename, callback) {
    callback(); // default behaviour is not to do anything
};

