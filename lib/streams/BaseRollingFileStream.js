'use strict';

const fs = require('fs');
const debug = require('../debug')('BaseRollingFileStream');
const stream = require('stream');

class BaseRollingFileStream extends stream.Writable {
  constructor(filename, options) {
    debug('In BaseRollingFileStream');

    function throwErrorIfArgumentsAreNotValid() {
      if (!filename) {
        throw new Error('You must specify a filename');
      }
    }

    throwErrorIfArgumentsAreNotValid();

    debug('Calling BaseRollingFileStream.super');

    super();

    this.filename = filename;
    this.options = options || {};
    this.options.encoding = this.options.encoding || 'utf8';
    this.options.mode = this.options.mode || parseInt('0644', 8);
    this.options.flags = this.options.flags || 'a';

    this.currentSize = 0;

    this.openTheStream();

    this.currentSize = currentFileSize(this.filename);
  }

  _write(chunk, encoding, callback) {
    const that = this;

    function writeTheChunk() {
      debug('writing the chunk to the underlying stream');
      that.currentSize += chunk.length;
      try {
        that.theStream.write(chunk, encoding, callback);
      } catch (err) {
        debug(err);
        callback();
      }
    }

    debug('in _write');

    if (this.shouldRoll()) {
      this.currentSize = 0;
      this.roll(this.filename, writeTheChunk);
    } else {
      writeTheChunk();
    }
  }

  openTheStream(cb) {
    debug('opening the underlying stream');
    this.theStream = fs.createWriteStream(this.filename, this.options);
    if (cb) {
      this.theStream.on('open', cb);
    }
  }

  closeTheStream(cb) {
    debug('closing the underlying stream');
    this.theStream.end(cb);
  }

  shouldRoll() {
    return false; // default behaviour is never to roll
  }

  roll(filename, callback) {
    callback(); // default behaviour is not to do anything
  }
}

function currentFileSize(file) {
  let fileSize = 0;
  try {
    fileSize = fs.statSync(file).size;
  } catch (e) {
    // file does not exist
  }
  return fileSize;
}

module.exports = BaseRollingFileStream;
