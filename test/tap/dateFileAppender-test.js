'use strict';

const test = require('tap').test;
const path = require('path');
const fs = require('fs');
const log4js = require('../../lib/log4js');
const EOL = require('os').EOL || '\n';

function removeFile(filename) {
  try {
    fs.unlinkSync(path.join(__dirname, filename));
  } catch (e) {
    // doesn't matter
  }
}

test('../../lib/appenders/dateFile', (batch) => {
  batch.test('with default settings', (t) => {
    const testFile = path.join(__dirname, 'date-appender-default.log');
    log4js.configure({
      appenders: { date: { type: 'dateFile', filename: testFile } },
      categories: { default: { appenders: ['date'], level: 'DEBUG' } }
    });

    const logger = log4js.getLogger('default-settings');

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
    log4js.configure({
      appenders: {
        date: {
          type: 'dateFile',
          filename: 'test/tap/date-file-test.log',
          pattern: '-from-MM-dd',
          layout: { type: 'messagePassThrough' }
        }
      },
      categories: { default: { appenders: ['date'], level: 'WARN' } }
    });
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
      appenders: {
        date: {
          category: 'tests',
          type: 'dateFile',
          filename: 'test/tap/date-file-test',
          pattern: '-from-MM-dd.log',
          alwaysIncludePattern: true,
          layout: {
            type: 'messagePassThrough'
          }
        }
      },
      categories: { default: { appenders: ['date'], level: 'debug' } }
    };

    const thisTime = format.asString(options.appenders.date.pattern, new Date());
    fs.writeFileSync(
      path.join(__dirname, `date-file-test${thisTime}`),
      `this is existing data${EOL}`,
      'utf8'
    );
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

  batch.test('should flush logs on shutdown', (t) => {
    const testFile = path.join(__dirname, 'date-appender-default.log');
    log4js.configure({
      appenders: { test: { type: 'dateFile', filename: testFile } },
      categories: { default: { appenders: ['test'], level: 'trace' } }
    });
    const logger = log4js.getLogger('default-settings');

    logger.info('1');
    logger.info('2');
    logger.info('3');
    t.teardown(() => { removeFile('date-appender-default.log'); });

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

  batch.end();
});
