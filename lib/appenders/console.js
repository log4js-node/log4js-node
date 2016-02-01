"use strict";
var layouts = require('../layouts')
, levels = require('../levels')
, consoleLog = console.log.bind(console)
, consoleError = console.error.bind(console);

function consoleAppender (layout, timezoneOffset) {
  layout = layout || layouts.colouredLayout;
  return function(loggingEvent) {
    if (loggingEvent.level.level >= levels.ERROR.level) {
      consoleError(layout(loggingEvent, timezoneOffset));
    } else {
      consoleLog(layout(loggingEvent, timezoneOffset));
    }
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
