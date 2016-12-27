'use strict';

const test = require('tap').test;
const levels = require('../../lib/levels');
const loggerModule = require('../../lib/logger');

const Logger = loggerModule.Logger;

test('../../lib/logger', (batch) => {
  batch.test('constructor with no parameters', (t) => {
    const logger = new Logger();
    t.equal(logger.category, Logger.DEFAULT_CATEGORY, 'should use default category');
    t.equal(logger.level, levels.TRACE, 'should use TRACE log level');
    t.end();
  });

  batch.test('constructor with category', (t) => {
    const logger = new Logger('cheese');
    t.equal(logger.category, 'cheese', 'should use category');
    t.equal(logger.level, levels.TRACE, 'should use TRACE log level');
    t.end();
  });

  batch.test('constructor with category and level', (t) => {
    const logger = new Logger('cheese', 'debug');
    t.equal(logger.category, 'cheese', 'should use category');
    t.equal(logger.level, levels.DEBUG, 'should use level');
    t.end();
  });

  batch.test('isLevelEnabled', (t) => {
    const logger = new Logger('cheese', 'info');
    const functions = [
      'isTraceEnabled', 'isDebugEnabled', 'isInfoEnabled',
      'isWarnEnabled', 'isErrorEnabled', 'isFatalEnabled'
    ];
    t.test('should provide a level enabled function for all levels', (subtest) => {
      subtest.plan(functions.length);
      functions.forEach((fn) => {
        subtest.type(logger[fn], 'function');
      });
    });
    t.test('should return the right values', (subtest) => {
      subtest.notOk(logger.isTraceEnabled());
      subtest.notOk(logger.isDebugEnabled());
      subtest.ok(logger.isInfoEnabled());
      subtest.ok(logger.isWarnEnabled());
      subtest.ok(logger.isErrorEnabled());
      subtest.ok(logger.isFatalEnabled());
      subtest.end();
    });
    t.end();
  });

  batch.test('should emit log events', (t) => {
    const events = [];
    const logger = new Logger();
    logger.addListener('log', (logEvent) => {
      events.push(logEvent);
    });
    logger.debug('Event 1');
    loggerModule.disableAllLogWrites();
    logger.debug('Event 2');
    loggerModule.enableAllLogWrites();
    logger.debug('Event 3');

    t.test('when log writes are enabled', (assert) => {
      assert.equal(events[0].data[0], 'Event 1');
      assert.end();
    });

    t.test('but not when log writes are disabled', (assert) => {
      assert.equal(events.length, 2);
      assert.equal(events[1].data[0], 'Event 3');
      assert.end();
    });
    t.end();
  });

  batch.end();
});
