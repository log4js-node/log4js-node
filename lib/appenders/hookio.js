var log4js = require('../log4js');
var layouts = require('../layouts');
var Hook = require('hook.io').Hook;
var util = require('util');

var Logger = function createLogger(options) {
  var self = this;
  var actualAppender = options.actualAppender;
  Hook.call(self, options);
  self.on('hook::ready', function hookReady() {
    self.on('*::' + options.name + '::log', function log(loggingEvent) {
      deserializeLoggingEvent(loggingEvent);
      actualAppender(loggingEvent);
    });
  });
}
util.inherits(Logger, Hook);

function deserializeLoggingEvent(loggingEvent) {
  loggingEvent.startTime = new Date(loggingEvent.startTime);
  loggingEvent.level.toString = function levelToString() {
    return loggingEvent.level.levelStr;
  };
}

function createAppender(hookioOptions, actualAppender) {
  var loggerHook;
  if (hookioOptions.mode === 'master') {
    // Start the master hook, handling the actual logging
    loggerHook = new Logger({ name: hookioOptions.name, debug: hookioOptions.debug, actualAppender: actualAppender });
  } else {
    // Start a worker, just emitting events for a master
    loggerHook = new Hook({ name: hookioOptions.name, debug: hookioOptions.debug });
  }
  loggerHook.start();

  var loggerEvent = hookioOptions.name + '::log';
  return function log(loggingEvent) {
    loggerHook.emit(loggerEvent, loggingEvent);
  };
}

function configure(config) {
  var actualAppender;
  if (config.appender && config.mode === 'master') {
    log4js.loadAppender(config.appender.type);
    actualAppender = log4js.appenderMakers[config.appender.type](config.appender);
  }
  delete config.appender;
  delete config.type;
  return createAppender(config, actualAppender);
}

exports.name = 'hookio';
exports.appender = createAppender;
exports.configure = configure;
