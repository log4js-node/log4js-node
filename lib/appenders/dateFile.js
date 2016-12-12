'use strict';

const streams = require('streamroller');
const layouts = require('../layouts');
const path = require('path');
const os = require('os');

const eol = os.EOL || '\n';
const openFiles = [];

// close open files on process exit.
process.on('exit', () => {
  openFiles.forEach((file) => {
    file.end();
  });
});

/**
 * File appender that rolls files according to a date pattern.
 * @filename base filename.
 * @pattern the format that will be added to the end of filename when rolling,
 *          also used to check when to roll files - defaults to '.yyyy-MM-dd'
 * @layout layout function for log messages - defaults to basicLayout
 * @timezoneOffset optional timezone offset in minutes - defaults to system local
 */
function appender(
  filename,
  pattern,
  layout,
  options,
  timezoneOffset
) {
  layout = layout || layouts.basicLayout;
  const logFile = new streams.DateRollingFileStream(
    filename,
    pattern,
    options
  );
  openFiles.push(logFile);

  return (logEvent) => {
    logFile.write(layout(logEvent, timezoneOffset) + eol, 'utf8');
  };
}

function configure(config, options) {
  let layout;

  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

  if (!config.alwaysIncludePattern) {
    config.alwaysIncludePattern = false;
  }

  if (options && options.cwd && !config.absolute) {
    config.filename = path.join(options.cwd, config.filename);
  }

  return appender(
    config.filename,
    config.pattern,
    layout,
    config,
    config.timezoneOffset
  );
}

function shutdown(cb) {
  let completed = 0;
  let error;
  const complete = (err) => {
    error = error || err;
    completed++; // eslint-disable-line no-plusplus
    if (completed >= openFiles.length) {
      cb(error);
    }
  };
  if (!openFiles.length) {
    return cb();
  }

  return openFiles.forEach((file) => {
    if (!file.write(eol, 'utf-8')) {
      file.once('drain', () => {
        file.end(complete);
      });
    } else {
      file.end(complete);
    }
  });
}

module.exports.appender = appender;
module.exports.configure = configure;
module.exports.shutdown = shutdown;
