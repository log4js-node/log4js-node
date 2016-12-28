'use strict';

const test = require('tap').test;
const Level = require('../../lib/levels');
const log4js = require('../../lib/log4js');
const loggerModule = require('../../lib/logger');

const Logger = loggerModule.Logger;

test('../../lib/logger', (batch) => {
  batch.test('creating a new log level', (t) => {
    Level.forName('DIAG', 6000);
    const logger = new Logger();

    t.test('should export new log level in levels module', (assert) => {
      assert.ok(Level.DIAG);
      assert.equal(Level.DIAG.levelStr, 'DIAG');
      assert.equal(Level.DIAG.level, 6000);
      assert.end();
    });

    t.type(logger.diag, 'function', 'should create named function on logger prototype');
    t.type(logger.isDiagEnabled, 'function', 'should create isLevelEnabled function on logger prototype');
    t.end();
  });

  batch.test('creating a new log level with underscores', (t) => {
    Level.forName('NEW_LEVEL_OTHER', 6000);
    const logger = new Logger();

    t.test('should export new log level to levels module', (assert) => {
      assert.ok(Level.NEW_LEVEL_OTHER);
      assert.equal(Level.NEW_LEVEL_OTHER.levelStr, 'NEW_LEVEL_OTHER');
      assert.equal(Level.NEW_LEVEL_OTHER.level, 6000);
      assert.end();
    });

    t.type(
      logger.newLevelOther, 'function',
      'should create named function on logger prototype in camel case'
    );
    t.type(
      logger.isNewLevelOtherEnabled, 'function',
      'should create named isLevelEnabled function on logger prototype in camel case'
    );
    t.end();
  });

  batch.test('creating log events containing newly created log level', (t) => {
    const events = [];
    const logger = new Logger();
    logger.addListener('log', (logEvent) => {
      events.push(logEvent);
    });

    logger.log(Level.forName('LVL1', 6000), 'Event 1');
    logger.log(Level.getLevel('LVL1'), 'Event 2');
    logger.log('LVL1', 'Event 3');
    logger.lvl1('Event 4');

    logger.setLevel(Level.forName('LVL2', 7000));
    logger.lvl1('Event 5');

    t.test('should show log events with new log level', (assert) => {
      assert.equal(events[0].level.toString(), 'LVL1');
      assert.equal(events[0].data[0], 'Event 1');

      assert.equal(events[1].level.toString(), 'LVL1');
      assert.equal(events[1].data[0], 'Event 2');

      assert.equal(events[2].level.toString(), 'LVL1');
      assert.equal(events[2].data[0], 'Event 3');

      assert.equal(events[3].level.toString(), 'LVL1');
      assert.equal(events[3].data[0], 'Event 4');
      assert.end();
    });

    t.equal(events.length, 4, 'should not be present if min log level is greater than newly created level');
    t.end();
  });

  batch.test('creating a new log level with incorrect parameters', (t) => {
    log4js.levels.forName(9000, 'FAIL_LEVEL_1');
    log4js.levels.forName('FAIL_LEVEL_2');

    t.test('should fail to create the level', (assert) => {
      assert.notOk(Level.FAIL_LEVEL_1);
      assert.notOk(Level.FAIL_LEVEL_2);
      assert.end();
    });
    t.end();
  });

  batch.test('calling log with an undefined log level', (t) => {
    const events = [];
    const logger = new Logger();
    logger.addListener('log', (logEvent) => {
      events.push(logEvent);
    });

    logger.log('LEVEL_DOES_NEXT_EXIST', 'Event 1');
    logger.log(Level.forName('LEVEL_DOES_NEXT_EXIST'), 'Event 2');

    t.equal(events[0].level.toString(), 'INFO', 'should fall back to INFO');
    t.equal(events[1].level.toString(), 'INFO', 'should fall back to INFO');
    t.end();
  });

  batch.test('creating a new level with an existing level name', (t) => {
    const events = [];
    const logger = new Logger();
    logger.addListener('log', (logEvent) => {
      events.push(logEvent);
    });

    logger.log(log4js.levels.forName('MY_LEVEL', 9000), 'Event 1');
    logger.log(log4js.levels.forName('MY_LEVEL', 8000), 'Event 1');

    t.equal(events[0].level.level, 9000, 'should override the existing log level');
    t.equal(events[1].level.level, 8000, 'should override the existing log level');
    t.end();
  });
  batch.end();
});
