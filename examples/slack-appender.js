// Note that slack appender needs slack-node package to work.
const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    slack: {
      type: 'slack',
      token: 'TOKEN',
      channel_id: '#CHANNEL',
      username: 'USERNAME',
      format: 'text',
      icon_url: 'ICON_URL'
    }
  },
  categories: {
    default: { appenders: ['slack'], level: 'info' }
  }
});

const logger = log4js.getLogger('slack');
logger.warn('Test Warn message');
logger.info('Test Info message');
logger.debug('Test Debug Message');
logger.trace('Test Trace Message');
logger.fatal('Test Fatal Message');
logger.error('Test Error Message');
