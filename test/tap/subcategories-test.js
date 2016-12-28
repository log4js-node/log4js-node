'use strict';

const test = require('tap').test;
const log4js = require('../../lib/log4js');
const levels = require('../../lib/levels');

test('subcategories', (batch) => {
  batch.test('loggers created after levels configuration is loaded', (t) => {
    log4js.configure({
      levels: {
        sub1: 'WARN',
        'sub1.sub11': 'TRACE',
        'sub1.sub11.sub111': 'WARN',
        'sub1.sub12': 'INFO'
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
      assert.equal(loggers.sub1.level, levels.WARN);
      assert.equal(loggers.sub11.level, levels.TRACE);
      assert.equal(loggers.sub111.level, levels.WARN);
      assert.equal(loggers.sub12.level, levels.INFO);

      assert.equal(loggers.sub13.level, levels.WARN);
      assert.equal(loggers.sub112.level, levels.TRACE);
      assert.equal(loggers.sub121.level, levels.INFO);
      assert.equal(loggers.sub0.level, levels.TRACE);
      assert.end();
    });

    t.end();
  });

  batch.test('loggers created before levels configuration is loaded', (t) => {
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
      levels: {
        sub1: 'WARN',
        'sub1.sub11': 'TRACE',
        'sub1.sub11.sub111': 'WARN',
        'sub1.sub12': 'INFO'
      }
    });

    t.test('check logger levels', (assert) => {
      assert.equal(loggers.sub1.level, levels.WARN);
      assert.equal(loggers.sub11.level, levels.TRACE);
      assert.equal(loggers.sub111.level, levels.WARN);
      assert.equal(loggers.sub12.level, levels.INFO);

      assert.equal(loggers.sub13.level, levels.WARN);
      assert.equal(loggers.sub112.level, levels.TRACE);
      assert.equal(loggers.sub121.level, levels.INFO);
      assert.equal(loggers.sub0.level, levels.TRACE);
      assert.end();
    });
    t.end();
  });
  batch.end();
});
