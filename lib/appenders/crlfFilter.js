const debug = require('debug')('log4js:crlfFilter');

function crlfFilter(appenders) {
  return (logEvent) => {
    const filteredData = logEvent.data.map((i) => {
      if (typeof i.replace === 'function') return i.replace(/\n/g, '\n> '); // add a > prefix
      return i;
    });
    logEvent.data = filteredData;
    appenders.forEach((appender) => {
      appender(logEvent);
    });
  };
}

function configure(config, layouts, findAppender) {
  const addToSet = function (input, set = new Set()) {
    const addAppender = function (appenderName) {
      debug(`actual appender is ${appenderName}`);
      const appender = findAppender(appenderName);
      if (!appender) {
        debug(`actual appender "${config.appender}" not found`);
        throw new Error(`crlfFilter appender "${config.appender}" not defined`);
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
    throw new Error('crlfFilter appender must have an "appender" defined');
  }

  return crlfFilter(appenders);
}

module.exports.configure = configure;
