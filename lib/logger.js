/* eslint no-underscore-dangle:0 */

'use strict';

const debug = require('debug')('log4js:logger');

let cluster;
try {
  cluster = require('cluster'); // eslint-disable-line global-require
} catch (e) {
  debug('Clustering support disabled because require(cluster) threw an error: ', e);
}

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
  constructor(categoryName, level, data, context) {
    this.startTime = new Date();
    this.categoryName = categoryName;
    this.data = data;
    this.level = level;
    this.context = Object.assign({}, context);
    this.pid = process.pid;
    if (cluster && cluster.isWorker) {
      this.cluster = {
        workerId: cluster.worker.id,
        worker: process.pid
      };
    }
  }
}

module.exports = function (levels, getLevelForCategory, setLevelForCategory) {
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
    constructor(dispatch, name) {
      if (typeof dispatch !== 'function') {
        throw new Error('No dispatch function provided.');
      }
      if (!name) {
        throw new Error('No category provided.');
      }
      this.category = name;
      this.dispatch = dispatch;
      this.context = {};
      debug(`Logger created (${this.category}, ${this.level}, ${this.dispatch})`);
    }

    get level() {
      return levels.getLevel(getLevelForCategory(this.category), levels.TRACE);
    }

    set level(level) {
      setLevelForCategory(this.category, levels.getLevel(level, this.level));
    }

    log() {
      /* eslint prefer-rest-params:0 */
      // todo: once node v4 support dropped, use rest parameter instead
      const args = Array.from(arguments);
      const logLevel = levels.getLevel(args[0], levels.INFO);
      if (this.isLevelEnabled(logLevel)) {
        this._log(logLevel, args.slice(1));
      }
    }

    isLevelEnabled(otherLevel) {
      return this.level.isLessThanOrEqualTo(otherLevel);
    }

    _log(level, data) {
      debug(`sending log data (${level}) to appenders`);
      const loggingEvent = new LoggingEvent(this.category, level, data, this.context);
      this.dispatch(loggingEvent);
    }

    addContext(key, value) {
      this.context[key] = value;
    }

    removeContext(key) {
      delete this.context[key];
    }

    clearContext() {
      this.context = {};
    }
  }

  function addLevelMethods(target) {
    const level = levels.getLevel(target);

    const levelStrLower = level.toString().toLowerCase();
    const levelMethod = levelStrLower.replace(/_([a-z])/g, g => g[1].toUpperCase());
    const isLevelMethod = levelMethod[0].toUpperCase() + levelMethod.slice(1);

    Logger.prototype[`is${isLevelMethod}Enabled`] = function () {
      return this.isLevelEnabled(level);
    };

    Logger.prototype[levelMethod] = function () {
      /* eslint prefer-rest-params:0 */
      // todo: once node v4 support dropped, use rest parameter instead
      const args = Array.from(arguments);
      if (this.isLevelEnabled(level)) {
        this._log(level, args);
      }
    };
  }

  levels.levels.forEach(addLevelMethods);

  return {
    LoggingEvent: LoggingEvent,
    Logger: Logger
  };
};
