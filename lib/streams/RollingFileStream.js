'use strict';

const BaseRollingFileStream = require('./BaseRollingFileStream');
const debug = require('../debug')('RollingFileStream');
const path = require('path');
const zlib = require('zlib');
const fs = require('fs');

class RollingFileStream extends BaseRollingFileStream {
  constructor(filename, size, backups, options) {
    function throwErrorIfArgumentsAreNotValid() {
      if (!filename || !size || size <= 0) {
        throw new Error('You must specify a filename and file size');
      }
    }

    throwErrorIfArgumentsAreNotValid();

    super(filename, options);

    this.size = size;
    this.backups = backups || 1;
  }

  shouldRoll() {
    debug(`should roll with current size ${this.currentSize} and max size ${this.size}`);
    return this.currentSize >= this.size;
  }

  roll(filename, callback) {
    const that = this;
    const nameMatcher = new RegExp(`^${path.basename(filename)}`);

    function justTheseFiles(item) {
      return nameMatcher.test(item);
    }

    function index(filename_) {
      debug(`Calculating index of ${filename_}`);
      return parseInt(filename_.substring((`${path.basename(filename)}.`).length), 10) || 0;
    }

    function byIndex(a, b) {
      if (index(a) > index(b)) {
        return 1;
      } else if (index(a) < index(b)) {
        return -1;
      }

      return 0;
    }

    function increaseFileIndex(fileToRename, cb) {
      const idx = index(fileToRename);
      debug(`Index of ${fileToRename} is ${idx}`);

      if (idx < that.backups) {
        const ext = path.extname(fileToRename);
        let destination = `${filename}.${idx + 1}`;
        if (that.options.compress && /^gz$/.test(ext.substring(1))) {
          destination += ext;
        }
        // on windows, you can get a EEXIST error if you rename a file to an existing file
        // so, we'll try to delete the file we're renaming to first
        /* eslint no-unused-vars:0 */
        fs.unlink(destination, err => {
          // ignore err: if we could not delete, it's most likely that it doesn't exist
          debug(`Renaming ${fileToRename} -> ${destination}`);
          fs.rename(path.join(path.dirname(filename), fileToRename), destination, _err => {
            if (_err) {
              cb(_err);
            } else {
              if (that.options.compress && ext !== '.gz') {
                compress(destination, cb);
              } else {
                cb();
              }
            }
          });
        });
      } else {
        cb();
      }
    }

    function renameTheFiles(cb) {
      // roll the backups (rename file.n to file.n+1, where n <= numBackups)
      debug('Renaming the old files');
      fs.readdir(path.dirname(filename), (err, files) => {
        const filesToProcess = files.filter(justTheseFiles).sort(byIndex);
        (function processOne(_err) {
          const file = filesToProcess.pop();
          if (!file || _err) {
            return cb(_err);
          }
          return increaseFileIndex(file, processOne);
        }());
      });
    }

    debug('Rolling, rolling, rolling');

    this.closeTheStream(
      renameTheFiles.bind(null,
        this.openTheStream.bind(this, callback)));
  }
}

function compress(filename, cb) {
  const gzip = zlib.createGzip();
  const inp = fs.createReadStream(filename);
  const out = fs.createWriteStream(`${filename}.gz`);
  inp.pipe(gzip).pipe(out);
  fs.unlink(filename, cb);
}

module.exports = RollingFileStream;
