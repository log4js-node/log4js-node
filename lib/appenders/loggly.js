'use strict';
var layouts = require('../layouts')
, loggly = require('loggly')
, os = require('os')
, passThrough = layouts.messagePassThroughLayout;


/**
 * Loggly Appender. Sends logging events to Loggly using node-loggly 
 *
 * @param config object with loggly configuration data
 * {
 *   token: 'your-really-long-input-token',
 *   subdomain: 'your-subdomain',
 *   tags: ['loggly-tag1', 'loggly-tag2', .., 'loggly-tagn'] 
 * }
 * @param layout a function that takes a logevent and returns a string (defaults to objectLayout).
 */
function logglyAppender(config, layout) {
	var client = loggly.createClient(config);

	function packageMessage(loggingEvent) {
		function BaseItem(level, msg) {
			this.level    = level || loggingEvent.level.toString();
			this.category = loggingEvent.categoryName;
			this.hostname = os.hostname().toString();
			if (typeof msg !== 'undefined')
				this.msg = msg;
		};

    var formattedMsg = passThrough(loggingEvent);
    return new BaseItem(formattedMsg);
	};

	return function(loggingEvent) {
		var a = layout ? layout(loggingEvent) : packageMessage(loggingEvent);
		client.log(a, config.tags);
	};
}

function configure(config) {
	var layout;
	if (config.layout) {
		layout = layouts.layout(config.layout.type, config.layout);
	}
	return logglyAppender(config, layout);
}

exports.name      = 'loggly';
exports.appender  = logglyAppender;
exports.configure = configure;
