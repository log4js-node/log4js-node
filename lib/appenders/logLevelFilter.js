'use strict';

const levels = require('../levels');
const log4js = require('../log4js');

function logLevelFilter(minLevelString, maxLevelString, appender) {
  const minLevel = levels.toLevel(minLevelString);
  const maxLevel = levels.toLevel(maxLevelString, levels.FATAL);
  return (logEvent) => {
    const eventLevel = logEvent.level;
    if (eventLevel.isGreaterThanOrEqualTo(minLevel) && eventLevel.isLessThanOrEqualTo(maxLevel)) {
      appender(logEvent);
    }
  };
}

function configure(config, options) {
  log4js.loadAppender(config.appender.type);
  const appender = log4js.appenderMakers[config.appender.type](config.appender, options);
  return logLevelFilter(config.level, config.maxLevel, appender);
}

module.exports.appender = logLevelFilter;
module.exports.configure = configure;
