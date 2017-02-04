/* eslint no-underscore-dangle:0 */

'use strict';

const levels = require('./levels');

// let logWritesEnabled = true;

/**
 * @name LoggingEvent
 * @namespace Log4js
 */
class LoggingEvent {
  /**
   * Models a logging event.
   * @constructor
   * @param {String} categoryName name of category
   * @param {Log4js.Level} level level of message
   * @param {Array} data objects to log
   * @author Seth Chisamore
   */
  constructor(categoryName, level, data) {
    this.startTime = new Date();
    this.categoryName = categoryName;
    this.data = data;
    this.level = level;
  }
}

/**
 * Logger to log messages.
 * use {@see log4js#getLogger(String)} to get an instance.
 *
 * @name Logger
 * @namespace Log4js
 * @param name name of category to log to
 * @param level - the loglevel for the category
 * @param dispatch - the function which will receive the logevents
 *
 * @author Stephan Strittmatter
 */
class Logger {
  constructor(name, level, dispatch) {
    this.category = name;
    this.level = levels.toLevel(level, levels.TRACE);
    this.dispatch = dispatch;
  }

  setLevel(level) {
    this.level = levels.toLevel(level, this.level || levels.TRACE);
  }

  log() {
    /* eslint prefer-rest-params:0 */
    // todo: once node v4 support dropped, use rest parameter instead
    const args = Array.from(arguments);
    const logLevel = levels.toLevel(args[0], levels.INFO);
    if (this.isLevelEnabled(logLevel)) {
      this._log(logLevel, args.slice(1));
    }
  }

  isLevelEnabled(otherLevel) {
    return this.level.isLessThanOrEqualTo(otherLevel);
  }

  _log(level, data) {
    const loggingEvent = new LoggingEvent(this.category, level, data);
    this.dispatch(loggingEvent);
  }
}

function addLevelMethods(target) {
  const level = levels.toLevel(target);

  const levelStrLower = level.toString().toLowerCase();
  const levelMethod = levelStrLower.replace(/_([a-z])/g, g => g[1].toUpperCase());
  const isLevelMethod = levelMethod[0].toUpperCase() + levelMethod.slice(1);

  Logger.prototype[`is${isLevelMethod}Enabled`] = function () {
    return this.isLevelEnabled(level.toString());
  };

  Logger.prototype[levelMethod] = function () {
    /* eslint prefer-rest-params:0 */
    // todo: once node v4 support dropped, use rest parameter instead
    const args = Array.from(arguments);
    if (/* logWritesEnabled &&*/ this.isLevelEnabled(level)) {
      this._log(level, args);
    }
  };
}

levels.levels.forEach(addLevelMethods);

/**
 * Disable all log writes.
 * @returns {void}
 */
// function disableAllLogWrites() {
//   logWritesEnabled = false;
// }

/**
 * Enable log writes.
 * @returns {void}
 */
// function enableAllLogWrites() {
//   logWritesEnabled = true;
// }

module.exports.LoggingEvent = LoggingEvent;
module.exports.Logger = Logger;
// module.exports.disableAllLogWrites = disableAllLogWrites;
// module.exports.enableAllLogWrites = enableAllLogWrites;
// module.exports.addLevelMethods = addLevelMethods;
