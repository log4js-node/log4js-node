'use strict';

const test = require('tap').test;
const fs = require('fs');
const path = require('path');
const sandbox = require('sandboxed-module');
const log4js = require('../../lib/log4js');
const zlib = require('zlib');
const EOL = require('os').EOL || '\n';

function removeFile(filename) {
  try {
    fs.unlinkSync(filename);
  } catch (e) {
    // doesn't really matter if it failed
  }
}

test('log4js fileAppender', (batch) => {
  batch.test('with default fileAppender settings', (t) => {
    const testFile = path.join(__dirname, 'fa-default-test.log');
    const logger = log4js.getLogger('default-settings');
    removeFile(testFile);

    t.tearDown(() => { removeFile(testFile); });

    log4js.configure({
      appenders: { file: { type: 'file', filename: testFile } },
      categories: { default: { appenders: ['file'], level: 'debug' } }
    });

    logger.info('This should be in the file.');

    setTimeout(() => {
      fs.readFile(testFile, 'utf8', (err, fileContents) => {
        t.include(fileContents, `This should be in the file.${EOL}`);
        t.match(
          fileContents,
          /\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}] \[INFO] default-settings - /
        );
        t.end();
      });
    }, 100);
  });

  batch.test('should flush logs on shutdown', (t) => {
    const testFile = path.join(__dirname, 'fa-default-test.log');
    removeFile(testFile);

    log4js.configure({
      appenders: { test: { type: 'file', filename: testFile } },
      categories: { default: { appenders: ['test'], level: 'trace' } }
    });
    const logger = log4js.getLogger('default-settings');

    logger.info('1');
    logger.info('2');
    logger.info('3');

    log4js.shutdown(() => {
      fs.readFile(testFile, 'utf8', (err, fileContents) => {
        // 3 lines of output, plus the trailing newline.
        t.equal(fileContents.split(EOL).length, 4);
        t.match(
          fileContents,
          /\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}] \[INFO] default-settings - /
        );
        t.end();
      });
    });
  });

  batch.test('with a max file size and no backups', (t) => {
    const testFile = path.join(__dirname, 'fa-maxFileSize-test.log');
    const logger = log4js.getLogger('max-file-size');

    t.tearDown(() => {
      removeFile(testFile);
      removeFile(`${testFile}.1`);
    });
    removeFile(testFile);
    removeFile(`${testFile}.1`);

    // log file of 100 bytes maximum, no backups
    log4js.configure({
      appenders: {
        file: { type: 'file', filename: testFile, maxLogSize: 100, backups: 0 }
      },
      categories: { default: { appenders: ['file'], level: 'debug' } }
    });

    logger.info('This is the first log message.');
    logger.info('This is an intermediate log message.');
    logger.info('This is the second log message.');
    // wait for the file system to catch up
    setTimeout(() => {
      fs.readFile(testFile, 'utf8', (err, fileContents) => {
        t.include(fileContents, 'This is the second log message.');
        t.equal(fileContents.indexOf('This is the first log message.'), -1);
        fs.readdir(__dirname, (e, files) => {
          const logFiles = files.filter(
            file => file.includes('fa-maxFileSize-test.log')
          );
          t.equal(logFiles.length, 2, 'should be 2 files');
          t.end();
        });
      });
    }, 100);
  });

  batch.test('with a max file size and 2 backups', (t) => {
    const testFile = path.join(__dirname, 'fa-maxFileSize-with-backups-test.log');
    const logger = log4js.getLogger('max-file-size-backups');
    removeFile(testFile);
    removeFile(`${testFile}.1`);
    removeFile(`${testFile}.2`);

    t.tearDown(() => {
      removeFile(testFile);
      removeFile(`${testFile}.1`);
      removeFile(`${testFile}.2`);
    });

    // log file of 50 bytes maximum, 2 backups
    log4js.configure({
      appenders: {
        file: { type: 'file', filename: testFile, maxLogSize: 50, backups: 2 }
      },
      categories: { default: { appenders: ['file'], level: 'debug' } }
    });

    logger.info('This is the first log message.');
    logger.info('This is the second log message.');
    logger.info('This is the third log message.');
    logger.info('This is the fourth log message.');
    // give the system a chance to open the stream
    setTimeout(() => {
      fs.readdir(__dirname, (err, files) => {
        const logFiles = files.sort().filter(
          file => file.includes('fa-maxFileSize-with-backups-test.log')
        );
        t.equal(logFiles.length, 3);
        t.same(logFiles, [
          'fa-maxFileSize-with-backups-test.log',
          'fa-maxFileSize-with-backups-test.log.1',
          'fa-maxFileSize-with-backups-test.log.2'
        ]);
        t.test('the contents of the first file', (assert) => {
          fs.readFile(path.join(__dirname, logFiles[0]), 'utf8', (e, contents) => {
            assert.include(contents, 'This is the fourth log message.');
            assert.end();
          });
        });
        t.test('the contents of the second file', (assert) => {
          fs.readFile(path.join(__dirname, logFiles[1]), 'utf8', (e, contents) => {
            assert.include(contents, 'This is the third log message.');
            assert.end();
          });
        });
        t.test('the contents of the third file', (assert) => {
          fs.readFile(path.join(__dirname, logFiles[2]), 'utf8', (e, contents) => {
            assert.include(contents, 'This is the second log message.');
            assert.end();
          });
        });
        t.end();
      });
    }, 200);
  });

  batch.test('with a max file size and 2 compressed backups', (t) => {
    const testFile = path.join(__dirname, 'fa-maxFileSize-with-backups-compressed-test.log');
    const logger = log4js.getLogger('max-file-size-backups');
    removeFile(testFile);
    removeFile(`${testFile}.1.gz`);
    removeFile(`${testFile}.2.gz`);

    t.tearDown(() => {
      removeFile(testFile);
      removeFile(`${testFile}.1.gz`);
      removeFile(`${testFile}.2.gz`);
    });

    // log file of 50 bytes maximum, 2 backups
    log4js.configure({
      appenders: {
        file: { type: 'file', filename: testFile, maxLogSize: 50, backups: 2, compress: true }
      },
      categories: { default: { appenders: ['file'], level: 'debug' } }
    });
    logger.info('This is the first log message.');
    logger.info('This is the second log message.');
    logger.info('This is the third log message.');
    logger.info('This is the fourth log message.');
    // give the system a chance to open the stream
    setTimeout(() => {
      fs.readdir(__dirname, (err, files) => {
        const logFiles = files.sort().filter(
          file => file.includes('fa-maxFileSize-with-backups-compressed-test.log')
        );
        t.equal(logFiles.length, 3, 'should be 3 files');
        t.same(logFiles, [
          'fa-maxFileSize-with-backups-compressed-test.log',
          'fa-maxFileSize-with-backups-compressed-test.log.1.gz',
          'fa-maxFileSize-with-backups-compressed-test.log.2.gz'
        ]);
        t.test('the contents of the first file', (assert) => {
          fs.readFile(path.join(__dirname, logFiles[0]), 'utf8', (e, contents) => {
            assert.include(contents, 'This is the fourth log message.');
            assert.end();
          });
        });
        t.test('the contents of the second file', (assert) => {
          zlib.gunzip(fs.readFileSync(path.join(__dirname, logFiles[1])), (e, contents) => {
            assert.include(contents.toString('utf8'), 'This is the third log message.');
            assert.end();
          });
        });
        t.test('the contents of the third file', (assert) => {
          zlib.gunzip(fs.readFileSync(path.join(__dirname, logFiles[2])), (e, contents) => {
            assert.include(contents.toString('utf8'), 'This is the second log message.');
            assert.end();
          });
        });
        t.end();
      });
    }, 1000);
  });

  batch.test('when underlying stream errors', (t) => {
    let consoleArgs;
    let errorHandler;

    const fileAppender = sandbox.require(
      '../../lib/appenders/file',
      {
        globals: {
          console: {
            error: function () {
              consoleArgs = Array.prototype.slice.call(arguments);
            }
          }
        },
        requires: {
          streamroller: {
            RollingFileStream: function () {
              this.end = function () {
              };
              this.on = function (evt, cb) {
                if (evt === 'error') {
                  errorHandler = cb;
                }
              };
              this.write = function () {
                return true;
              };
            }
          }
        }
      }
    );

    fileAppender.configure({ filename: 'test1.log', maxLogSize: 100 }, { basicLayout: function () {} });
    errorHandler({ error: 'aargh' });

    t.test('should log the error to console.error', (assert) => {
      assert.ok(consoleArgs);
      assert.equal(consoleArgs[0], 'log4js.fileAppender - Writing to file %s, error happened ');
      assert.equal(consoleArgs[1], 'test1.log');
      assert.equal(consoleArgs[2].error, 'aargh');
      assert.end();
    });
    t.end();
  });

  batch.end();
});
