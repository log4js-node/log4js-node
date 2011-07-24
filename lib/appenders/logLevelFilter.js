var levels = require('../levels');

function logLevelFilter (levelString, appender) {
    var level = levels.toLevel(levelString);
    return function(logEvent) {
	if (logEvent.level.isGreaterThanOrEqualTo(level)) {
	    appender(logEvent);
	}
    }
}

function configure(config) {
    var appender = config.makers[config.appender.type](config.appender);
    return logLevelFilter(config.level, appender);
}

exports.name = "logLevelFilter";
exports.appender = logLevelFilter;
exports.configure = configure;