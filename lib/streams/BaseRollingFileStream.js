var fs = require('fs'),
stream = require('stream'),
util = require('util');

function debug(message) {
//    console.log(message);
}

module.exports = BaseRollingFileStream;

function BaseRollingFileStream(filename, options) {
  debug("In BaseRollingFileStream");
  this.filename = filename;
  this.options = options || { encoding: 'utf8', mode: 0644, flags: 'a' };
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
  debug("Calling BaseRollingFileStream.super");
  BaseRollingFileStream.super_.call(this);
  this.openTheStream();
  this.currentSize = currentFileSize(this.filename);
}
util.inherits(BaseRollingFileStream, stream.Writable);

BaseRollingFileStream.prototype._write = function(chunk, encoding, callback) {
  var that = this;
  function writeTheChunk() {
    debug("writing the chunk to the underlying stream");
    that.currentSize += chunk.length;
    that.theStream.write(chunk, encoding, callback);
  }

  debug("in _write");

  if (this.shouldRoll()) {
    this.currentSize = 0;
    this.roll(this.filename, writeTheChunk);
  } else {
    writeTheChunk();
  }
};

BaseRollingFileStream.prototype.openTheStream = function(cb) {
  debug("opening the underlying stream");
  this.theStream = fs.createWriteStream(this.filename, this.options);
  if (cb) {
    this.theStream.on("open", cb);
  }
};

BaseRollingFileStream.prototype.closeTheStream = function(cb) {
  debug("closing the underlying stream");
  this.theStream.end(null, null, cb);
};

BaseRollingFileStream.prototype.shouldRoll = function() {
    return false; // default behaviour is never to roll
};

BaseRollingFileStream.prototype.roll = function(filename, callback) {
    callback(); // default behaviour is not to do anything
};

