'use strict';

const log4js = require('../log4js');

function categoryFilter(excludes, appender) {
  if (typeof excludes === 'string') excludes = [excludes];
  return (logEvent) => {
    if (excludes.indexOf(logEvent.categoryName) === -1) {
      appender(logEvent);
    }
  };
}

function configure(config, options) {
  log4js.loadAppender(config.appender.type);
  const appender = log4js.appenderMakers[config.appender.type](config.appender, options);
  return categoryFilter(config.exclude, appender);
}

module.exports.appender = categoryFilter;
module.exports.configure = configure;
