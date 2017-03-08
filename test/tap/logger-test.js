'use strict';

const test = require('tap').test;
const levels = require('../../lib/levels')();
const loggerModule = require('../../lib/logger')(levels);

const Logger = loggerModule.Logger;
const testDispatcher = {
  events: [],
  dispatch: function (evt) {
    this.events.push(evt);
  }
};
const dispatch = testDispatcher.dispatch.bind(testDispatcher);

test('../../lib/logger', (batch) => {
  batch.test('constructor with no parameters', (t) => {
    t.throws(
      () => new Logger(),
      new Error('No dispatch function provided.')
    );
    t.end();
  });

  batch.test('constructor with only dispatch', (t) => {
    const logger = new Logger(dispatch);
    t.equal(logger.category, Logger.DEFAULT_CATEGORY, 'should use default category');
    t.equal(logger.level, levels.TRACE, 'should use TRACE log level');
    t.end();
  });

  batch.test('constructor with category', (t) => {
    const logger = new Logger(dispatch, 'cheese');
    t.equal(logger.category, 'cheese', 'should use category');
    t.equal(logger.level, levels.TRACE, 'should use TRACE log level');
    t.end();
  });

  batch.test('constructor with category and level', (t) => {
    const logger = new Logger(dispatch, 'cheese', 'debug');
    t.equal(logger.category, 'cheese', 'should use category');
    t.equal(logger.level, levels.DEBUG, 'should use level');
    t.end();
  });

  batch.test('isLevelEnabled', (t) => {
    const logger = new Logger(dispatch, 'cheese', 'info');
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

  batch.test('should send log events to dispatch function', (t) => {
    const logger = new Logger(dispatch);
    logger.debug('Event 1');
    logger.debug('Event 2');
    logger.debug('Event 3');
    const events = testDispatcher.events;

    t.equal(events.length, 3);
    t.equal(events[0].data[0], 'Event 1');
    t.equal(events[1].data[0], 'Event 2');
    t.equal(events[2].data[0], 'Event 3');
    t.end();
  });

  batch.end();
});
