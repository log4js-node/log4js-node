"use strict";
var vows = require('vows')
, assert = require('assert')
, levels = require('../lib/levels')
, Logger = require('../lib/logger').Logger
, log4js = require('../lib/log4js');

vows.describe('../lib/logger').addBatch({
  'constructor with no parameters': {
    topic: new Logger(),
    'should use default category': function(logger) {
      assert.equal(logger.category, Logger.DEFAULT_CATEGORY);
    },
    'should use TRACE log level': function(logger) {
      assert.equal(logger.level, levels.TRACE);
    }
  },

  'constructor with category': {
    topic: new Logger('cheese'),
    'should use category': function(logger) {
      assert.equal(logger.category, 'cheese');
    },
    'should use TRACE log level': function(logger) {
      assert.equal(logger.level, levels.TRACE);
    }
  },

  'constructor with category and level': {
    topic: new Logger('cheese', 'debug'),
    'should use category': function(logger) {
      assert.equal(logger.category, 'cheese');
    },
    'should use level': function(logger) {
      assert.equal(logger.level, levels.DEBUG);
    }
  },

  'isLevelEnabled': {
    topic: new Logger('cheese', 'info'),
    'should provide a level enabled function for all levels': function(logger) {
      assert.isFunction(logger.isTraceEnabled);
      assert.isFunction(logger.isDebugEnabled);
      assert.isFunction(logger.isInfoEnabled);
      assert.isFunction(logger.isWarnEnabled);
      assert.isFunction(logger.isErrorEnabled);
      assert.isFunction(logger.isFatalEnabled);
    },
    'should return the right values': function(logger) {
      assert.isFalse(logger.isTraceEnabled());
      assert.isFalse(logger.isDebugEnabled());
      assert.isTrue(logger.isInfoEnabled());
      assert.isTrue(logger.isWarnEnabled());
      assert.isTrue(logger.isErrorEnabled());
      assert.isTrue(logger.isFatalEnabled());
    }
  },

  'log': {
    topic: new Logger('testing'),
    'should send log events to log4js': function(logger) {
      var evt, original = log4js.dispatch;
      log4js.dispatch = function(event) {
        evt = event;
      };

      logger.log(levels.DEBUG, "cheese");
      log4js.dispatch = original;

      assert.equal(evt.categoryName, 'testing');
      assert.equal(evt.level, levels.DEBUG);
      assert.equal(evt.data[0], "cheese");
    }
  }
}).exportTo(module);
