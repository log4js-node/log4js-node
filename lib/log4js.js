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
const levels = require('./levels');
const Logger = require('./logger').Logger;
const connectLogger = require('./connect-logger').connectLogger;

const defaultConfig = {
  appenders: {
    STDOUT: { type: 'stdout' }
  },
  categories: {
    default: { appenders: ['STDOUT'], level: 'TRACE' }
  }
};

let config;
let enabled = true;

function configForCategory(category) {
  if (config.categories.has(category)) {
    return config.categories.get(category);
  }
  if (category.indexOf('.') > 0) {
    return configForCategory(category.substring(0, category.lastIndexOf('.')));
  }
  return configForCategory('default');
}

function appendersForCategory(category) {
  return configForCategory(category).appenders;
}

function levelForCategory(category) {
  return configForCategory(category).level;
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
  return new Logger(sendLogEventToAppender, cat, levelForCategory(cat));
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

  appenders.forEach(a => a.shutdown(complete));

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
  levels,
  connectLogger
};

module.exports = log4js;

// set ourselves up
configure(process.env.LOG4JS_CONFIG || defaultConfig);
