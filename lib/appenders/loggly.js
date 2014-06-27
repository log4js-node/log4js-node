'use strict';
var layouts = require('../layouts')
, loggly = require('loggly')
, os = require('os');

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

	var packageMessage = function (loggingEvent) {
		var BaseItem = function(level, msg) {
			this.level    = level || loggingEvent.level.toString();
			this.category = loggingEvent.categoryName;
			this.hostname = os.hostname().toString();
			if (typeof msg !== 'undefined')
				this.msg = msg;
		};

		var packageItem = function (item) {
			if (item instanceof Error)
				return new BaseItem('ERROR', item.message);

			if (['string', 'number', 'boolean'].indexOf(typeof item) > -1 )
				return new BaseItem(undefined, item);

			var obj = new BaseItem();
			if (Array.isArray(item))
				return item.unshift(obj); //add base object as first item

			if (item && Object.prototype.toString.call(item) === '[object Object]') {
				for (var key in item) {
					if (item.hasOwnProperty(key)) {
						obj[key] = item[key]; //don't do packageItem on nested items, because level, category and hostname are needed on top level items only.
					}
				}
			}

			return obj;
		};

		if (loggingEvent.data.length === 1) {
			return packageItem(loggingEvent.data[0]);
		}
		//length >1
		var msg = loggingEvent.data;
        for (var i = 0, l = msg.length; i < l; i++) {
        	msg[i] = packageItem(msg[i]);
        }

		return msg;
	};
	
	return function(loggingEvent) {
		var a = layout ? layout(loggingEvent) : packageMessage(loggingEvent);
		//console.log('log now', a);
		client.log(a, config.tags, function(err, result) {
			if (err) {
				throw err;
			}
		});
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