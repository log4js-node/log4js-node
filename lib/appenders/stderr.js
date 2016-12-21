'use strict';

const layouts = require('../layouts');

function stderrAppender(layout, timezoneOffset) {
  layout = layout || layouts.colouredLayout;
  return (loggingEvent) => {
    process.stderr.write(`${layout(loggingEvent, timezoneOffset)}\n`);
  };
}

function configure(config) {
  let layout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return stderrAppender(layout, config.timezoneOffset);
}

module.exports.appender = stderrAppender;
module.exports.configure = configure;
