/**
 * !!! The hipchat-appender requires `hipchat-notifier` from npm, e.g.
 *   - list as a dependency in your application's package.json ||
 *   - npm install hipchat-notifier
 */

const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    hipchat: {
      type: 'hipchat',
      hipchat_token: process.env.HIPCHAT_TOKEN || '< User token with Notification Privileges >',
      hipchat_room: process.env.HIPCHAT_ROOM || '< Room ID or Name >'
    }
  },
  categories: {
    default: { appenders: ['hipchat'], level: 'trace' }
  }
});

const logger = log4js.getLogger('hipchat');
logger.warn('Test Warn message');
logger.info('Test Info message');
logger.debug('Test Debug Message');
logger.trace('Test Trace Message');
logger.fatal('Test Fatal Message');
logger.error('Test Error Message');


// alternative configuration demonstrating callback + custom layout
// /////////////////////////////////////////////////////////////////

// use a custom layout function (in this case, the provided basicLayout)
//   format: [TIMESTAMP][LEVEL][category] - [message]
log4js.configure({
  appenders: {
    hipchat: {
      type: 'hipchat',
      hipchat_token: process.env.HIPCHAT_TOKEN || '< User token with Notification Privileges >',
      hipchat_room: process.env.HIPCHAT_ROOM || '< Room ID or Name >',
      hipchat_from: 'Mr. Semantics',
      hipchat_notify: false,
      hipchat_response_callback: function (err, response, body) {
        if (err || response.statusCode > 300) {
          throw new Error('hipchat-notifier failed');
        }
        console.log('mr semantics callback success');
      },
      layout: { type: 'basic' }
    }
  },
  categories: { default: { appenders: ['hipchat'], level: 'trace' } }
});

logger.info('Test customLayout from Mr. Semantics');
