'use strict';

const test = require('tap').test;
const fs = require('fs');
const os = require('os');

const EOL = os.EOL || '\n';

function remove(filename) {
  try {
    fs.unlinkSync(filename);
  } catch (e) {
    // doesn't really matter if it failed
  }
}

test('log4js logLevelFilter', (batch) => {
  batch.test('appender', (t) => {
    const log4js = require('../../lib/log4js');
    const logEvents = [];

    log4js.clearAppenders();
    log4js.addAppender(
      require('../../lib/appenders/logLevelFilter')
        .appender(
          'ERROR',
          undefined,
          (evt) => {
            logEvents.push(evt);
          }
        ),
      'logLevelTest'
    );

    const logger = log4js.getLogger('logLevelTest');
    logger.debug('this should not trigger an event');
    logger.warn('neither should this');
    logger.error('this should, though');
    logger.fatal('so should this');

    t.test('should only pass log events greater than or equal to its own level', (assert) => {
      assert.equal(logEvents.length, 2);
      assert.equal(logEvents[0].data[0], 'this should, though');
      assert.equal(logEvents[1].data[0], 'so should this');
      assert.end();
    });
    t.end();
  });

  batch.test('configure', (t) => {
    const log4js = require('../../lib/log4js');

    remove(`${__dirname}/logLevelFilter.log`);
    remove(`${__dirname}/logLevelFilter-warnings.log`);
    remove(`${__dirname}/logLevelFilter-debugs.log`);

    log4js.configure('test/tap/with-logLevelFilter.json');
    const logger = log4js.getLogger('tests');
    logger.debug('debug');
    logger.info('info');
    logger.error('error');
    logger.warn('warn');
    logger.debug('debug');
    logger.trace('trace');
    // wait for the file system to catch up
    setTimeout(() => {
      t.test('tmp-tests.log should contain all log messages', (assert) => {
        fs.readFile(`${__dirname}/logLevelFilter.log`, 'utf8', (err, contents) => {
          const messages = contents.trim().split(EOL);
          assert.same(messages, ['debug', 'info', 'error', 'warn', 'debug', 'trace']);
          assert.end();
        });
      });
      t.test('tmp-tests-warnings.log should contain only error and warning logs', (assert) => {
        fs.readFile(`${__dirname}/logLevelFilter-warnings.log`, 'utf8', (err, contents) => {
          const messages = contents.trim().split(EOL);
          assert.deepEqual(messages, ['error', 'warn']);
          assert.end();
        });
      });
      t.test('tmp-tests-debugs.log should contain only trace and debug logs', (assert) => {
        fs.readFile(`${__dirname}/logLevelFilter-debugs.log`, 'utf8', (err, contents) => {
          const messages = contents.trim().split(EOL);
          assert.deepEqual(messages, ['debug', 'debug', 'trace']);
          assert.end();
        });
      });
      t.end();
    }, 500);
  });

  batch.end();
});
