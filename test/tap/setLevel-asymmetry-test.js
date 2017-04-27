'use strict';

/* jshint loopfunc: true */
// This test shows an asymmetry between setLevel and isLevelEnabled
// (in log4js-node@0.4.3 and earlier):
// 1) setLevel("foo") works, but setLevel(log4js.levels.foo) silently
//    does not (sets the level to TRACE).
// 2) isLevelEnabled("foo") works as does isLevelEnabled(log4js.levels.foo).
//

const test = require('tap').test;
const log4js = require('../../lib/log4js');

const logger = log4js.getLogger('test-setLevel-asymmetry');

// Define the array of levels as string to iterate over.
const strLevels = ['Trace', 'Debug', 'Info', 'Warn', 'Error', 'Fatal'];
const log4jsLevels = strLevels.map(log4js.levels.getLevel);

test('log4js setLevel', (batch) => {
  strLevels.forEach((strLevel) => {
    batch.test(`is called with a ${strLevel} as string`, (t) => {
      const log4jsLevel = log4js.levels.getLevel(strLevel);

      t.test('should convert string to level correctly', (assert) => {
        logger.level = strLevel;
        log4jsLevels.forEach((level) => {
          assert.equal(
            logger.isLevelEnabled(level),
            log4jsLevel.isLessThanOrEqualTo(level)
          );
        });
        assert.end();
      });

      t.test('should also accept a Level', (assert) => {
        logger.level = log4jsLevel;
        log4jsLevels.forEach((level) => {
          assert.equal(
            logger.isLevelEnabled(level),
            log4jsLevel.isLessThanOrEqualTo(level)
          );
        });
        assert.end();
      });

      t.end();
    });
  });
  batch.end();
});
