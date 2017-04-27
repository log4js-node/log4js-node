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
  logger.info('This should not be logged yet.');

  t.plan(3);
  t.equal(output.length, 0, 'Nothing should be logged until configure is called.');

  log4js.configure({
    appenders: { stdout: { type: 'stdout' } },
    categories: { default: { appenders: ['stdout'], level: 'debug' } }
  });
  logger.info('This should go to stdout.');

  t.equal(output.length, 1, 'It should log to stdout.');
  t.equal(output[0].data[0], 'This should go to stdout.', 'It should log the message.');
  t.end();
});
