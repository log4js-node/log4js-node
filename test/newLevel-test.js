"use strict";
var vows = require('vows')
  , assert = require('assert')
  , levels = require('../lib/levels')
  , log4js = require('../lib/log4js')
  , loggerModule = require('../lib/logger')
  , Logger = loggerModule.Logger;

vows.describe('../lib/logger').addBatch({
  'creating a new log level': {
    topic: function () {
      log4js.levels.forName("DIAG", 6000);
      return new Logger();
    },

    'should export new log level in levels module': function (logger) {
      assert.isDefined(levels.DIAG);
      assert.equal(levels.DIAG.levelStr, "DIAG");
      assert.equal(levels.DIAG.level, 6000);
    },

    'should create named function on logger prototype': function(logger) {
      assert.isFunction(logger.diag);
    },

    'should create isLevelEnabled function on logger prototype': function(logger) {
      assert.isFunction(logger.isDiagEnabled);
    },
  },

  'creating a new log level with underscores': {
    topic: function () {
      log4js.levels.forName("NEW_LEVEL_OTHER", 6000);
      return new Logger();
    },

    'should export new log level to levels module': function (logger) {
      assert.isDefined(levels.NEW_LEVEL_OTHER);
      assert.equal(levels.NEW_LEVEL_OTHER.levelStr, "NEW_LEVEL_OTHER");
      assert.equal(levels.NEW_LEVEL_OTHER.level, 6000);
    },

    'should create named function on logger prototype in camel case': function(logger) {
      assert.isFunction(logger.newLevelOther);
    },

    'should create named isLevelEnabled function on logger prototype in camel case': function(logger) {
      assert.isFunction(logger.isNewLevelOtherEnabled);
    }
  },

  'creating log events containing newly created log level': {
    topic: function() {
      var events = [],
        logger = new Logger();
      logger.addListener("log", function (logEvent) { events.push(logEvent); });

      logger.log(log4js.levels.forName("LVL1", 6000), "Event 1");
      logger.log(log4js.levels.getLevel("LVL1"), "Event 2");
      logger.log("LVL1", "Event 3");
      logger.lvl1("Event 4");

      logger.setLevel(log4js.levels.forName("LVL2", 7000));
      logger.lvl1("Event 5");

      return events;
    },

    'should show log events with new log level': function(events) {
      assert.equal(events[0].level.toString(), "LVL1");
      assert.equal(events[0].data[0], "Event 1");

      assert.equal(events[1].level.toString(), "LVL1");
      assert.equal(events[1].data[0], "Event 2");

      assert.equal(events[2].level.toString(), "LVL1");
      assert.equal(events[2].data[0], "Event 3");      

      assert.equal(events[3].level.toString(), "LVL1");
      assert.equal(events[3].data[0], "Event 4");
    },

    'should not be present if min log level is greater than newly created level':
    function(events) {
      assert.equal(events.length, 4);
    }
  },

  'calling log with an undefined log level': {
    topic: function() {
      var events = [],
        logger = new Logger();
      logger.addListener("log", function (logEvent) { events.push(logEvent); });

      logger.log("LEVEL_DOES_NEXT_EXIST", "Event 1");
      logger.log(log4js.levels.forName("LEVEL_DOES_NEXT_EXIST"), "Event 2");

      return events;
    },

    'should fallback to the default log level (INFO)': function(events) {
      assert.equal(events[0].level.toString(), "INFO");
      assert.equal(events[1].level.toString(), "INFO");
    }
  }
}).exportTo(module);