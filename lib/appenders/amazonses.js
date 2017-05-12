"use strict";
var layouts = require("../layouts"),
    mailer = require("node-ses"),
    os = require('os');

/**
 * SES Appender - sends mail using "node-ses" module
 * 
 * @param config appender configuration data
 *    config.sendInterval time between log emails (in seconds), 
 *    if 0 then every event sends an email
 * @param layout a function that takes a logevent and returns a string (defaults to basicLayout).
 */
function sesAppender(config, layout) {

    if (!config.from ||
        !config.to ||
        !config.nodeSESSettings ||
        Object.keys(config.nodeSESSettings).length === 0
    ) {
        console.error("log4js.Amazon-ses-Appender - config error");
	return;
    }

    layout = layout || layouts.basicLayout;
    var subjectLayout = layouts.messagePassThroughLayout;
    var sendInterval = config.sendInterval * 1000 || 0;

    var logEventBuffer = [];
    var sendTimer;

    function sendBuffer() {
        if (logEventBuffer.length > 0) {

            var transport = mailer.createClient(config.nodeSESSettings);
            var firstEvent = logEventBuffer[0];
            var body = "";
            while (logEventBuffer.length > 0) {
                body += layout(logEventBuffer.shift()) + "\n";
            }

            var msg = {
                to: config.to,
                from: config.from,
                subject: config.subject || subjectLayout(firstEvent),
                headers: {
                    "Hostname": os.hostname()
                }
            };

            if (!config.html) {
                msg.altText = body;
            } else {
                msg.message = body;
            }

            if (config.cc) {
                msg.cc = config.cc;
            }

            if (config.bcc) {
                msg.bcc = config.bcc;
            }

            if (config.key) {
                msg.key = config.key;
            }

            if (config.secret) {
                msg.secret = config.secret;
            }

            if (config.algorithm) {
                msg.algorithm = config.algorithm;
            }

            if (config.amazon) {
                msg.amazon = config.amazon;
            }

            transport.sendemail(msg, function(error) {
                if (error) {
                    console.error("log4js.Amazon-ses-Appender - Error happened", error);
                }
            });

        }
    }

    function scheduleSend() {
        if (!sendTimer) {
            sendTimer = setTimeout(function() {
                sendTimer = null;
                sendBuffer();
            }, sendInterval);
        }
    }

    return function(loggingEvent) {
        logEventBuffer.push(loggingEvent);
        if (sendInterval > 0) {
            scheduleSend();
        } else {
            sendBuffer();
        }
    };
}

function configure(config) {
    var layout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }
    return sesAppender(config, layout);
}

exports.name = "amazonses";
exports.appender = sesAppender;
exports.configure = configure;
