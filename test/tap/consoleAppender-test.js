'use strict';

const test = require('tap').test;
const sandbox = require('@log4js-node/sandboxed-module');
const consoleAppender = require('../../lib/appenders/console');

test('log4js console appender', (batch) => {
  batch.test('should export a configure function', (t) => {
    t.type(consoleAppender.configure, 'function');
    t.end();
  });

  batch.test('should use default layout if none specified', (t) => {
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
      appenders: { console: { type: 'console' } },
      categories: { default: { appenders: ['console'], level: 'DEBUG' } }
    });

    log4js.getLogger().info('blah');

    t.match(messages[0], /.*default.*blah/);
    t.end();
  });

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
