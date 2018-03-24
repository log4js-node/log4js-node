const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    out: { type: 'stdout', layout: { type: 'messagePassThrough' } }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' }
  }
});

const logger = log4js.getLogger('thing');
logger.info('This should not have a timestamp');
