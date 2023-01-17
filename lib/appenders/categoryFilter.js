const debug = require('debug')('log4js:categoryFilter');

function categoryFilter(excludes, appenders) {
  if (typeof excludes === 'string') excludes = [excludes];
  return (logEvent) => {
    debug(`Checking ${logEvent.categoryName} against ${excludes}`);
    if (excludes.indexOf(logEvent.categoryName) === -1) {
      debug('Not excluded, sending to appenders');
      appenders.forEach((appender) => {
        appender(logEvent);
      });
    }
  };
}

function configure(config, layouts, findAppender) {
  const addToSet = function (input, set = new Set()) {
    const addAppender = function (appenderName) {
      debug(`actual appender is ${appenderName}`);
      const appender = findAppender(appenderName);
      if (!appender) {
        debug(`actual appender "${config.appender}" not found`);
        throw new Error(
          `categoryFilter appender "${config.appender}" not defined`
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
    throw new Error('categoryFilter appender must have an "appender" defined');
  }

  return categoryFilter(config.exclude, appenders);
}

module.exports.configure = configure;
