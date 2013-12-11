"use strict";
var amqp = require("amqp");

function amqpAppender(options) {
	var _options = normalizeOptions(options, {
		connection: {
			url: "amqp://guest:guest@localhost:5672",
			clientProperties: {
				product: 'log4js'
			}
		},
		exchange: {
			name: 'logExchange',
			type: 'fanout',
			durable: true,
			autoDelete: false
		},
		publish: {
			mandatory: true,
			deliveryMode: 2, // persistent
			routingKey: 'msg'
		},
		sendInterval: 0
	});

	_options.sendInterval *= 1000;

	var sendTimer;

	var exchange;
	var logEventBuffer = [];

	var onReady = function() {
		connection.removeListener('ready', onReady);
		connection.exchange(_options.exchange.name, _options.exchange, function (xch) {
			exchange = xch;
			publish(); // in case messages are waiting to be written
		});
	};
	var connection = amqp.createConnection(_options.connection);
	connection.on('ready', onReady);

	function publish() {
		if (!exchange) {
			return;
		}

		var logs = [];
		while (logEventBuffer.length > 0) {
			logs = logEventBuffer.shift().data;
			while (logs.length > 0) {
				exchange.publish(_options.publish.routingKey, logs.shift(), _options.publish);
			}
		}
	}

	function schedulePublish() {
		if (sendTimer) {
			return;
		}

		sendTimer = setTimeout(function () {
			clearTimeout(sendTimer);
			sendTimer = null;
			publish();
		}, _options.sendInterval);
	}

	function normalizeOptions(obj, defaults) {
		obj = obj || {};

		Object.keys(defaults).forEach(function (key) {
			if (!obj.hasOwnProperty(key)) {
				obj[key] = defaults[key];
				return;
			}
			if (Object.prototype.toString.call(obj[key]) === '[object Object]') {
				return normalizeOptions(obj[key], defaults[key]);
			} else {
				obj[key] = obj[key];
			}
		});
		return obj;
	}

	return function (loggingEvent) {
		logEventBuffer.push(loggingEvent);

		if (_options.sendInterval > 0) {
			schedulePublish();
			return;
		}

		publish();
	};
}

exports.name = "amqp";
exports.appender = amqpAppender;
exports.configure = amqpAppender;
