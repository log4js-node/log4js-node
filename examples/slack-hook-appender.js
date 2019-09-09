// Note that slack appender needs slack-node package to work.
const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    slackHook: {
      type: 'slackHook',
      ErrorNot200: false,
      url: 'https://hooks.slack.com/services/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'
    }
  },
  categories: {
    default: { appenders: ['slackHook'], level: 'info' }
  }
});

const logger = log4js.getLogger('slack');
logger.warn('Test Warn message');
logger.info('Test Info message');
logger.debug('Test Debug Message');
logger.trace('Test Trace Message');
logger.fatal('Test Fatal Message');
logger.error('Test Error Message');
