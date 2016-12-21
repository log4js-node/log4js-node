/* eslint no-prototype-builtins:1,no-restricted-syntax:[1, "ForInStatement"],no-plusplus:0 */

'use strict';

/**
 * @fileoverview log4js is a library to log in JavaScript in similar manner
 * than in log4j for Java. The API should be nearly the same.
 *
 * <h3>Example:</h3>
 * <pre>
 *  let logging = require('log4js');
 *  //add an appender that logs all messages to stdout.
 *  logging.addAppender(logging.consoleAppender());
 *  //add an appender that logs 'some-category' to a file
 *  logging.addAppender(logging.fileAppender('file.log'), 'some-category');
 *  //get a logger
 *  let log = logging.getLogger('some-category');
 *  log.setLevel(logging.levels.TRACE); //set the Level
 *
 *  ...
 *
 *  //call the log
 *  log.trace('trace me' );
 * </pre>
 *
 * NOTE: the authors below are the original browser-based log4js authors
 * don't try to contact them about bugs in this version :)
 * @version 1.0
 * @author Stephan Strittmatter - http://jroller.com/page/stritti
 * @author Seth Chisamore - http://www.chisamore.com
 * @since 2005-05-20
 * @static
 * Website: http://log4js.berlios.de
 */
const fs = require('fs');
const util = require('util');
const layouts = require('./layouts');
const levels = require('./levels');
const loggerModule = require('./logger');
const connectLogger = require('./connect-logger').connectLogger;

const Logger = loggerModule.Logger;

const ALL_CATEGORIES = '[all]';
const loggers = {};
const appenderMakers = {};
const appenderShutdowns = {};
const defaultConfig = {
  appenders: [
    { type: 'stdout' }
  ],
  replaceConsole: false
};

let appenders = {};

function hasLogger(logger) {
  return loggers.hasOwnProperty(logger);
}

// todo: this method should be moved back to levels.js, but for loop require, need some refactor
levels.forName = function (levelStr, levelVal) {
  let level;
  if (typeof levelStr === 'string' && typeof levelVal === 'number') {
    const levelUpper = levelStr.toUpperCase();
    level = new levels.Level(levelVal, levelUpper);
    loggerModule.addLevelMethods(level);
  }
  return level;
};

function getBufferedLogger(categoryName) {
  const baseLogger = getLogger(categoryName);
  const logger = {};
  logger.temp = [];
  logger.target = baseLogger;
  logger.flush = function () {
    for (let i = 0; i < logger.temp.length; i++) {
      const log = logger.temp[i];
      logger.target[log.level](log.message);
      delete logger.temp[i];
    }
  };
  logger.trace = function (message) {
    logger.temp.push({ level: 'trace', message: message });
  };
  logger.debug = function (message) {
    logger.temp.push({ level: 'debug', message: message });
  };
  logger.info = function (message) {
    logger.temp.push({ level: 'info', message: message });
  };
  logger.warn = function (message) {
    logger.temp.push({ level: 'warn', message: message });
  };
  logger.error = function (message) {
    logger.temp.push({ level: 'error', message: message });
  };
  logger.fatal = function (message) {
    logger.temp.push({ level: 'fatal', message: message });
  };

  return logger;
}

function normalizeCategory(category) {
  return `${category}.`;
}

function doesLevelEntryContainsLogger(levelCategory, loggerCategory) {
  const normalizedLevelCategory = normalizeCategory(levelCategory);
  const normalizedLoggerCategory = normalizeCategory(loggerCategory);
  return normalizedLoggerCategory.substring(0, normalizedLevelCategory.length) === normalizedLevelCategory;
}

function doesAppenderContainsLogger(appenderCategory, loggerCategory) {
  const normalizedAppenderCategory = normalizeCategory(appenderCategory);
  const normalizedLoggerCategory = normalizeCategory(loggerCategory);
  return normalizedLoggerCategory.substring(0, normalizedAppenderCategory.length) === normalizedAppenderCategory;
}

/**
 * Get a logger instance. Instance is cached on categoryName level.
 * @static
 * @param loggerCategoryName
 * @return {Logger} instance of logger for the category
 */
function getLogger(loggerCategoryName) {
  // Use default logger if categoryName is not specified or invalid
  if (typeof loggerCategoryName !== 'string') {
    loggerCategoryName = Logger.DEFAULT_CATEGORY;
  }

  if (!hasLogger(loggerCategoryName)) {
    let level;

    /* jshint -W073 */
    // If there's a 'levels' entry in the configuration
    if (levels.config) {
      // Goes through the categories in the levels configuration entry,
      // starting with the 'higher' ones.
      const keys = Object.keys(levels.config).sort();
      for (let idx = 0; idx < keys.length; idx++) {
        const levelCategory = keys[idx];
        if (doesLevelEntryContainsLogger(levelCategory, loggerCategoryName)) {
          // level for the logger
          level = levels.config[levelCategory];
        }
      }
    }
    /* jshint +W073 */

    // Create the logger for this name if it doesn't already exist
    loggers[loggerCategoryName] = new Logger(loggerCategoryName, level);

    /* jshint -W083 */
    let appenderList;
    for (const appenderCategory in appenders) {
      if (doesAppenderContainsLogger(appenderCategory, loggerCategoryName)) {
        appenderList = appenders[appenderCategory];
        appenderList.forEach((appender) => {
          loggers[loggerCategoryName].addListener('log', appender);
        });
      }
    }
    /* jshint +W083 */

    if (appenders[ALL_CATEGORIES]) {
      appenderList = appenders[ALL_CATEGORIES];
      appenderList.forEach((appender) => {
        loggers[loggerCategoryName].addListener('log', appender);
      });
    }
  }

  return loggers[loggerCategoryName];
}

/**
 * args are appender, optional shutdown function, then zero or more categories
 */
function addAppender() {
  /* eslint prefer-rest-params:0 */
  // todo: once node v4 support dropped, use rest parameter instead
  let args = Array.from(arguments);
  const appender = args.shift();
  // check for a shutdown fn
  if (args.length > 0 && typeof args[0] === 'function') {
    appenderShutdowns[appender] = args.shift();
  }

  if (args.length === 0 || args[0] === undefined) {
    args = [ALL_CATEGORIES];
  }
  // argument may already be an array
  if (Array.isArray(args[0])) {
    args = args[0];
  }

  args.forEach((appenderCategory) => {
    addAppenderToCategory(appender, appenderCategory);

    if (appenderCategory === ALL_CATEGORIES) {
      addAppenderToAllLoggers(appender);
    } else {
      for (const loggerCategory in loggers) {
        if (doesAppenderContainsLogger(appenderCategory, loggerCategory)) {
          loggers[loggerCategory].addListener('log', appender);
        }
      }
    }
  });
}

function addAppenderToAllLoggers(appender) {
  for (const logger in loggers) {
    if (hasLogger(logger)) {
      loggers[logger].addListener('log', appender);
    }
  }
}

function addAppenderToCategory(appender, category) {
  if (!appenders[category]) {
    appenders[category] = [];
  }
  appenders[category].push(appender);
}

function clearAppenders() {
  // if we're calling clearAppenders, we're probably getting ready to write
  // so turn log writes back on, just in case this is after a shutdown
  loggerModule.enableAllLogWrites();
  appenders = {};
  for (const logger in loggers) {
    if (hasLogger(logger)) {
      loggers[logger].removeAllListeners('log');
    }
  }
}

function configureAppenders(appenderList, options) {
  clearAppenders();
  if (appenderList) {
    appenderList.forEach((appenderConfig) => {
      loadAppender(appenderConfig.type);
      let appender;
      appenderConfig.makers = appenderMakers;
      try {
        appender = appenderMakers[appenderConfig.type](appenderConfig, options);
        addAppender(appender, appenderConfig.category);
      } catch (e) {
        throw new Error(`log4js configuration problem for ${util.inspect(appenderConfig)}`, e);
      }
    });
  }
}

function configureLevels(_levels) {
  levels.config = _levels; // Keep it so we can create loggers later using this cfg
  if (_levels) {
    const keys = Object.keys(levels.config).sort();

    /* eslint-disable guard-for-in */
    for (const idx in keys) {
      const category = keys[idx];
      if (category === ALL_CATEGORIES) {
        setGlobalLogLevel(_levels[category]);
      }

      for (const loggerCategory in loggers) {
        if (doesLevelEntryContainsLogger(category, loggerCategory)) {
          loggers[loggerCategory].setLevel(_levels[category]);
        }
      }
    }
  }
}

function setGlobalLogLevel(level) {
  Logger.prototype.level = levels.toLevel(level, levels.TRACE);
}

/**
 * Get the default logger instance.
 * @return {Logger} instance of default logger
 * @static
 */
function getDefaultLogger() {
  return getLogger(Logger.DEFAULT_CATEGORY);
}

const configState = {};

function loadConfigurationFile(filename) {
  if (filename) {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  }
  return undefined;
}

function configureOnceOff(config, options) {
  if (config) {
    try {
      restoreConsole();
      configureLevels(config.levels);
      configureAppenders(config.appenders, options);

      if (config.replaceConsole) {
        replaceConsole();
      }
    } catch (e) {
      throw new Error(
        `Problem reading log4js config ${util.inspect(config)}. Error was '${e.message}' (${e.stack})`
      );
    }
  }
}

function reloadConfiguration(options) {
  const mtime = getMTime(configState.filename);
  if (!mtime) return;

  if (configState.lastMTime && (mtime.getTime() > configState.lastMTime.getTime())) {
    configureOnceOff(loadConfigurationFile(configState.filename), options);
  }
  configState.lastMTime = mtime;
}

function getMTime(filename) {
  let mtime;
  try {
    mtime = fs.statSync(configState.filename).mtime;
  } catch (e) {
    getLogger('log4js').warn(`Failed to load configuration file ${filename}`);
  }
  return mtime;
}

function initReloadConfiguration(filename, options) {
  if (configState.timerId) {
    clearInterval(configState.timerId);
    delete configState.timerId;
  }
  configState.filename = filename;
  configState.lastMTime = getMTime(filename);
  configState.timerId = setInterval(reloadConfiguration, options.reloadSecs * 1000, options);
}

function configure(configurationFileOrObject, options) {
  let config = configurationFileOrObject;
  config = config || process.env.LOG4JS_CONFIG;
  options = options || {};

  if (config === undefined || config === null || typeof config === 'string') {
    if (options.reloadSecs) {
      initReloadConfiguration(config, options);
    }
    config = loadConfigurationFile(config) || defaultConfig;
  } else {
    if (options.reloadSecs) { // eslint-disable-line
      getLogger('log4js').warn(
        'Ignoring configuration reload parameter for "object" configuration.'
      );
    }
  }
  configureOnceOff(config, options);
}

const originalConsoleFunctions = {
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error
};

function replaceConsole(logger) {
  function replaceWith(fn) {
    return function () {
      /* eslint prefer-rest-params:0 */
      // todo: once node v4 support dropped, use rest parameter instead
      fn.apply(logger, Array.from(arguments));
    };
  }

  logger = logger || getLogger('console');

  ['log', 'debug', 'info', 'warn', 'error'].forEach((item) => {
    console[item] = replaceWith(item === 'log' ? logger.info : logger[item]);
  });
}

function restoreConsole() {
  ['log', 'debug', 'info', 'warn', 'error'].forEach((item) => {
    console[item] = originalConsoleFunctions[item];
  });
}

/* eslint global-require:0 */
/**
 * Load an appenderModule based on the provided appender filepath. Will first
 * check if the appender path is a subpath of the log4js 'lib/appenders' directory.
 * If not, it will attempt to load the the appender as complete path.
 *
 * @param {string} appender The filepath for the appender.
 * @returns {Object|null} The required appender or null if appender could not be loaded.
 * @private
 */
function requireAppender(appender) {
  let appenderModule;
  try {
    appenderModule = require(`./appenders/${appender}`); // eslint-disable-line
  } catch (e) {
    appenderModule = require(appender); // eslint-disable-line
  }
  return appenderModule;
}

/**
 * Load an appender. Provided the appender path to be loaded. If appenderModule is defined,
 * it will be used in place of requiring the appender module.
 *
 * @param {string} appender The path to the appender module.
 * @param {Object|void} [appenderModule] The pre-required appender module. When provided,
 * instead of requiring the appender by its path, this object will be used.
 * @returns {void}
 * @private
 */
function loadAppender(appender, appenderModule) {
  appenderModule = appenderModule || requireAppender(appender);

  if (!appenderModule) {
    throw new Error(`Invalid log4js appender: ${util.inspect(appender)}`);
  }

  log4js.appenders[appender] = appenderModule.appender.bind(appenderModule);
  if (appenderModule.shutdown) {
    appenderShutdowns[appender] = appenderModule.shutdown.bind(appenderModule);
  }
  appenderMakers[appender] = appenderModule.configure.bind(appenderModule);
}

/**
 * Shutdown all log appenders. This will first disable all writing to appenders
 * and then call the shutdown function each appender.
 *
 * @params {Function} cb - The callback to be invoked once all appenders have
 *  shutdown. If an error occurs, the callback will be given the error object
 *  as the first argument.
 */
function shutdown(cb) {
  // First, disable all writing to appenders. This prevents appenders from
  // not being able to be drained because of run-away log writes.
  loggerModule.disableAllLogWrites();

  // turn off config reloading
  if (configState.timerId) {
    clearInterval(configState.timerId);
  }

  // Call each of the shutdown functions in parallel
  let completed = 0;
  let error;
  const shutdownFunctions = [];

  function complete(err) {
    error = error || err;
    completed++;
    if (completed >= shutdownFunctions.length) {
      cb(error);
    }
  }

  for (const category in appenderShutdowns) {
    if (appenderShutdowns.hasOwnProperty(category)) {
      shutdownFunctions.push(appenderShutdowns[category]);
    }
  }

  if (!shutdownFunctions.length) {
    return cb();
  }

  shutdownFunctions.forEach((shutdownFct) => {
    shutdownFct(complete);
  });

  return null;
}

/**
 * @name log4js
 * @namespace Log4js
 * @property getBufferedLogger
 * @property getLogger
 * @property getDefaultLogger
 * @property hasLogger
 * @property addAppender
 * @property loadAppender
 * @property clearAppenders
 * @property configure
 * @property shutdown
 * @property replaceConsole
 * @property restoreConsole
 * @property levels
 * @property setGlobalLogLevel
 * @property layouts
 * @property appenders
 * @property appenderMakers
 * @property connectLogger
 */
const log4js = {
  getBufferedLogger,
  getLogger,
  getDefaultLogger,
  hasLogger,

  addAppender,
  loadAppender,
  clearAppenders,
  configure,
  shutdown,

  replaceConsole,
  restoreConsole,

  levels,
  setGlobalLogLevel,

  layouts,
  appenders: {},
  appenderMakers,
  connectLogger
};

module.exports = log4js;

// set ourselves up
configure();
