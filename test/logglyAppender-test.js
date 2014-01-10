"use strict";
var assert = require('assert')
, vows = require('vows')
, layouts = require('../lib/layouts')
, sandbox = require('sandboxed-module');

vows.describe('../lib/appenders/loggly').addBatch({
  'appender': {
    topic: function() {
      var messages = []
      , fakeLoggly = {
        log: function(msg) { messages.push(msg); }
      }
      , appenderModule = sandbox.require(
        '../lib/appenders/loggly',
        {
          globals: {
            'loggly': fakeLoggly
          }
        }
      )
      , appender = appenderModule.appender(layouts.messagePassThroughLayout);

      appender({ data: ["blah"] });
      return messages;
    },

    'should output to loggly': function(messages) {
      assert.equal(messages[0], 'blah');
    }
  }
          
}).exportTo(module);
