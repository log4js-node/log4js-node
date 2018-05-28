'use strict';

/**
 * This appender has been deprecated.
 * Updates and bug fixes should be made against https://github.com/log4js-node/smtp
 */

const mailer = require('nodemailer');
const os = require('os');

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
function smtpAppender(config, layout, subjectLayout) {
  if (!config.attachment) {
    config.attachment = {};
  }

  config.attachment.enable = !!config.attachment.enable;
  config.attachment.message = config.attachment.message || 'See logs as attachment';
  config.attachment.filename = config.attachment.filename || 'default.log';

  const sendInterval = config.sendInterval * 1000 || 0;
  const shutdownTimeout = ('shutdownTimeout' in config ? config.shutdownTimeout : 5) * 1000;
  const transport = mailer.createTransport(getTransportOptions());
  const logEventBuffer = [];

  let unsentCount = 0;
  let sendTimer;

  function sendBuffer() {
    if (logEventBuffer.length > 0) {
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
    let options = null;
    if (config.SMTP) {
      options = config.SMTP;
    } else if (config.transport) {
      options = config.transport.options || {};
      options.transport = config.transport.plugin || 'smtp';
    }
    return options;
  }

  function scheduleSend() {
    if (!sendTimer) {
      sendTimer = setTimeout(() => {
        sendTimer = null;
        sendBuffer();
      }, sendInterval);
    }
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

  const appender = (loggingEvent) => {
    unsentCount++; // eslint-disable-line no-plusplus
    logEventBuffer.push(loggingEvent);
    if (sendInterval > 0) {
      scheduleSend();
    } else {
      sendBuffer();
    }
  };

  appender.shutdown = shutdown;

  // trigger a deprecation warning.
  appender.deprecated = '@logj4s-node/smtp';

  return appender;
}

function configure(config, layouts) {
  const subjectLayout = layouts.messagePassThroughLayout;
  let layout = layouts.basicLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return smtpAppender(config, layout, subjectLayout);
}


module.exports.configure = configure;
