'use strict';

const test = require('tap').test;
const layouts = require('../../lib/layouts');
const sandbox = require('sandboxed-module');

test('log4js console appender', (batch) => {
  batch.test('should output to console', (t) => {
    const messages = [];
    const fakeConsole = {
      log: function (msg) {
        messages.push(msg);
      }
    };
    const appenderModule = sandbox.require(
      '../../lib/appenders/console',
      {
        globals: {
          console: fakeConsole
        }
      }
    );

    const appender = appenderModule.appender(layouts.messagePassThroughLayout);
    appender({ data: ['blah'] });

    t.equal(messages[0], 'blah');
    t.end();
  });

  batch.end();
});
