"use strict";
var debug = require('./debug')('logger')
, levels = require('./levels')
, util = require('util')
, DEFAULT_CATEGORY = '[default]';

/**
 * Models a logging event.
 * @constructor
 * @param {String} categoryName name of category
 * @param {Log4js.Level} level level of message
 * @param {Array} data objects to log
 * @author Seth Chisamore
 */
function LoggingEvent (categoryName, level, data) {
  this.startTime = new Date();
  this.categoryName = categoryName;
  this.data = data;
  this.level = level;
}

/**
 * Logger to log messages.
 * use {@see Log4js#getLogger(String)} to get an instance.
 * @constructor
 * @param name name of category to log to
 * @author Stephan Strittmatter
 */
function Logger (name, level, dispatch) {
  this.category = name || DEFAULT_CATEGORY;
  
  if (level) {
    this.setLevel(level);
  }

  this.dispatch = dispatch;
}
Logger.DEFAULT_CATEGORY = DEFAULT_CATEGORY;
Logger.prototype.level = levels.TRACE;

Logger.prototype.setLevel = function(level) {
  debug("setting level to " + level);
  this.level = levels.toLevel(level, this.level || levels.TRACE);
};

Logger.prototype.removeLevel = function() {
  delete this.level;
};

Logger.prototype.log = function() {
  var args = Array.prototype.slice.call(arguments)
  , logLevel = args.shift()
  , loggingEvent = new LoggingEvent(this.category, logLevel, args);
  debug("Logging event " + loggingEvent + " to dispatch = " + util.inspect(this.dispatch));
  this.dispatch(loggingEvent);
};

Logger.prototype.isLevelEnabled = function(otherLevel) {
  return this.level.isLessThanOrEqualTo(otherLevel);
};

['Trace','Debug','Info','Warn','Error','Fatal'].forEach(
  function(levelString) {
    var level = levels.toLevel(levelString);
    Logger.prototype['is'+levelString+'Enabled'] = function() {
      return this.isLevelEnabled(level);
    };
    
    Logger.prototype[levelString.toLowerCase()] = function () {
      if (this.isLevelEnabled(level)) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(level);
        Logger.prototype.log.apply(this, args);
      }
    };
  }
);

exports.LoggingEvent = LoggingEvent;
exports.Logger = Logger;
