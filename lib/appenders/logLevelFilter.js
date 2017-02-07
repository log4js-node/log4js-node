'use strict';

const levels = require('../levels');

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

function configure(config, layouts, findAppender) {
  const appender = findAppender(config.appender);
  return logLevelFilter(config.level, config.maxLevel, appender);
}

module.exports.configure = configure;
