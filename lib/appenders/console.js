"use strict";
var layouts = require('../layouts')
  , consoleLog = console.log.bind(console)
  , consoleDebug = console.debug && console.debug.bind(console) || consoleLog
  , consoleWarn = console.warn.bind(console)
  , consoleError = console.error.bind(console)
  , levelToConsoleFnMap = {
    TRACE: consoleLog,
    DEBUG: consoleDebug,
    INFO: consoleLog,
    WARN: consoleWarn,
    ERROR: consoleError,
    FATAL: consoleError
};

function consoleAppender (layout, timezoneOffset) {
  layout = layout || layouts.colouredLayout;
  return function(loggingEvent) {
    var consoleLoggerFn = levelToConsoleFnMap[loggingEvent.level.levelStr] || consoleWarn;
    consoleLoggerFn(layout(loggingEvent, timezoneOffset));
  };
}

function configure(config) {
  var layout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return consoleAppender(layout, config.timezoneOffset);
}

exports.appender = consoleAppender;
exports.configure = configure;
