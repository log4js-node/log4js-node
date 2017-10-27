'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');
process.env.LOG4JS_USE_STACKTRACE = true;

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
      appenders: { console: { type: 'console', layout: { type: 'pattern',  'pattern': '[%p] - %f : %l - %m' } } },
      categories: { default: { appenders: ['console'], level: 'DEBUG' } }
    });

    log4js.getLogger().info('LOG4JS_USE_STACKTRACE:' + process.env.LOG4JS_USE_STACKTRACE);

    t.equal(messages[0], '[INFO] - File path unavailable : Line number unavailable - LOG4JS_USE_STACKTRACE:true');
    t.end();
  });

  batch.end();
});
