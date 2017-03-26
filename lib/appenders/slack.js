'use strict';

const Slack = require('slack-node');

function slackAppender(_config, layout, slack) {
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

function configure(_config, layouts) {
  const slack = new Slack(_config.token);

  let layout = layouts.basicLayout;
  if (_config.layout) {
    layout = layouts.layout(_config.layout.type, _config.layout);
  }

  return slackAppender(_config, layout, slack);
}

module.exports.configure = configure;
