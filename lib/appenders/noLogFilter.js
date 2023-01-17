const debug = require('debug')('log4js:noLogFilter');

/**
 * The function removes empty or null regexp from the array
 * @param {string[]} regexp
 * @returns {string[]} a filtered string array with not empty or null regexp
 */
function removeNullOrEmptyRegexp(regexp) {
  const filtered = regexp.filter((el) => el != null && el !== '');
  return filtered;
}

/**
 * Returns a function that will exclude the events in case they match
 * with the regular expressions provided
 * @param {(string|string[])} filters contains the regexp that will be used for the evaluation
 * @param {*} appenders
 * @returns {function}
 */
function noLogFilter(filters, appenders) {
  return (logEvent) => {
    debug(`Checking data: ${logEvent.data} against filters: ${filters}`);
    if (typeof filters === 'string') {
      filters = [filters];
    }
    filters = removeNullOrEmptyRegexp(filters);
    const regex = new RegExp(filters.join('|'), 'i');
    if (
      filters.length === 0 ||
      logEvent.data.findIndex((value) => regex.test(value)) < 0
    ) {
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
          `noLogFilter appender "${config.appender}" not defined`
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
    throw new Error('noLogFilter appender must have an "appender" defined');
  }

  return noLogFilter(config.exclude, appenders);
}

module.exports.configure = configure;
