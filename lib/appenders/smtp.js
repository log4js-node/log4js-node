'use strict';

const layouts = require('../layouts');
const mailer = require('nodemailer');
const os = require('os');

const logEventBuffer = [];
let subjectLayout;
let layout;

let unsentCount = 0;
let shutdownTimeout;

let sendInterval;
let sendTimer;

let config;

function sendBuffer() {
  if (logEventBuffer.length > 0) {
    const transportOpts = getTransportOptions(config);
    const transport = mailer.createTransport(transportOpts);
    const firstEvent = logEventBuffer[0];
    let body = '';
    const count = logEventBuffer.length;
    while (logEventBuffer.length > 0) {
      body += `${layout(logEventBuffer.shift(), config.timezoneOffset)}\n`;
    }

    const msg = {
      to: config.recipients,
      subject: config.subject || subjectLayout(firstEvent),
      headers: { Hostname: os.hostname() }
    };

    if (config.attachment.enable === true) {
      msg[config.html ? 'html' : 'text'] = config.attachment.message;
      msg.attachments = [
        {
          filename: config.attachment.filename,
          contentType: 'text/x-log',
          content: body
        }
      ];
    } else {
      msg[config.html ? 'html' : 'text'] = body;
    }

    if (config.sender) {
      msg.from = config.sender;
    }
    transport.sendMail(msg, (error) => {
      if (error) {
        console.error('log4js.smtpAppender - Error happened', error);
      }
      transport.close();
      unsentCount -= count;
    });
  }
}

function getTransportOptions() {
  let transportOpts = null;
  if (config.SMTP) {
    transportOpts = config.SMTP;
  } else if (config.transport) {
    const plugin = config.transport.plugin || 'smtp';
    const transportModule = `nodemailer-${plugin}-transport`;

    /* eslint global-require:0 */
    const transporter = require(transportModule); // eslint-disable-line
    transportOpts = transporter(config.transport.options);
  }

  return transportOpts;
}

function scheduleSend() {
  if (!sendTimer) {
    sendTimer = setTimeout(() => {
      sendTimer = null;
      sendBuffer();
    }, sendInterval);
  }
}

/**
 * SMTP Appender. Sends logging events using SMTP protocol.
 * It can either send an email on each event or group several
 * logging events gathered during specified interval.
 *
 * @param _config appender configuration data
 *    config.sendInterval time between log emails (in seconds), if 0
 *    then every event sends an email
 *    config.shutdownTimeout time to give up remaining emails (in seconds; defaults to 5).
 * @param _layout a function that takes a logevent and returns a string (defaults to basicLayout).
 */
function smtpAppender(_config, _layout) {
  config = _config;

  if (!config.attachment) {
    config.attachment = {};
  }

  config.attachment.enable = !!config.attachment.enable;
  config.attachment.message = config.attachment.message || 'See logs as attachment';
  config.attachment.filename = config.attachment.filename || 'default.log';
  layout = _layout || layouts.basicLayout;
  subjectLayout = layouts.messagePassThroughLayout;
  sendInterval = config.sendInterval * 1000 || 0;

  shutdownTimeout = ('shutdownTimeout' in config ? config.shutdownTimeout : 5) * 1000;

  return (loggingEvent) => {
    unsentCount++;  // eslint-disable-line no-plusplus
    logEventBuffer.push(loggingEvent);
    if (sendInterval > 0) {
      scheduleSend();
    } else {
      sendBuffer();
    }
  };
}

function configure(_config) {
  config = _config;
  if (_config.layout) {
    layout = layouts.layout(_config.layout.type, _config.layout);
  }
  return smtpAppender(_config, layout);
}

function shutdown(cb) {
  if (shutdownTimeout > 0) {
    setTimeout(() => {
      if (sendTimer) {
        clearTimeout(sendTimer);
      }

      sendBuffer();
    }, shutdownTimeout);
  }

  (function checkDone() {
    if (unsentCount > 0) {
      setTimeout(checkDone, 100);
    } else {
      cb();
    }
  }());
}

module.exports.name = 'smtp';
module.exports.appender = smtpAppender;
module.exports.configure = configure;
module.exports.shutdown = shutdown;
