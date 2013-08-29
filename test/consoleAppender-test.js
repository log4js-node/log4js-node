"use strict";
var should = require('should')
, sandbox = require('sandboxed-module');

describe('../lib/appenders/console', function() {
  var messages = [];

  before(function() {
    var fakeConsole = {
      log: function(msg) { messages.push(msg); }
    }
    , appenderModule = sandbox.require(
      '../lib/appenders/console',
      {
        globals: {
          'console': fakeConsole
        }
      }
    )
    , appender = appenderModule.configure(
      { layout: { type: "messagePassThrough" } }
    );

    appender({ data: ["blah"] });
  });

  it('should output to console', function() {
    messages.should.eql(["blah"]);
  });
          
});
