"use strict";
var debug = require('debug')('log4js:logLevelFilter');

module.exports = function(layouts, levels) {

  function logLevelFilter(allowedLevels, appender) {
    return function(logEvent) {
      debug("Checking ", logEvent.level, " against ", allowedLevels);
      if (allowedLevels.some(function(item) { return item.level === logEvent.level.level; })) {
        debug("Sending ", logEvent, " to appender ", appender);
        appender(logEvent);
      }
    };
  }

  return function configure(config, appenderByName) {
    if (!Array.isArray(config.allow)) {
      throw new Error("No allowed log levels specified.");
    }

    var allowedLevels = config.allow.map(function(allowed) {
      var level = levels.toLevel(allowed);
      if (!level) {
        throw new Error("Unrecognised log level '" + allowed + "'.");
      }
      return level;
    });

    if (allowedLevels.length === 0) {
      throw new Error("No allowed log levels specified.");
    }
    
    if (!config.appender) {
      throw new Error("Missing an appender.");
    }

    return logLevelFilter(allowedLevels, appenderByName(config.appender));
  };

};
