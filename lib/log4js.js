'use strict';

/**
 * @fileoverview log4js is a library to log in JavaScript in similar manner
 * than in log4j for Java (but not really).
 *
 * <h3>Example:</h3>
 * <pre>
 *  const logging = require('log4js');
 *  const log = logging.getLogger('some-category');
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
const debug = require('debug')('log4js:main');
const fs = require('fs');
const Configuration = require('./configuration');
const connectModule = require('./connect-logger');
const logger = require('./logger');

const defaultConfig = {
  appenders: {
    stdout: { type: 'stdout' }
  },
  categories: {
    default: { appenders: ['stdout'], level: 'OFF' }
  }
};

let Logger;
let config;
let connectLogger;
let enabled = false;

function configForCategory(category) {
  debug(`configForCategory: searching for config for ${category}`);
  if (config.categories.has(category)) {
    debug(`configForCategory: ${category} exists in config, returning it`);
    return config.categories.get(category);
  }
  if (category.indexOf('.') > 0) {
    debug(`configForCategory: ${category} has hierarchy, searching for parents`);
    return configForCategory(category.substring(0, category.lastIndexOf('.')));
  }
  debug('configForCategory: returning config for default category');
  return configForCategory('default');
}

function appendersForCategory(category) {
  return configForCategory(category).appenders;
}

function levelForCategory(category) {
  return configForCategory(category).level;
}

function setLevelForCategory(category, level) {
  let categoryConfig = config.categories.get(category);
  debug(`setLevelForCategory: found ${categoryConfig} for ${category}`);
  if (!categoryConfig) {
    const sourceCategoryConfig = configForCategory(category);
    debug(
      `setLevelForCategory: no config found for category, found ${sourceCategoryConfig} for parents of ${category}`
    );
    categoryConfig = { appenders: sourceCategoryConfig.appenders };
  }
  categoryConfig.level = level;
  config.categories.set(category, categoryConfig);
}

function sendLogEventToAppender(logEvent) {
  if (!enabled) return;
  const appenders = appendersForCategory(logEvent.categoryName);
  appenders.forEach((appender) => {
    appender(logEvent);
  });
}

/**
 * Get a logger instance.
 * @static
 * @param loggerCategoryName
 * @return {Logger} instance of logger for the category
 */
function getLogger(category) {
  const cat = category || 'default';
  return new Logger(sendLogEventToAppender, cat);
}

function loadConfigurationFile(filename) {
  if (filename) {
    debug(`Loading configuration from ${filename}`);
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  }
  return filename;
}

function configure(configurationFileOrObject) {
  let configObject = configurationFileOrObject;

  if (typeof configObject === 'string') {
    configObject = loadConfigurationFile(configurationFileOrObject);
  }
  debug(`Configuration is ${configObject}`);
  config = new Configuration(configObject);
  module.exports.levels = config.levels;
  Logger = logger(config.levels, levelForCategory, setLevelForCategory).Logger;
  connectLogger = connectModule(config.levels).connectLogger;
  enabled = true;
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
  debug('Shutdown called. Disabling all log writing.');
  // First, disable all writing to appenders. This prevents appenders from
  // not being able to be drained because of run-away log writes.
  enabled = false;

  // Call each of the shutdown functions in parallel
  const appenders = Array.from(config.appenders.values());
  const shutdownFunctions = appenders.reduceRight((accum, next) => (next.shutdown ? accum + 1 : accum), 0);
  let completed = 0;
  let error;

  debug(`Found ${shutdownFunctions} appenders with shutdown functions.`);
  function complete(err) {
    error = error || err;
    completed += 1;
    debug(`Appender shutdowns complete: ${completed} / ${shutdownFunctions}`);
    if (completed >= shutdownFunctions) {
      debug('All shutdown functions completed.');
      cb(error);
    }
  }

  if (shutdownFunctions === 0) {
    debug('No appenders with shutdown functions found.');
    return cb();
  }

  appenders.filter(a => a.shutdown).forEach(a => a.shutdown(complete));

  return null;
}

/**
 * @name log4js
 * @namespace Log4js
 * @property getLogger
 * @property configure
 * @property shutdown
 * @property levels
 */
const log4js = {
  getLogger,
  configure,
  shutdown,
  connectLogger
};

module.exports = log4js;

// set ourselves up
configure(process.env.LOG4JS_CONFIG || defaultConfig);
