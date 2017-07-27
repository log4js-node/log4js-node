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
const cluster = require('cluster');
const Configuration = require('./configuration');
const connectModule = require('./connect-logger');
const logger = require('./logger');
const layouts = require('./layouts');

const defaultConfig = {
  appenders: {
    stdout: { type: 'stdout' }
  },
  categories: {
    default: { appenders: ['stdout'], level: 'OFF' }
  }
};

let Logger;
let LoggingEvent;
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

function serialise(logEvent) {
  // JSON.stringify(new Error('test')) returns {}, which is not really useful for us.
  // The following allows us to serialize errors correctly.
  // Validate that we really are in this case
  try {
    const logData = logEvent.data.map((e) => {
      if (e && e.stack && JSON.stringify(e) === '{}') {
        e = { message: e.message, stack: e.stack };
      }
      return e;
    });
    logEvent.data = logData;
    return JSON.stringify(logEvent);
  } catch (e) {
    return serialise(new LoggingEvent(
      'log4js',
      config.levels.ERROR,
      ['Unable to serialise log event due to :', e]
    ));
  }
}

function deserialise(serialised) {
  let event;
  try {
    event = JSON.parse(serialised);
    event.startTime = new Date(event.startTime);
    event.level = config.levels.getLevel(event.level.levelStr);
    event.data = event.data.map((e) => {
      if (e && e.stack) {
        const fakeError = new Error(e.message);
        fakeError.stack = e.stack;
        e = fakeError;
      }
      return e;
    });
  } catch (e) {
    event = new LoggingEvent(
      'log4js',
      config.levels.ERROR,
      ['Unable to parse log:', serialised, 'because: ', e]
    );
  }

  return event;
}

function sendLogEventToAppender(logEvent) {
  if (!enabled) return;
  debug('Received log event ', logEvent);
  const appenders = appendersForCategory(logEvent.categoryName);
  appenders.forEach((appender) => {
    appender(logEvent);
  });
}

function workerDispatch(logEvent) {
  debug(`sending message to master from worker ${process.pid}`);
  process.send({ topic: 'log4js:message', data: serialise(logEvent) });
}

function isPM2Master() {
  return config.pm2 && process.env[config.pm2InstanceVar] === '0';
}

function isMaster() {
  return cluster.isMaster || isPM2Master();
}

/**
 * Get a logger instance.
 * @static
 * @param loggerCategoryName
 * @return {Logger} instance of logger for the category
 */
function getLogger(category) {
  const cat = category || 'default';
  debug(`creating logger as ${isMaster() ? 'master' : 'worker'}`);
  return new Logger((isMaster() ? sendLogEventToAppender : workerDispatch), cat);
}

function loadConfigurationFile(filename) {
  if (filename) {
    debug(`Loading configuration from ${filename}`);
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  }
  return filename;
}

// in a multi-process node environment, worker loggers will use
// process.send
const receiver = (worker, message) => {
  // prior to node v6, the worker parameter was not passed (args were message, handle)
  debug('cluster message received from worker ', worker, ': ', message);
  if (worker.topic && worker.data) {
    message = worker;
    worker = undefined;
  }
  if (message && message.topic && message.topic === 'log4js:message') {
    debug('received message: ', message.data);
    sendLogEventToAppender(deserialise(message.data));
  }
};

function configure(configurationFileOrObject) {
  let configObject = configurationFileOrObject;

  if (typeof configObject === 'string') {
    configObject = loadConfigurationFile(configurationFileOrObject);
  }
  debug(`Configuration is ${configObject}`);
  config = new Configuration(configObject);
  module.exports.levels = config.levels;
  const loggerModule = logger(config.levels, levelForCategory, setLevelForCategory);
  Logger = loggerModule.Logger;
  LoggingEvent = loggerModule.LoggingEvent;
  module.exports.connectLogger = connectModule(config.levels).connectLogger;

  // PM2 cluster support
  // PM2 runs everything as workers - install pm2-intercom for this to work.
  // we only want one of the app instances to write logs
  if (isPM2Master()) {
    debug('listening for PM2 broadcast messages');
    process.removeListener('message', receiver);
    process.on('message', receiver);
  } else if (cluster.isMaster) {
    cluster.removeListener('message', receiver);
    cluster.on('message', receiver);
  }

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
 */
const log4js = {
  getLogger,
  configure,
  shutdown,
  connectLogger,
  addLayout: layouts.addLayout
};

module.exports = log4js;
// set ourselves up
configure(process.env.LOG4JS_CONFIG || defaultConfig);
