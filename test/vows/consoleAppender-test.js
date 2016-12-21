'use strict';

const assert = require('assert');
const vows = require('vows');
const layouts = require('../../lib/layouts');
const sandbox = require('sandboxed-module');

vows.describe('../../lib/appenders/console').addBatch({
  appender: {
    topic: function () {
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
      return messages;
    },

    'should output to console': function (messages) {
      assert.equal(messages[0], 'blah');
    }
  }

}).exportTo(module);
