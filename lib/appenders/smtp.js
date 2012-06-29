var layouts = require("../layouts"),
	mailer = require("nodemailer"),
	os = require('os');

/**
* SMTP Appender. Sends logging events using SMTP protocol. 
* It can either send an email on each event or group several logging events gathered during specified interval.
*
* @param config appender configuration data
* @param layout a function that takes a logevent and returns a string (defaults to basicLayout).
* all events are buffered and sent in one email during this time; if 0 than every event sends an email
*/
function smtpAppender(config, layout) {
	layout = layout || layouts.basicLayout;
	var subjectLayout = layouts.messagePassThroughLayout;
	var sendInterval = config.sendInterval*1000 || 0;
	
	var logEventBuffer = [];
	var sendTimer;
	var transport = mailer.createTransport(config.transport, config[config.transport]);
	
	function sendBuffer() {
		if (logEventBuffer.length == 0)
			return;
		
		var firstEvent = logEventBuffer[0];
		var body = "";
		while (logEventBuffer.length > 0) {
			body += layout(logEventBuffer.shift()) + "\n";
		}
		
		var msg = {
				to: config.recipients,
				subject: config.subject || subjectLayout(firstEvent),
				text: body,
				headers: {"Hostname": os.hostname()}
			};
		if (config.sender)
			msg.from = config.sender;
		transport.sendMail(msg, function(error, success) {
			if (error) {
				console.error("log4js.smtpAppender - Error happened ", error);
			}
		});
	}
	
	function scheduleSend() {
		if (!sendTimer)
			sendTimer = setTimeout(function() {
				sendTimer = null; 
				sendBuffer();
			}, sendInterval);
	}
	
	return function(loggingEvent) {
		logEventBuffer.push(loggingEvent);
		if (sendInterval > 0)
			scheduleSend();
		else
			sendBuffer();
	};
}

function configure(config) {
	var layout;
	if (config.layout) {
		layout = layouts.layout(config.layout.type, config.layout);
	}
	return smtpAppender(config, layout);
}

exports.name = "smtp";
exports.appender = smtpAppender;
exports.configure = configure;

