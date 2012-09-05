var events = require('events'),
    util = require('util');

module.exports = BufferedWriteStream;

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
