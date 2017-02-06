'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');

test('log4js console appender', (batch) => {
  batch.test('should output to console', (t) => {
    const messages = [];
    const fakeConsole = {
      log: function (msg) {
        messages.push(msg);
      }
    };
    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        globals: {
          console: fakeConsole
        }
      }
    );
    log4js.configure({
      appenders: { console: { type: 'console', layout: { type: 'messagePassThrough' } } },
      categories: { default: { appenders: ['console'], level: 'DEBUG' } }
    });

    log4js.getLogger().info('blah');

    t.equal(messages[0], 'blah');
    t.end();
  });

  batch.end();
});
