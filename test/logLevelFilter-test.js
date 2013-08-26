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
          { './appenders/console':
            { configure: function() { return function(evt) { events.push(evt); }; } }
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

/*
vows.describe('log4js logLevelFilter').addBatch({
  'appender': {
    topic: function() {
      var log4js = require('../lib/log4js'), logEvents = [], logger;
      log4js.clearAppenders();
      log4js.addAppender(
        require('../lib/appenders/logLevelFilter')
          .appender(
            'ERROR', 
            function(evt) { logEvents.push(evt); }
          ), 
        "logLevelTest"
      );
      
      logger = log4js.getLogger("logLevelTest");
      logger.debug('this should not trigger an event');
      logger.warn('neither should this');
      logger.error('this should, though');
      logger.fatal('so should this');
      return logEvents;
    },
    'should only pass log events greater than or equal to its own level' : function(logEvents) {
      assert.equal(logEvents.length, 2);
      assert.equal(logEvents[0].data[0], 'this should, though');
      assert.equal(logEvents[1].data[0], 'so should this');
    }
  },

  'configure': {
    topic: function() {
      var log4js = require('../lib/log4js')
      , logger;
      
      remove(__dirname + '/logLevelFilter.log');
      remove(__dirname + '/logLevelFilter-warnings.log');
      
      log4js.configure('test/with-logLevelFilter.json');
      logger = log4js.getLogger("tests");
      logger.info('main');
      logger.error('both');
      logger.warn('both');
      logger.debug('main');
      //wait for the file system to catch up
      setTimeout(this.callback, 100);
    },
    'tmp-tests.log': {
      topic: function() {
        fs.readFile(__dirname + '/logLevelFilter.log', 'utf8', this.callback);
      },
      'should contain all log messages': function(contents) {
        var messages = contents.trim().split('\n');
        assert.deepEqual(messages, ['main','both','both','main']);
      }
    },
    'tmp-tests-warnings.log': {
      topic: function() {
        fs.readFile(__dirname + '/logLevelFilter-warnings.log','utf8',this.callback);
      },
      'should contain only error and warning log messages': function(contents) {
        var messages = contents.trim().split('\n');
        assert.deepEqual(messages, ['both','both']);
      }
    }
  }
}).export(module);
*/
