'use strict';

const test = require('tap').test;
const fs = require('fs');
const path = require('path');
const sandbox = require('sandboxed-module');
const log4js = require('../../lib/log4js');
const zlib = require('zlib');
const EOL = require('os').EOL || '\n';

log4js.clearAppenders();

function remove(filename) {
  try {
    fs.unlinkSync(filename);
  } catch (e) {
    // doesn't really matter if it failed
  }
}

test('log4js fileAppender', (batch) => {
  batch.test('adding multiple fileAppenders', (t) => {
    const initialCount = process.listeners('exit').length;
    let count = 5;
    let logfile;

    while (count--) {
      logfile = path.join(__dirname, `fa-default-test${count}.log`);
      log4js.addAppender(
        require('../../lib/appenders/file').appender(logfile),
        'default-settings'
      );
    }

    t.equal(initialCount + 1, process.listeners('exit').length, 'should not add more than one exit listener');
    t.end();
  });

  batch.test('exit listener', (t) => {
    let exitListener;
    const openedFiles = [];

    const fileAppender = sandbox.require(
      '../../lib/appenders/file',
      {
        globals: {
          process: {
            on: function (evt, listener) {
              if (evt === 'exit') {
                exitListener = listener;
              }
            }
          }
        },
        singleOnly: true,
        requires: {
          streamroller: {
            RollingFileStream: function (filename) {
              openedFiles.push(filename);

              this.end = function () {
                openedFiles.shift();
              };

              this.on = function () {
              };
            }
          }
        }
      }
    );

    for (let i = 0; i < 5; i += 1) {
      fileAppender.appender(`test${i}`, null, 100);
    }
    t.ok(openedFiles);
    exitListener();
    t.equal(openedFiles.length, 0, 'should close all open files');
    t.end();
  });

  batch.test('with default fileAppender settings', (t) => {
    const testFile = path.join(__dirname, 'fa-default-test.log');
    const logger = log4js.getLogger('default-settings');
    remove(testFile);

    log4js.clearAppenders();
    log4js.addAppender(
      require('../../lib/appenders/file').appender(testFile),
      'default-settings'
    );

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

  batch.test('fileAppender subcategories', (t) => {
    log4js.clearAppenders();

    function addAppender(cat) {
      const testFile = path.join(
        __dirname,
        `fa-subcategories-test-${cat.join('-').replace(/\./g, '_')}.log`
      );
      remove(testFile);
      log4js.addAppender(require('../../lib/appenders/file').appender(testFile), cat);
      return testFile;
    }

    /* eslint-disable camelcase */
    const file_sub1 = addAppender(['sub1']);
    const file_sub1_sub12$sub1_sub13 = addAppender(['sub1.sub12', 'sub1.sub13']);
    const file_sub1_sub12 = addAppender(['sub1.sub12']);
    const logger_sub1_sub12_sub123 = log4js.getLogger('sub1.sub12.sub123');
    const logger_sub1_sub13_sub133 = log4js.getLogger('sub1.sub13.sub133');
    const logger_sub1_sub14 = log4js.getLogger('sub1.sub14');
    const logger_sub2 = log4js.getLogger('sub2');

    logger_sub1_sub12_sub123.info('sub1_sub12_sub123');
    logger_sub1_sub13_sub133.info('sub1_sub13_sub133');
    logger_sub1_sub14.info('sub1_sub14');
    logger_sub2.info('sub2');

    setTimeout(() => {
      t.test('file contents', (assert) => {
        const fileContents = {
          file_sub1: fs.readFileSync(file_sub1).toString(),
          file_sub1_sub12$sub1_sub13: fs.readFileSync(file_sub1_sub12$sub1_sub13).toString(),
          file_sub1_sub12: fs.readFileSync(file_sub1_sub12).toString()
        };
        // everything but category 'sub2'
        assert.match(
          fileContents.file_sub1,
          /^(\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}] \[INFO] (sub1.sub12.sub123 - sub1_sub12_sub123|sub1.sub13.sub133 - sub1_sub13_sub133|sub1.sub14 - sub1_sub14)[\s\S]){3}$/ // eslint-disable-line
        );
        assert.ok(
          fileContents.file_sub1.match(/sub123/) &&
          fileContents.file_sub1.match(/sub133/) &&
          fileContents.file_sub1.match(/sub14/)
        );
        assert.ok(!fileContents.file_sub1.match(/sub2/));

        // only catgories starting with 'sub1.sub12' and 'sub1.sub13'
        assert.match(
          fileContents.file_sub1_sub12$sub1_sub13,
          /^(\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}] \[INFO] (sub1.sub12.sub123 - sub1_sub12_sub123|sub1.sub13.sub133 - sub1_sub13_sub133)[\s\S]){2}$/ // eslint-disable-line
        );
        assert.ok(
          fileContents.file_sub1_sub12$sub1_sub13.match(/sub123/) &&
          fileContents.file_sub1_sub12$sub1_sub13.match(/sub133/)
        );
        assert.ok(!fileContents.file_sub1_sub12$sub1_sub13.match(/sub14|sub2/));

        // only catgories starting with 'sub1.sub12'
        assert.match(
          fileContents.file_sub1_sub12,
          /^(\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}] \[INFO] (sub1.sub12.sub123 - sub1_sub12_sub123)[\s\S]){1}$/ // eslint-disable-line
        );
        assert.ok(!fileContents.file_sub1_sub12.match(/sub14|sub2|sub13/));
        assert.end();
      });
      t.end();
    }, 3000);
  });

  batch.test('with a max file size and no backups', (t) => {
    const testFile = path.join(__dirname, 'fa-maxFileSize-test.log');
    const logger = log4js.getLogger('max-file-size');
    remove(testFile);
    remove(`${testFile}.1`);
    // log file of 100 bytes maximum, no backups
    log4js.clearAppenders();
    log4js.addAppender(
      require('../../lib/appenders/file').appender(testFile, log4js.layouts.basicLayout, 100, 0),
      'max-file-size'
    );
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
    remove(testFile);
    remove(`${testFile}.1`);
    remove(`${testFile}.2`);

    // log file of 50 bytes maximum, 2 backups
    log4js.clearAppenders();
    log4js.addAppender(
      require('../../lib/appenders/file').appender(testFile, log4js.layouts.basicLayout, 50, 2),
      'max-file-size-backups'
    );
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
    remove(testFile);
    remove(`${testFile}.1.gz`);
    remove(`${testFile}.2.gz`);

    // log file of 50 bytes maximum, 2 backups
    log4js.clearAppenders();
    log4js.addAppender(
      require('../../lib/appenders/file').appender(
        testFile, log4js.layouts.basicLayout, 50, 2, { compress: true }
      ),
      'max-file-size-backups'
    );
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

  batch.test('configure with fileAppender', (t) => {
    // this config file defines one file appender (to ./tmp-tests.log)
    // and sets the log level for "tests" to WARN
    log4js.configure('./test/tap/log4js.json');
    const logger = log4js.getLogger('tests');
    logger.info('this should not be written to the file');
    logger.warn('this should be written to the file');

    // wait for the file system to catch up
    setTimeout(() => {
      fs.readFile('tmp-tests.log', 'utf8', (err, contents) => {
        t.include(contents, `this should be written to the file${EOL}`);
        t.equal(contents.indexOf('this should not be written to the file'), -1);
        t.end();
      });
    }, 100);
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
            }
          }
        }
      }
    );

    fileAppender.appender('test1.log', null, 100);
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
