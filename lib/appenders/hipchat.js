'use strict';

const hipchat = require('hipchat-notifier');

/**
 @invoke as

 log4js.configure({
    'appenders': { 'hipchat':
      {
        'type' : 'hipchat',
        'hipchat_token': '< User token with Notification Privileges >',
        'hipchat_room': '< Room ID or Name >',
        // optionl
        'hipchat_from': '[ additional from label ]',
        'hipchat_notify': '[ notify boolean to bug people ]',
        'hipchat_host' : 'api.hipchat.com'
      }
    },
    categories: { default: { appenders: ['hipchat'], level: 'debug' }}
  });

 var logger = log4js.getLogger('hipchat');
 logger.warn('Test Warn message');

 @invoke
 */

function hipchatNotifierResponseCallback(err) {
  if (err) {
    throw err;
  }
}

function hipchatAppender(config, layout) {
  const notifier = hipchat.make(config.hipchat_room, config.hipchat_token);

  return (loggingEvent) => {
    let notifierFn;

    notifier.setRoom(config.hipchat_room);
    notifier.setFrom(config.hipchat_from || '');
    notifier.setNotify(config.hipchat_notify || false);

    if (config.hipchat_host) {
      notifier.setHost(config.hipchat_host);
    }

    switch (loggingEvent.level.toString()) {
      case 'TRACE':
      case 'DEBUG':
        notifierFn = 'info';
        break;
      case 'WARN':
        notifierFn = 'warning';
        break;
      case 'ERROR':
      case 'FATAL':
        notifierFn = 'failure';
        break;
      default:
        notifierFn = 'success';
    }

    // @TODO, re-work in timezoneOffset ?
    const layoutMessage = layout(loggingEvent);

    // dispatch hipchat api request, do not return anything
    // [overide hipchatNotifierResponseCallback]
    notifier[notifierFn](layoutMessage, config.hipchat_response_callback ||
      hipchatNotifierResponseCallback);
  };
}

function hipchatConfigure(config, layouts) {
  let layout = layouts.messagePassThroughLayout;

  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

  return hipchatAppender(config, layout);
}

module.exports.configure = hipchatConfigure;
