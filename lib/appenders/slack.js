'use strict';

const Slack = require('slack-node');
const layouts = require('../layouts');

let layout;
let slack;

function slackAppender(_config, _layout) {
  layout = _layout || layouts.basicLayout;

  return (loggingEvent) => {
    const data = {
      channel_id: _config.channel_id,
      text: layout(loggingEvent, _config.timezoneOffset),
      icon_url: _config.icon_url,
      username: _config.username
    };

    /* eslint no-unused-vars:0 */
    slack.api('chat.postMessage', {
      channel: data.channel_id,
      text: data.text,
      icon_url: data.icon_url,
      username: data.username
    }, (err, response) => {
      if (err) {
        throw err;
      }
    });
  };
}

function configure(_config) {
  if (_config.layout) {
    layout = layouts.layout(_config.layout.type, _config.layout);
  }

  slack = new Slack(_config.token);

  return slackAppender(_config, layout);
}

module.exports.name = 'slack';
module.exports.appender = slackAppender;
module.exports.configure = configure;
