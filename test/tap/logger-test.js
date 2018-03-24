'use strict';

const test = require('tap').test;
const debug = require('debug')('log4js:test.logger');
const levels = require('../../lib/levels');
const sandbox = require('@log4js-node/sandboxed-module');

const events = [];
const Logger = sandbox.require(
  '../../lib/logger',
  {
    requires: {
      './levels': levels,
      './clustering': {
        isMaster: () => true,
        onlyOnMaster: fn => fn(),
        send: (evt) => {
          debug('fake clustering got event:', evt);
          events.push(evt);
        }
      }
    }
  }
);

const testConfig = {
  level: levels.TRACE
};

test('../../lib/logger', (batch) => {
  batch.beforeEach((done) => {
    events.length = 0;
    testConfig.level = levels.TRACE;
    done();
  });

  batch.test('constructor with no parameters', (t) => {
    t.throws(
      () => new Logger(),
      new Error('No category provided.')
    );
    t.end();
  });

  batch.test('constructor with category', (t) => {
    const logger = new Logger('cheese');
    t.equal(logger.category, 'cheese', 'should use category');
    t.equal(logger.level, levels.OFF, 'should use OFF log level');
    t.end();
  });

  batch.test('set level should delegate', (t) => {
    const logger = new Logger('cheese');
    logger.level = 'debug';
    t.equal(logger.category, 'cheese', 'should use category');
    t.equal(logger.level, levels.DEBUG, 'should use level');
    t.end();
  });

  batch.test('isLevelEnabled', (t) => {
    const logger = new Logger('cheese');
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
    logger.level = 'INFO';
    t.notOk(logger.isTraceEnabled());
    t.notOk(logger.isDebugEnabled());
    t.ok(logger.isInfoEnabled());
    t.ok(logger.isWarnEnabled());
    t.ok(logger.isErrorEnabled());
    t.ok(logger.isFatalEnabled());
    t.end();
  });

  batch.test('should send log events to dispatch function', (t) => {
    const logger = new Logger('cheese');
    logger.level = 'debug';
    logger.debug('Event 1');
    logger.debug('Event 2');
    logger.debug('Event 3');

    t.equal(events.length, 3);
    t.equal(events[0].data[0], 'Event 1');
    t.equal(events[1].data[0], 'Event 2');
    t.equal(events[2].data[0], 'Event 3');
    t.end();
  });

  batch.test('should add context values to every event', (t) => {
    const logger = new Logger('fromage');
    logger.level = 'debug';
    logger.debug('Event 1');
    logger.addContext('cheese', 'edam');
    logger.debug('Event 2');
    logger.debug('Event 3');
    logger.addContext('biscuits', 'timtam');
    logger.debug('Event 4');
    logger.removeContext('cheese');
    logger.debug('Event 5');
    logger.clearContext();
    logger.debug('Event 6');

    t.equal(events.length, 6);
    t.same(events[0].context, {});
    t.same(events[1].context, { cheese: 'edam' });
    t.same(events[2].context, { cheese: 'edam' });
    t.same(events[3].context, { cheese: 'edam', biscuits: 'timtam' });
    t.same(events[4].context, { biscuits: 'timtam' });
    t.same(events[5].context, {});
    t.end();
  });

  batch.test('should not break when log data has no toString', (t) => {
    const logger = new Logger('thing');
    logger.level = 'debug';
    logger.info('Just testing ', Object.create(null));

    t.equal(events.length, 1);
    t.end();
  });

  batch.end();
});
