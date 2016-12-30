'use strict';

const test = require('tap').test;
const path = require('path');
const fs = require('fs');
const sandbox = require('sandboxed-module');
const log4js = require('../../lib/log4js');
const EOL = require('os').EOL || '\n';

function removeFile(filename) {
  try {
    fs.unlinkSync(path.join(__dirname, filename));
  } catch (e) {}
}

test('../../lib/appenders/dateFile', (batch) => {
  batch.test('adding multiple dateFileAppenders', (t) => {
    const listenersCount = process.listeners('exit').length;
    const dateFileAppender = require('../../lib/appenders/dateFile');
    let count = 5;
    let logfile;

    while (count--) {
      logfile = path.join(__dirname, `datefa-default-test${count}.log`);
      log4js.addAppender(dateFileAppender.appender(logfile));
    }

    t.teardown(() => {
      removeFile('datefa-default-test0.log');
      removeFile('datefa-default-test1.log');
      removeFile('datefa-default-test2.log');
      removeFile('datefa-default-test3.log');
      removeFile('datefa-default-test4.log');
    });

    t.equal(process.listeners('exit').length, listenersCount + 1, 'should only add one exit listener');
    t.end();
  });

  batch.test('exit listener', (t) => {
    let exitListener;
    const openedFiles = [];

    const dateFileAppender = sandbox.require(
      '../../lib/appenders/dateFile',
      {
        globals: {
          process: {
            on: function (evt, listener) {
              exitListener = listener;
            }
          }
        },
        requires: {
          streamroller: {
            DateRollingFileStream: function (filename) {
              openedFiles.push(filename);

              this.end = function () {
                openedFiles.shift();
              };
            }
          }
        }
      }
    );

    for (let i = 0; i < 5; i += 1) {
      dateFileAppender.appender(`test${i}`);
    }
    t.equal(openedFiles.length, 5);
    exitListener();
    t.equal(openedFiles.length, 0, 'should close all opened files');
    t.end();
  });

  batch.test('with default settings', (t) => {
    const testFile = path.join(__dirname, 'date-appender-default.log');
    const appender = require('../../lib/appenders/dateFile').appender(testFile);
    const logger = log4js.getLogger('default-settings');
    log4js.clearAppenders();
    log4js.addAppender(appender, 'default-settings');

    logger.info('This should be in the file.');
    t.teardown(() => { removeFile('date-appender-default.log'); });

    setTimeout(() => {
      fs.readFile(testFile, 'utf8', (err, contents) => {
        t.include(contents, 'This should be in the file');
        t.match(
          contents,
          /\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}] \[INFO] default-settings - /
        );
        t.end();
      });
    }, 100);
  });

  batch.test('configure with dateFileAppender', (t) => {
    // this config file defines one file appender (to ./date-file-test.log)
    // and sets the log level for "tests" to WARN
    log4js.configure('test/tap/with-dateFile.json');
    const logger = log4js.getLogger('tests');
    logger.info('this should not be written to the file');
    logger.warn('this should be written to the file');

    t.teardown(() => { removeFile('date-file-test.log'); });

    fs.readFile(path.join(__dirname, 'date-file-test.log'), 'utf8', (err, contents) => {
      t.include(contents, `this should be written to the file${EOL}`);
      t.equal(contents.indexOf('this should not be written to the file'), -1);
      t.end();
    });
  });

  batch.test('configure with options.alwaysIncludePattern', (t) => {
    const format = require('date-format');

    const options = {
      appenders: [
        {
          category: 'tests',
          type: 'dateFile',
          filename: 'test/tap/date-file-test',
          pattern: '-from-MM-dd.log',
          alwaysIncludePattern: true,
          layout: {
            type: 'messagePassThrough'
          }
        }
      ]
    };

    const thisTime = format.asString(options.appenders[0].pattern, new Date());
    fs.writeFileSync(
      path.join(__dirname, `date-file-test${thisTime}`),
      `this is existing data${EOL}`,
      'utf8'
    );
    log4js.clearAppenders();
    log4js.configure(options);
    const logger = log4js.getLogger('tests');
    logger.warn('this should be written to the file with the appended date');

    t.teardown(() => { removeFile(`date-file-test${thisTime}`); });

    // wait for filesystem to catch up
    setTimeout(() => {
      fs.readFile(path.join(__dirname, `date-file-test${thisTime}`), 'utf8', (err, contents) => {
        t.include(contents, 'this should be written to the file with the appended date');
        t.include(contents, 'this is existing data', 'should not overwrite the file on open (issue #132)');
        t.end();
      });
    }, 100);
  });

  batch.test('configure with cwd option', (t) => {
    let fileOpened;

    const appender = sandbox.require(
      '../../lib/appenders/dateFile',
      {
        requires: {
          streamroller: {
            DateRollingFileStream: function (file) {
              fileOpened = file;
              return {
                on: function () {
                },
                end: function () {
                }
              };
            }
          }
        }
      }
    );

    appender.configure(
      {
        filename: 'whatever.log',
        maxLogSize: 10
      },
      { cwd: '/absolute/path/to' }
    );

    const expected = path.sep + path.join('absolute', 'path', 'to', 'whatever.log');
    t.equal(fileOpened, expected, 'should prepend options.cwd to config.filename');
    t.end();
  });

  batch.end();
});
