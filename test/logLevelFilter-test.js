"use strict";
var should = require('should')
, sandbox = require('sandboxed-module')
, log4js = require('../lib/log4js');

describe('log level filter', function() {
  describe('when configured correctly', function() {
    var events = [], logger;

    before(function() {
      var log4js_sandboxed = sandbox.require(
        '../lib/log4js',
        { requires: 
          { './appenders/console': function() {
            return function() { return function(evt) { events.push(evt); }; }; }
          }
        }
      );
      log4js_sandboxed.configure({
        appenders: {
          "console": { type: "console", layout: { type: "messagePassThrough" } },
          "errors only": {
            type: "logLevelFilter",
            allow: [ "ERROR", "FATAL" ],
            appender: "console"
          }
        },
        categories: {
          default: { level: "DEBUG", appenders: [ "errors only" ] }
        }
      });
      logger = log4js_sandboxed.getLogger("test");        
    });

    it('should pass events to an appender if they match', function() {
      logger.error("oh no");
      logger.fatal("boom");

      events.should.have.length(2);
      events[0].data[0].should.eql("oh no");
      events[1].data[0].should.eql("boom");
    });

    it('should not pass events to the appender if they do not match', function() {
      events.should.have.length(2);
      logger.debug("cheese");
      events.should.have.length(2);
      logger.info("yawn");
      events.should.have.length(2);
    });
  });

  it('should complain if it has no appender', function() {
    (function() {
      log4js.configure({
        appenders: {
          "errors": {
            type: "logLevelFilter",
            allow: [ "ERROR", "FATAL" ]
          }
        },
        categories: {
          default: { level: "DEBUG", appenders: [ "errors" ] }
        }
      });
    }).should.throw(/Missing an appender\./);
  });

  it('should complain if it has no list of allowed levels', function() {
    (function() {
      log4js.configure({
        appenders: {
          "console": { type: "console" },
          "errors": {
            type: "logLevelFilter",
            appender: "console"
          }
        },
        categories: {
          default: { level: "DEBUG", appenders: [ "errors" ] }
        }
      });
    }).should.throw(/No allowed log levels specified\./);
  });

  it('should complain if the referenced appender does not exist', function() {
    (function() {
      log4js.configure({
        appenders: {
          "errors": {
            type: "logLevelFilter",
            allow: [ "ERROR" ],
            appender: "console"
          }
        },
        categories: {
          default: { level: "DEBUG", appenders: [ "errors" ] }
        }
      });
    }).should.throw(/Appender 'console' not found\./);
  });

  it('should complain if the list of levels is not valid', function() {
    (function() {
      log4js.configure({
        appenders: {
          "errors": {
            type: "logLevelFilter",
            allow: [ "cheese", "biscuits", "ERROR" ],
            appender: { type: "console" }
          }
        },
        categories: {
          default: { level: "DEBUG", appenders: [ "errors" ] }
        }
      });
    }).should.throw(/Unrecognised log level 'cheese'\./);
  });
});
