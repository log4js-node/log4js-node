'use strict';

const debug = require('debug')('log4js:multiFile');
const path = require('path');
const fileAppender = require('./file');

const findFileKey = (property, event) => event[property] || event.context[property];

module.exports.configure = (config, layouts) => {
  debug('Creating a multi-file appender');
  const files = new Map();

  const appender = (logEvent) => {
    const fileKey = findFileKey(config.property, logEvent);
    debug('fileKey for property ', config.property, ' is ', fileKey);
    if (fileKey) {
      let file = files.get(fileKey);
      debug('existing file appender is ', file);
      if (!file) {
        debug('creating new file appender');
        config.filename = path.join(config.base, fileKey + config.extension);
        file = fileAppender.configure(config, layouts);
        files.set(fileKey, file);
      }

      file(logEvent);
    }
    debug('No fileKey for logEvent, quietly ignoring this log event');
  };

  appender.shutdown = (cb) => {
    let shutdownFunctions = files.size;
    let error;
    files.forEach((app, fileKey) => {
      debug('calling shutdown for ', fileKey);
      app.shutdown((err) => {
        error = error || err;
        shutdownFunctions -= 1;
        if (shutdownFunctions <= 0) {
          cb(error);
        }
      });
    });
  };

  return appender;
};
