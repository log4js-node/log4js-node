'use strict';

const test = require('tap').test;
const fs = require('fs');
const path = require('path');
const log4js = require('../../lib/log4js');
const EOL = require('os').EOL || '\n';

function remove(filename) {
  try {
    fs.unlinkSync(filename);
  } catch (e) {
    // doesn't really matter if it failed
  }
}

test('log4js fileSyncAppender', (batch) => {
  batch.test('with default fileSyncAppender settings', (t) => {
    const testFile = path.join(__dirname, '/fa-default-sync-test.log');
    const logger = log4js.getLogger('default-settings');
    remove(testFile);

    t.tearDown(() => {
      remove(testFile);
    });

    log4js.configure({
      appenders: { sync: { type: 'fileSync', filename: testFile } },
      categories: { default: { appenders: ['sync'], level: 'debug' } }
    });

    logger.info('This should be in the file.');

    fs.readFile(testFile, 'utf8', (err, fileContents) => {
      t.include(fileContents, `This should be in the file.${EOL}`);
      t.match(
        fileContents,
        /\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}] \[INFO] default-settings - /
      );
      t.end();
    });
  });

  batch.test('with a max file size and no backups', (t) => {
    const testFile = path.join(__dirname, '/fa-maxFileSize-sync-test.log');
    const logger = log4js.getLogger('max-file-size');

    remove(testFile);
    remove(`${testFile}.1`);

    t.tearDown(() => {
      remove(testFile);
      remove(`${testFile}.1`);
    });

    // log file of 100 bytes maximum, no backups
    log4js.configure({
      appenders: { sync: { type: 'fileSync', filename: testFile, maxLogSize: 100, backups: 0 } },
      categories: { default: { appenders: ['sync'], level: 'debug' } }
    });
    logger.info('This is the first log message.');
    logger.info('This is an intermediate log message.');
    logger.info('This is the second log message.');

    t.test('log file should only contain the second message', (assert) => {
      fs.readFile(testFile, 'utf8', (err, fileContents) => {
        assert.include(fileContents, `This is the second log message.${EOL}`);
        assert.equal(fileContents.indexOf('This is the first log message.'), -1);
        assert.end();
      });
    });

    t.test('there should be two test files', (assert) => {
      fs.readdir(__dirname, (err, files) => {
        const logFiles = files.filter(
          file => file.includes('fa-maxFileSize-sync-test.log')
        );
        assert.equal(logFiles.length, 2);
        assert.end();
      });
    });
    t.end();
  });

  batch.test('with a max file size and 2 backups', (t) => {
    const testFile = path.join(__dirname, '/fa-maxFileSize-with-backups-sync-test.log');
    const logger = log4js.getLogger('max-file-size-backups');
    remove(testFile);
    remove(`${testFile}.1`);
    remove(`${testFile}.2`);

    t.tearDown(() => {
      remove(testFile);
      remove(`${testFile}.1`);
      remove(`${testFile}.2`);
    });

    // log file of 50 bytes maximum, 2 backups
    log4js.configure({
      appenders: { sync: { type: 'fileSync', filename: testFile, maxLogSize: 50, backups: 2 } },
      categories: { default: { appenders: ['sync'], level: 'debug' } }
    });
    logger.info('This is the first log message.');
    logger.info('This is the second log message.');
    logger.info('This is the third log message.');
    logger.info('This is the fourth log message.');

    t.test('the log files', (assert) => {
      assert.plan(5);
      fs.readdir(__dirname, (err, files) => {
        const logFiles = files.filter(
          file => file.includes('fa-maxFileSize-with-backups-sync-test.log')
        );
        assert.equal(logFiles.length, 3, 'should be 3 files');
        assert.same(logFiles, [
          'fa-maxFileSize-with-backups-sync-test.log',
          'fa-maxFileSize-with-backups-sync-test.log.1',
          'fa-maxFileSize-with-backups-sync-test.log.2'
        ], 'should be named in sequence');

        fs.readFile(path.join(__dirname, logFiles[0]), 'utf8', (e, contents) => {
          assert.include(contents, 'This is the fourth log message.');
        });
        fs.readFile(path.join(__dirname, logFiles[1]), 'utf8', (e, contents) => {
          assert.include(contents, 'This is the third log message.');
        });
        fs.readFile(path.join(__dirname, logFiles[2]), 'utf8', (e, contents) => {
          assert.include(contents, 'This is the second log message.');
        });
      });
    });
    t.end();
  });

  batch.test('configure with fileSyncAppender', (t) => {
    // this config defines one file appender (to ./tmp-sync-tests.log)
    // and sets the log level for "tests" to WARN
    log4js.configure({
      appenders: { sync: {
        type: 'fileSync',
        filename: 'tmp-sync-tests.log',
        layout: { type: 'messagePassThrough' }
      }
      },
      categories: {
        default: { appenders: ['sync'], level: 'debug' },
        tests: { appenders: ['sync'], level: 'warn' }
      }
    });
    const logger = log4js.getLogger('tests');
    logger.info('this should not be written to the file');
    logger.warn('this should be written to the file');

    fs.readFile('tmp-sync-tests.log', 'utf8', (err, contents) => {
      t.include(contents, `this should be written to the file${EOL}`);
      t.equal(contents.indexOf('this should not be written to the file'), -1);
      t.end();
    });
  });

  batch.end();
});
