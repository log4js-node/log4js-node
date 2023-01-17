const debug = require('debug')('log4js:logLevelFilter');

function logLevelFilter(minLevelString, maxLevelString, appenders, levels) {
  const minLevel = levels.getLevel(minLevelString);
  const maxLevel = levels.getLevel(maxLevelString, levels.FATAL);
  return (logEvent) => {
    const eventLevel = logEvent.level;
    if (
      minLevel.isLessThanOrEqualTo(eventLevel) &&
      maxLevel.isGreaterThanOrEqualTo(eventLevel)
    ) {
      appenders.forEach((appender) => {
        appender(logEvent);
      });
    }
  };
}

function configure(config, layouts, findAppender, levels) {
  const addToSet = function (input, set = new Set()) {
    const addAppender = function (appenderName) {
      debug(`actual appender is ${appenderName}`);
      const appender = findAppender(appenderName);
      if (!appender) {
        debug(`actual appender "${config.appender}" not found`);
        throw new Error(
          `logLevelFilter appender "${config.appender}" not defined`
        );
      } else {
        set.add(appender);
      }
    };

    if (input && !Array.isArray(input)) input = [input];
    if (input) input.forEach((appenderName) => addAppender(appenderName));

    return set;
  };

  const appenders = new Set();
  addToSet(config.appender, appenders);
  addToSet(config.appenders, appenders);

  if (appenders.size === 0) {
    debug(`no appender found in config ${config}`);
    throw new Error('logLevelFilter appender must have an "appender" defined');
  }

  return logLevelFilter(config.level, config.maxLevel, appenders, levels);
}

module.exports.configure = configure;
