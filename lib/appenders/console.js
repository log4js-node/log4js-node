var layouts = require('../layouts'),
    consoleLog = console.log;

function consoleAppender (layout) {
    layout = layout || layouts.colouredLayout;
    return function(loggingEvent) {
	consoleLog(layout(loggingEvent));
    };
}

function configure(config) {
    var layout;
    if (config.layout) {
	layout = layouts.layout(config.layout.type, config.layout);
    }
    return consoleAppender(layout);
}

exports.name = "console";
exports.appender = consoleAppender;
exports.configure = configure;
