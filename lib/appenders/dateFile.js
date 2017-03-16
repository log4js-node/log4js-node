"use strict";
var streams = require('streamroller')
, layouts = require('../layouts')
, fs = require('fs')
, path = require('path')
, os = require('os')
, moment = require('moment')
, cron = require('node-cron')
, configuration
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
 * @layout layout function for log messages - defaults to basicLayout
 * @timezoneOffset optional timezone offset in minutes - defaults to system local
 */
function appender(filename, pattern, layout, options, timezoneOffset) {
  layout = layout || layouts.basicLayout;

  var logFile = new streams.DateRollingFileStream(
    filename,
    pattern,
    options
  );
  openFiles.push(logFile);

  return function(logEvent) {
    logFile.write(layout(logEvent, timezoneOffset) + eol, "utf8");
  };
}

function configure(config, options) {
  var layout;
  configuration = config;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

  if (!config.alwaysIncludePattern) {
    config.alwaysIncludePattern = false;
  }

  if (options && options.cwd && !config.absolute) {
    config.filename = path.join(options.cwd, config.filename);
  }

  if(config.expires) {
    var interval = getExpirationInterval();
    var cronExpression = getCronExpression(interval);
    purgeExpiredFiles();
    var cronTask = cron.schedule(cronExpression, function() {
      purgeExpiredFiles();
    }, false);
    cronTask.start();
  }

  return appender(
    config.filename,
    config.pattern,
    layout,
    config,
    config.timezoneOffset
  );
}

function purgeExpiredFiles() {
  var p = path.dirname(configuration.filename);
  var logs = fs.readdirSync(p);

  for(var i in logs) {

    var logPath = p+'/'+logs[i];
    var fstats = fs.statSync(logPath);
    var expired = getExpirationNumber();
    var msg = '';

    if(fstats.isDirectory())
      continue;

    var mTime = moment([
        fstats.mtime.getFullYear(), fstats.mtime.getMonth(),
        fstats.mtime.getDate(), fstats.mtime.getHours(),
        fstats.mtime.getMinutes(), fstats.mtime.getSeconds(),
        fstats.mtime.getMilliseconds()
    ]);

   if(mTime.isBefore(expired)) {
      fs.unlinkSync(logPath);
      msg += (logPath + '- last modified: ' + mTime + ' expiration - ' + expired + '\n');
   }
  }
  return (msg.length > 0?msg:'');
}

function shutdown(cb) {
  var completed = 0;
  var error;
  var complete = function(err) {
    error = error || err;
    completed++;
    if (completed >= openFiles.length) {
      cb(error);
    }
  };
  if (!openFiles.length) {
    return cb();
  }
  openFiles.forEach(function(file) {
    if (!file.write(eol, "utf-8")) {
      file.once('drain', function() {
        file.end(complete);
      });
    } else {
      file.end(complete);
    }
  });
}

function getExpirationInterval() {
  return configuration.expires.substring(configuration.expires.length-1);
}

function getExpirationNumber() {

  var number = Number(configuration.expires.substring(0, configuration.expires.length-1));
  return  new Date(moment().subtract(number, getExpirationInterval()));
}

function getCronExpression(interval) {
  var cronExpression = '';
  switch (interval) {
    case 's':
      cronExpression = '* * * * *';     //once a minute
      break;
    case 'm':
      cronExpression =  '* * * * *';     //once a minute
      break;
    case 'h':
      cronExpression =  '0 * * * *';   //one an hour
      break;
    default:
      cronExpression =  '0 0 * * *';      //daily
      break;
  }
  return cronExpression;
}

exports.appender = appender;
exports.configure = configure;
exports.shutdown = shutdown;
