"use strict";
var vows = require('vows')
, assert = require('assert')
, sandbox = require('sandboxed-module');

function setupConsoleTest() {
  var fakeConsole = {}
  , logEvents = []
  , log4js;
  
  ['trace','debug','log','info','warn','error'].forEach(function(fn) {
    fakeConsole[fn] = function() {
      throw new Error("this should not be called.");
    };
  });

  log4js = sandbox.require(
    '../lib/log4js', 
    {
      globals: {
        console: fakeConsole
      }
    }
  );

  log4js.clearAppenders();
  log4js.addAppender(function(evt) {
    logEvents.push(evt);
  });

  return { log4js: log4js, logEvents: logEvents, fakeConsole: fakeConsole };
}

vows.describe('log4js').addBatch({
   
  'console' : {
    topic: setupConsoleTest,
    
    'when replaceConsole called': {
      topic: function(test) {
        test.log4js.replaceConsole();
        
        test.fakeConsole.log("Some debug message someone put in a module");
        test.fakeConsole.debug("Some debug");
        test.fakeConsole.error("An error");
        test.fakeConsole.info("some info");
        test.fakeConsole.warn("a warning");
        
        test.fakeConsole.log("cheese (%s) and biscuits (%s)", "gouda", "garibaldis");
        test.fakeConsole.log({ lumpy: "tapioca" });
        test.fakeConsole.log("count %d", 123);
        test.fakeConsole.log("stringify %j", { lumpy: "tapioca" });
        
        return test.logEvents;
      },
      
      'should replace console.log methods with log4js ones': function(logEvents) {
        assert.equal(logEvents.length, 9);
        assert.equal(logEvents[0].data[0], "Some debug message someone put in a module");
        assert.equal(logEvents[0].level.toString(), "INFO");
        assert.equal(logEvents[1].data[0], "Some debug");
        assert.equal(logEvents[1].level.toString(), "DEBUG");
        assert.equal(logEvents[2].data[0], "An error");
        assert.equal(logEvents[2].level.toString(), "ERROR");
        assert.equal(logEvents[3].data[0], "some info");
        assert.equal(logEvents[3].level.toString(), "INFO");
        assert.equal(logEvents[4].data[0], "a warning");
        assert.equal(logEvents[4].level.toString(), "WARN");
        assert.equal(logEvents[5].data[0], "cheese (%s) and biscuits (%s)");
        assert.equal(logEvents[5].data[1], "gouda");
        assert.equal(logEvents[5].data[2], "garibaldis");
      }
    },
    'when turned off': {
      topic: function(test) {
        test.log4js.restoreConsole();
        try {
          test.fakeConsole.log("This should cause the error described in the setup");
        } catch (e) {
          return e;
        }
      },
      'should call the original console methods': function (err) {
        assert.instanceOf(err, Error);
        assert.equal(err.message, "this should not be called.");
      }
    }
  },
  'console configuration': {
    topic: setupConsoleTest,
    'when disabled': {
      topic: function(test) {
        test.log4js.replaceConsole();
        test.log4js.configure({ replaceConsole: false });
        try {
          test.fakeConsole.log("This should cause the error described in the setup");
        } catch (e) {
          return e;
        }
      },
      'should allow for turning off console replacement': function (err) {
        assert.instanceOf(err, Error);
        assert.equal(err.message, 'this should not be called.');
      }
    },
    'when enabled': {
      topic: function(test) {
        test.log4js.restoreConsole();
        test.log4js.configure({ replaceConsole: true });
        //log4js.configure clears all appenders
        test.log4js.addAppender(function(evt) {
          test.logEvents.push(evt);
        });

        test.fakeConsole.debug("Some debug");
        return test.logEvents;
      },
      
      'should allow for turning on console replacement': function (logEvents) {
        assert.equal(logEvents.length, 1);
        assert.equal(logEvents[0].level.toString(), "DEBUG");
        assert.equal(logEvents[0].data[0], "Some debug");
      }
    }
  },
  'configuration persistence' : {
    topic: function() {
      var logEvent,
      firstLog4js = require('../lib/log4js'),
      secondLog4js;
      
      firstLog4js.clearAppenders();
      firstLog4js.addAppender(function(evt) { logEvent = evt; });
      
      secondLog4js = require('../lib/log4js');
      secondLog4js.getLogger().info("This should go to the appender defined in firstLog4js");
      
      return logEvent;
    },
    'should maintain appenders between requires': function (logEvent) {
      assert.equal(logEvent.data[0], "This should go to the appender defined in firstLog4js");
    }
  }
}).export(module);
