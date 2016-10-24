"use strict";
var BaseRollingFileStream = require('./BaseRollingFileStream')
  , debug = require('../debug')('DateRollingFileStream')
  , format = require('../date_format')
  , fs = require('fs')
  , util = require('util')
  , zlib = require('zlib');

module.exports = DateRollingFileStream;

function findTimestampFromFileIfExists(filename, now) {
  return fs.existsSync(filename) ? fs.statSync(filename).mtime : new Date(now());
}

function DateRollingFileStream(filename, pattern, options, now) {
  debug("Now is " + now);
  if (pattern && typeof(pattern) === 'object') {
    now = options;
    options = pattern;
    pattern = null;
  }
  this.pattern = pattern || '.yyyy-MM-dd';
  this.now = now || Date.now;
  this.lastTimeWeWroteSomething = format.asString(
    this.pattern,
    findTimestampFromFileIfExists(filename, this.now)
  );

  this.baseFilename = filename;
  this.alwaysIncludePattern = false;

  this.shouldCompress = false;

  if (options) {
    if (options.alwaysIncludePattern) {
      this.alwaysIncludePattern = true;
      filename = this.baseFilename + this.lastTimeWeWroteSomething;
    }
    delete options.alwaysIncludePattern;
    if (options.compress) {
      this.shouldCompress = true;
    }
    delete options.compress;
    if (Object.keys(options).length === 0) {
      options = null;
    }
  }
  debug("this.now is " + this.now + ", now is " + now);

  DateRollingFileStream.super_.call(this, filename, options);
}
util.inherits(DateRollingFileStream, BaseRollingFileStream);

DateRollingFileStream.prototype.shouldRoll = function () {
  var lastTime = this.lastTimeWeWroteSomething,
    thisTime = format.asString(this.pattern, new Date(this.now()));

  debug("DateRollingFileStream.shouldRoll with now = " +
    this.now() + ", thisTime = " + thisTime + ", lastTime = " + lastTime);

  this.lastTimeWeWroteSomething = thisTime;
  this.previousTime = lastTime;

  return thisTime !== lastTime;
};

DateRollingFileStream.prototype.roll = function (filename, callback) {
  var that = this;

  debug("Starting roll");

  if (this.alwaysIncludePattern) {
    this.filename = this.baseFilename + this.lastTimeWeWroteSomething;
    this.closeTheStream(
      compressIfRequested.bind(null,
        this.openTheStream.bind(this, callback)));
  } else {
    var newFilename = this.baseFilename + this.previousTime;
    this.closeTheStream(
      deleteAnyExistingFile.bind(null,
        renameTheCurrentFile.bind(null,
          compressIfRequested.bind(null,
            this.openTheStream.bind(this,
              callback)))))/**/;
  }

  function deleteAnyExistingFile(cb) {
    //on windows, you can get a EEXIST error if you rename a file to an existing file
    //so, we'll try to delete the file we're renaming to first
    fs.unlink(newFilename, function (err) {
      //ignore err: if we could not delete, it's most likely that it doesn't exist
      cb();
    });
  }

  function renameTheCurrentFile(cb) {
    debug("Renaming the " + filename + " -> " + newFilename);
    fs.rename(filename, newFilename, cb);
  }

  function compressIfRequested(cb) {
    var fileToCompress = (newFilename) ? newFilename : filename
      , compressedFile = fileToCompress + '.gz'
      , inp
      , out;
    if (that.shouldCompress) {
      debug("Compressing " + newFilename);
      inp = fs.createReadStream(fileToCompress);
      out = fs.createWriteStream(compressedFile);
      inp.pipe(zlib.createGzip()).pipe(out);
      out.on('finish', function() {
        fs.unlink(fileToCompress, cb);
      });
    } else {
      cb();
    }
  }

};
