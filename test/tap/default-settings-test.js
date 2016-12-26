'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');

test('default settings', (t) => {
  const output = [];

  const log4js = sandbox.require(
    '../../lib/log4js',
    {
      requires: {
        './appenders/stdout': {
          name: 'stdout',
          appender: function () {
            return function (evt) {
              output.push(evt);
            };
          },
          configure: function () {
            return this.appender();
          }
        }
      }
    }
  );

  const logger = log4js.getLogger('default-settings');

  logger.info('This should go to stdout.');

  t.plan(2);
  t.equal(output.length, 1, 'It should log to stdout.');
  t.equal(output[0].data[0], 'This should go to stdout.', 'It should log the message.');
  t.end();
});
