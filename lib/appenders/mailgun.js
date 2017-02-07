'use strict';

const mailgunFactory = require('mailgun-js');

function mailgunAppender(config, layout) {
  const mailgun = mailgunFactory({
    apiKey: config.apikey,
    domain: config.domain
  });

  return (loggingEvent) => {
    const data = {
      from: config.from,
      to: config.to,
      subject: config.subject,
      text: layout(loggingEvent, config.timezoneOffset)
    };

    /* eslint no-unused-vars:0 */
    mailgun.messages().send(data, (error, body) => {
      if (error !== null) console.error('log4js.mailgunAppender - Error happened', error);
    });
  };
}

function configure(config, layouts) {
  let layout = layouts.basicLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

  return mailgunAppender(config, layout);
}

module.exports.configure = configure;
