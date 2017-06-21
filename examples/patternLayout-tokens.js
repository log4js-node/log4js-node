const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    out: {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '%[%r (%x{pid}) %p %c -%] %m%n',
        tokens: {
          pid: function () { return process.pid; }
        }
      }
    }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' }
  }
});

const logger = log4js.getLogger('app');
logger.info('Test log message');
