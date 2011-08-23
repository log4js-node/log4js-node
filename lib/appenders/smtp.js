var layouts = require("../layouts"),
	mailer = require("nodemailer");

/**
* SMTP Appender. Sends logging events using SMTP protocol. 
* It can either send an email on each event or group several logging events gathered during specified interval.
*
* @param recipients comma separated list of email recipients
* @param sender sender of all emails (defaults to SMTP user)
* @param subject subject of all email messages (defaults to first event's message) 
* @param layout a function that takes a logevent and returns a string (defaults to basicLayout).
* @param smtpConfig SMTP configuration for 'nodemailer'
* @param sendInterval the time in seconds between sending attempts (defualts to 0); 
* all events are buffered and sent in one email during this time; if 0 than every event sends an email
*/
function smtpAppender(recipients, sender, subject, layout, smtpConfig, sendInterval) {
	sender = sender || smtpConfig.user;
	layout = layout || layouts.basicLayout;
	subjectLayout = layouts.messagePassThroughLayout;
	mailer.SMTP = smtpConfig;
	sendInterval = sendInterval*1000 || 0;
	
	if (sendInterval)
		setTimeout(sendBuffer, sendInterval);
	
	var logEventBuffer = [];
	
	function sendBuffer() {
		if (logEventBuffer.length == 0)
			return;
		
		var firstEvent = logEventBuffer[0];
		var body = "";
		while (logEventBuffer.length > 0) {
			body += layout(logEventBuffer.shift()) + "\n";
		}
		
		var msg = {
				sender: sender,
				to: recipients,
				subject: subject || subjectLayout(firstEvent.data),
				body: body
			};
		mailer.send_mail(msg, function(error, success) {
			if (error) {
				console.error("log4js.smtpAppender - Error happened ", error);
			}
		});
	}
	
	return function(loggingEvent) {
		logEventBuffer.push(loggingEvent);
		if (sendInterval == 0)
			sendBuffer();
	};
}

function configure(config) {
	var layout;
	if (config.layout) {
		layout = layouts.layout(config.layout.type, config.layout);
	}
	return smtpAppender(config.recipients, config.sender, config.subject, layout, config.smtp, config.sendInterval);
}

exports.name = "smtp";
exports.appender = smtpAppender;
exports.configure = configure;
