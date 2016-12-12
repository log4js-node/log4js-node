/* eslint no-underscore-dangle:0 */

'use strict';

const levels = require('./levels');
const EventEmitter = require('events');

const DEFAULT_CATEGORY = '[default]';

let logWritesEnabled = true;

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
   * @param {Logger} logger the associated logger
   * @author Seth Chisamore
   */
  constructor(categoryName, level, data, logger) {
    this.startTime = new Date();
    this.categoryName = categoryName;
    this.data = data;
    this.level = level;
    this.logger = logger;
  }
}

/**
 * Logger to log messages.
 * use {@see log4js#getLogger(String)} to get an instance.
 *
 * @name Logger
 * @namespace Log4js
 * @param name name of category to log to
 * @param level
 *
 * @author Stephan Strittmatter
 */
class Logger extends EventEmitter {
  constructor(name, level) {
    super();

    this.category = name || DEFAULT_CATEGORY;

    if (level) {
      this.setLevel(level);
    }
  }

  setLevel(level) {
    this.level = levels.toLevel(level, this.level || levels.TRACE);
  }

  removeLevel() {
    delete this.level;
  }

  log() {
    /* eslint prefer-rest-params:0 */
    // todo: once node v4 support dropped, use rest parameter instead
    const args = Array.from(arguments);
    const logLevel = levels.toLevel(args[0], levels.INFO);
    if (!this.isLevelEnabled(logLevel)) {
      return;
    }
    this._log(logLevel, args.slice(1));
  }

  isLevelEnabled(otherLevel) {
    return this.level.isLessThanOrEqualTo(otherLevel);
  }

  _log(level, data) {
    const loggingEvent = new LoggingEvent(this.category, level, data, this);
    this.emit('log', loggingEvent);
  }
}

Logger.DEFAULT_CATEGORY = DEFAULT_CATEGORY;
Logger.prototype.level = levels.TRACE;

['Trace', 'Debug', 'Info', 'Warn', 'Error', 'Fatal', 'Mark'].forEach(addLevelMethods);

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
    if (logWritesEnabled && this.isLevelEnabled(level)) {
      this._log(level, args);
    }
  };
}

/**
 * Disable all log writes.
 * @returns {void}
 */
function disableAllLogWrites() {
  logWritesEnabled = false;
}

/**
 * Enable log writes.
 * @returns {void}
 */
function enableAllLogWrites() {
  logWritesEnabled = true;
}

module.exports.LoggingEvent = LoggingEvent;
module.exports.Logger = Logger;
module.exports.disableAllLogWrites = disableAllLogWrites;
module.exports.enableAllLogWrites = enableAllLogWrites;
module.exports.addLevelMethods = addLevelMethods;
