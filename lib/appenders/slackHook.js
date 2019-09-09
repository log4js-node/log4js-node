const axios = require('axios')

let WebhookUrl = ''
let ErrorNot200 = true

function slackAppender(layout, timezoneOffset) {
  return (loggingEvent) => {
    axios.post(WebhookUrl, {
      text: `${layout(loggingEvent, timezoneOffset)}`
    }, {
      headers: {
        'Content-type': 'application/json'
      }
    })
      .then((resp) => {
        if (ErrorNot200 && resp.status !== 200) {
          throw new Error(resp.statusText)
        }
      })
      .catch((err) => {
        throw new Error(err)
      })
  };
}

function configure(config, layouts) {
  WebhookUrl = config.url
  ErrorNot200 = 'ErrorNot200' in config ? config.ErrorNot200 : ErrorNot200

  // use basic layout only
  const layout = layouts.basicLayout
  return slackAppender(layout, config.timezoneOffset);
}

module.exports.configure = configure;
