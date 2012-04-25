var levels = require('../levels');
var log4js = require('../log4js');

function logLevelFilter (levelString, appender) {
    var level = levels.toLevel(levelString);
    if (Object.prototype.toString.call(appender) == '[object Function]') {
      return function(logEvent) {
	        if (logEvent.level.isGreaterThanOrEqualTo(level)) {
	            appender(logEvent);
	        }
      }
    }
    var originalLogAppender = appender.log;
    appender.log = function(logEvent) {
	      if (logEvent.level.isGreaterThanOrEqualTo(level)) {
	          originalLogAppender(logEvent);
	      }
    }
    return appender;
}

function configure(config) {
    log4js.loadAppender(config.appender.type);
    var appender = log4js.appenderMakers[config.appender.type](config.appender);
    return logLevelFilter(config.level, appender);
}

exports.name = "logLevelFilter";
exports.appender = logLevelFilter;
exports.configure = configure;
