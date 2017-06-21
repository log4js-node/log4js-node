'use strict';

const test = require('tap').test;
const log4js = require('../../lib/log4js');

test('subcategories', (batch) => {
  batch.test('loggers created after levels configuration is loaded', (t) => {
    log4js.configure({
      appenders: { stdout: { type: 'stdout' } },
      categories: {
        default: { appenders: ['stdout'], level: 'TRACE' },
        sub1: { appenders: ['stdout'], level: 'WARN' },
        'sub1.sub11': { appenders: ['stdout'], level: 'TRACE' },
        'sub1.sub11.sub111': { appenders: ['stdout'], level: 'WARN' },
        'sub1.sub12': { appenders: ['stdout'], level: 'INFO' }
      }
    });

    const loggers = {
      sub1: log4js.getLogger('sub1'), // WARN
      sub11: log4js.getLogger('sub1.sub11'), // TRACE
      sub111: log4js.getLogger('sub1.sub11.sub111'), // WARN
      sub12: log4js.getLogger('sub1.sub12'), // INFO

      sub13: log4js.getLogger('sub1.sub13'), // Inherits sub1: WARN
      sub112: log4js.getLogger('sub1.sub11.sub112'), // Inherits sub1.sub11: TRACE
      sub121: log4js.getLogger('sub1.sub12.sub121'), // Inherits sub12: INFO
      sub0: log4js.getLogger('sub0') // Not defined, not inherited: TRACE
    };

    t.test('check logger levels', (assert) => {
      assert.equal(loggers.sub1.level, log4js.levels.WARN);
      assert.equal(loggers.sub11.level, log4js.levels.TRACE);
      assert.equal(loggers.sub111.level, log4js.levels.WARN);
      assert.equal(loggers.sub12.level, log4js.levels.INFO);

      assert.equal(loggers.sub13.level, log4js.levels.WARN);
      assert.equal(loggers.sub112.level, log4js.levels.TRACE);
      assert.equal(loggers.sub121.level, log4js.levels.INFO);
      assert.equal(loggers.sub0.level, log4js.levels.TRACE);
      assert.end();
    });

    t.end();
  });

  batch.test('loggers created before levels configuration is loaded', (t) => {
    // reset to defaults
    log4js.configure({
      appenders: { stdout: { type: 'stdout' } },
      categories: { default: { appenders: ['stdout'], level: 'info' } }
    });

    // these should all get the default log level of INFO
    const loggers = {
      sub1: log4js.getLogger('sub1'), // WARN
      sub11: log4js.getLogger('sub1.sub11'), // TRACE
      sub111: log4js.getLogger('sub1.sub11.sub111'), // WARN
      sub12: log4js.getLogger('sub1.sub12'), // INFO

      sub13: log4js.getLogger('sub1.sub13'), // Inherits sub1: WARN
      sub112: log4js.getLogger('sub1.sub11.sub112'), // Inherits sub1.sub11: TRACE
      sub121: log4js.getLogger('sub1.sub12.sub121'), // Inherits sub12: INFO
      sub0: log4js.getLogger('sub0') // Not defined, not inherited: TRACE
    };

    log4js.configure({
      appenders: { stdout: { type: 'stdout' } },
      categories: {
        default: { appenders: ['stdout'], level: 'TRACE' },
        sub1: { appenders: ['stdout'], level: 'WARN' },
        'sub1.sub11': { appenders: ['stdout'], level: 'TRACE' },
        'sub1.sub11.sub111': { appenders: ['stdout'], level: 'WARN' },
        'sub1.sub12': { appenders: ['stdout'], level: 'INFO' }
      }
    });

    t.test('should still get new levels', (assert) => {
      // can't use .equal because by calling log4js.configure we create new instances
      assert.same(loggers.sub1.level, log4js.levels.WARN);
      assert.same(loggers.sub11.level, log4js.levels.TRACE);
      assert.same(loggers.sub111.level, log4js.levels.WARN);
      assert.same(loggers.sub12.level, log4js.levels.INFO);

      assert.same(loggers.sub13.level, log4js.levels.WARN);
      assert.same(loggers.sub112.level, log4js.levels.TRACE);
      assert.same(loggers.sub121.level, log4js.levels.INFO);
      assert.same(loggers.sub0.level, log4js.levels.TRACE);
      assert.end();
    });
    t.end();
  });

  batch.test('setting level on subcategories should not set parent level', (t) => {
    log4js.configure({
      appenders: { stdout: { type: 'stdout' } },
      categories: {
        default: { appenders: ['stdout'], level: 'trace' },
        parent: { appenders: ['stdout'], level: 'error' }
      }
    });

    const logger = log4js.getLogger('parent');
    const subLogger = log4js.getLogger('parent.child');

    t.test('should inherit parent level', (assert) => {
      assert.same(subLogger.level, log4js.levels.ERROR);
      assert.end();
    });

    t.test('changing child level should not change parent level', (assert) => {
      subLogger.level = 'info';
      assert.same(subLogger.level, log4js.levels.INFO);
      assert.same(logger.level, log4js.levels.ERROR);
      assert.end();
    });

    t.end();
  });

  batch.end();
});
