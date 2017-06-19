'use strict';

const stream = process.stdout;

function consoleAppender(layout, timezoneOffset) {
  return (loggingEvent) => {
    stream.write(layout(loggingEvent, timezoneOffset));
  };
}

function configure(config, layouts) {
  let layout = layouts.colouredLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return consoleAppender(layout, config.timezoneOffset);
}

module.exports.configure = configure;
