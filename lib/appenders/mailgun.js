'use strict';

const layouts = require('../layouts');
const mailgunFactory = require('mailgun-js');

let layout;
let config;
let mailgun;

function mailgunAppender(_config, _layout) {
  config = _config;
  layout = _layout || layouts.basicLayout;

  return (loggingEvent) => {
    const data = {
      from: _config.from,
      to: _config.to,
      subject: _config.subject,
      text: layout(loggingEvent, config.timezoneOffset)
    };

    /* eslint no-unused-vars:0 */
    mailgun.messages().send(data, (error, body) => {
      if (error !== null) console.error('log4js.mailgunAppender - Error happened', error);
    });
  };
}

function configure(_config) {
  config = _config;

  if (_config.layout) {
    layout = layouts.layout(_config.layout.type, _config.layout);
  }

  mailgun = mailgunFactory({
    apiKey: _config.apikey,
    domain: _config.domain
  });

  return mailgunAppender(_config, layout);
}

module.exports.appender = mailgunAppender;
module.exports.configure = configure;
