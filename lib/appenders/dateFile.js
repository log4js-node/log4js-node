"use strict";
var streams = require('../streams')
, layouts = require('../layouts')
, path = require('path')
, os = require('os')
, eol = os.EOL || '\n'
, openFiles = [];

//close open files on process exit.
process.on('exit', function() {
  openFiles.forEach(function (file) {
    file.end();
  });
});

/**
 * File appender that rolls files according to a date pattern.
 * @filename base filename.
 * @pattern the format that will be added to the end of filename when rolling,
 *          also used to check when to roll files - defaults to '.yyyy-MM-dd'
 * @param backups - the number of log files to keep after date has changed.
 * @layout layout function for log messages - defaults to basicLayout
 */
function appender(filename, pattern, alwaysIncludePattern, backups, layout) {
  layout = layout || layouts.basicLayout;

  if (backups !== undefined && (typeof backups != 'number' || !/^\d+$/.test(backups))) {
    throw new Error('Parameter backups must be positive integer or can be ignored');
  }

  var logFile = new streams.DateRollingFileStream(
    filename, 
    pattern, 
    { alwaysIncludePattern: alwaysIncludePattern,
      backups: backups}
  );
  openFiles.push(logFile);
  
  return function(logEvent) {
    logFile.write(layout(logEvent) + eol, "utf8");
  };

}

function configure(config, options) {
  var layout;
  
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  
  if (!config.alwaysIncludePattern) {
    config.alwaysIncludePattern = false;
  }
  
  if (options && options.cwd && !config.absolute) {
    config.filename = path.join(options.cwd, config.filename);
  }

  return appender(config.filename, config.pattern, config.alwaysIncludePattern, config.backups, layout);
}

exports.appender = appender;
exports.configure = configure;
