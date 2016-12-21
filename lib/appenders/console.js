'use strict';

const layouts = require('../layouts');

const consoleLog = console.log.bind(console);

function consoleAppender(layout, timezoneOffset) {
  layout = layout || layouts.colouredLayout;
  return (loggingEvent) => {
    consoleLog(layout(loggingEvent, timezoneOffset));
  };
}

function configure(config) {
  let layout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return consoleAppender(layout, config.timezoneOffset);
}

module.exports.appender = consoleAppender;
module.exports.configure = configure;
