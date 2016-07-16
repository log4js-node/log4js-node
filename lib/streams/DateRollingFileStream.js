'use strict';

const BaseRollingFileStream = require('./BaseRollingFileStream');
const debug = require('../debug')('DateRollingFileStream');
const format = require('../date_format');
const fs = require('fs');

function findTimestampFromFileIfExists(filename, now) {
  return fs.existsSync(filename) ? fs.statSync(filename).mtime : new Date(now());
}

class DateRollingFileStream extends BaseRollingFileStream {
  constructor(filename, pattern, options, now) {
    debug(`Now is ${now}`);

    if (pattern && typeof(pattern) === 'object') {
      now = options;
      options = pattern;
      pattern = null;
    }
    pattern = pattern || '.yyyy-MM-dd';
    const thisNow = now || Date.now;
    const lastTimeWeWroteSomething = format.asString(
      pattern,
      findTimestampFromFileIfExists(filename, thisNow)
    );
    const baseFilename = filename;
    let alwaysIncludePattern = false;

    if (options) {
      if (options.alwaysIncludePattern) {
        alwaysIncludePattern = true;
        filename = baseFilename + lastTimeWeWroteSomething;
      }
      delete options.alwaysIncludePattern;
      if (Object.keys(options).length === 0) {
        options = null;
      }
    }

    debug(`this.now is ${thisNow}, now is ${now}`);

    super(filename, options);

    this.pattern = pattern;
    this.now = thisNow;
    this.lastTimeWeWroteSomething = lastTimeWeWroteSomething;
    this.baseFilename = baseFilename;
    this.alwaysIncludePattern = alwaysIncludePattern;
  }

  shouldRoll() {
    const lastTime = this.lastTimeWeWroteSomething;
    const thisTime = format.asString(this.pattern, new Date(this.now()));

    debug(`DateRollingFileStream.shouldRoll with now = ${this.now()}, thisTime = ${thisTime}, lastTime = ${lastTime}`);

    this.lastTimeWeWroteSomething = thisTime;
    this.previousTime = lastTime;

    return thisTime !== lastTime;
  }

  roll(filename, callback) {
    debug('Starting roll');
    let newFilename;

    if (this.alwaysIncludePattern) {
      this.filename = this.baseFilename + this.lastTimeWeWroteSomething;
      this.closeTheStream(this.openTheStream.bind(this, callback));
    } else {
      newFilename = this.baseFilename + this.previousTime;
      this.closeTheStream(
        deleteAnyExistingFile.bind(null,
          renameTheCurrentFile.bind(null,
            this.openTheStream.bind(this, callback))));
    }

    function deleteAnyExistingFile(cb) {
      // on windows, you can get a EEXIST error if you rename a file to an existing file
      // so, we'll try to delete the file we're renaming to first
      fs.unlink(newFilename, err => {
        // ignore err: if we could not delete, it's most likely that it doesn't exist
        cb(err);
      });
    }

    function renameTheCurrentFile(cb) {
      debug(`Renaming the ${filename} -> ${newFilename}`);
      fs.rename(filename, newFilename, cb);
    }
  }
}

module.exports = DateRollingFileStream;
