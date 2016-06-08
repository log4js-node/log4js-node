"use strict";
var vows = require('vows')
  , assert = require('assert')
  , levels = require('../lib/levels')
  , log4js = require('../lib/log4js')
  , loggerModule = require('../lib/logger')
  , Logger = loggerModule.Logger;

vows.describe('../lib/logger').addBatch({
  'new log level and methods': {
    topic: function () {
      log4js.levels.forName("DIAG", 6000);
      return new Logger();
    },

    'should export new log level in levels module': function (logger) {
      assert.isDefined(levels.DIAG);
      assert.equal(levels.DIAG.levelStr, "DIAG");
      assert.equal(levels.DIAG.level, 6000);
    },

    'new log level method is present on logger prototype': function(logger) {
      assert.isFunction(logger.diag);
    },

    'new log level method isLevelEnabled present on logger prototype': function(logger) {
      assert.isFunction(logger.isDiagEnabled);
    }
  },

  'new log level and method for underscored levels': {
    topic: function () {
      log4js.levels.forName("NEW_LEVEL", 6000);
      return new Logger();
    },

    'should export new log level in levels module': function (logger) {
      assert.isDefined(levels.NEW_LEVEL);
      assert.equal(levels.NEW_LEVEL.levelStr, "NEW_LEVEL");
      assert.equal(levels.NEW_LEVEL.level, 6000);
    },

    'new log level method is present on logger prototype in camel case': function(logger) {
      assert.isFunction(logger.newLevel);
    },

    'new log level method isLevelEnabled present on logger prototype': function(logger) {
      assert.isFunction(logger.isNewLevelEnabled);
    }
  },

  'log events contain newly created log level': {
    topic: function() {
      var events = [],
        logger = new Logger();
      logger.addListener("log", function (logEvent) { events.push(logEvent); });

      logger.log(log4js.levels.forName("LVL1", 6000), "Event 1");
      logger.log("LVL1", "Event 2");
      logger.lvl1("Event 3");

      logger.setLevel(log4js.levels.forName("LVL2", 7000));
      logger.lvl1("Event 4");

      return events;
    },

    'events are present with new log level': function(events) {
      assert.equal(events[0].level.toString(), "LVL1");
      assert.equal(events[1].level.toString(), "LVL1");
      assert.equal(events[2].level.toString(), "LVL1");
    },

    'event should NOT be present if min log level greater than newly created level':
    function(events) {
      assert.equal(events.length, 3);
    }
  }
}).exportTo(module);