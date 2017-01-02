'use strict';

// This test shows unexpected behaviour for log4js.configure() in log4js-node@0.4.3 and earlier:
// 1) log4js.configure(), log4js.configure(null),
// log4js.configure({}), log4js.configure(<some object with no levels prop>)
// all set all loggers levels to trace, even if they were previously set to something else.
// 2) log4js.configure({levels:{}}), log4js.configure({levels: {foo:
// bar}}) leaves previously set logger levels intact.
//
const test = require('tap').test;

// setup the configurations we want to test
const configs = [
  undefined,
  null,
  {},
  { foo: 'bar' },
  { levels: null },
  { levels: {} },
  { levels: { foo: 'bar' } },
  { levels: { A: 'INFO' } }
];

test('log4js dodgy config', (batch) => {
  const log4js = require('../../lib/log4js');
  const logger = log4js.getLogger('test-logger');
  const error = log4js.levels.ERROR;
  logger.setLevel('ERROR');

  configs.forEach((config) => {
    batch.test(`config of ${config} should not change logger level`, (t) => {
      log4js.configure(config);
      t.equal(logger.level, error);
      t.end();
    });
  });
  batch.end();
});
