"use strict";
var debug = require('debug')('log4js:logger')
, levels = require('./levels');

module.exports = function Logger(dispatch, category) {
  if (typeof dispatch !== 'function') {
    throw new Error("Logger must have a dispatch delegate.");
  }

  if (!category) {
    throw new Error("Logger must have a category.");
  }

  function log() {
    var args = Array.prototype.slice.call(arguments)
    , logLevel = args.shift()
    , loggingEvent = new LoggingEvent(category, logLevel, args);
    debug("Logging event ", loggingEvent, " to dispatch = ", dispatch);
    dispatch(loggingEvent);
  }

  var self = this;
  ['trace','debug','info','warn','error','fatal'].forEach(
    function(level) {
      self[level] = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(level);
        log.apply(this, args);
      };
    }
  );

};

/**
 * Models a logging event.
 * @constructor
 * @param {String} category name of category
 * @param {Log4js.Level} level level of message
 * @param {Array} data objects to log
 * @author Seth Chisamore
 */
function LoggingEvent (category, level, data) {
  this.startTime = new Date();
  this.category = category;
  this.data = data;
  this.level = levels.toLevel(level);
}

