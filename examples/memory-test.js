const log4js = require('../lib/log4js');

log4js.configure(
  {
    appenders: {
      logs: {
        type: 'file',
        filename: 'memory-test.log'
      },
      console: {
        type: 'stdout',
      },
      file: {
        type: 'file',
        filename: 'memory-usage.log',
        layout: {
          type: 'messagePassThrough'
        }
      }
    },
    categories: {
      default: { appenders: ['console'], level: 'info' },
      'memory-test': { appenders: ['logs'], level: 'info' },
      'memory-usage': { appenders: ['console', 'file'], level: 'info' }
    }
  }
);
const logger = log4js.getLogger('memory-test');
const usage = log4js.getLogger('memory-usage');

for (let i = 0; i < 1000000; i += 1) {
  if ((i % 5000) === 0) {
    usage.info('%d %d', i, process.memoryUsage().rss);
  }
  logger.info('Doing something.');
}
log4js.shutdown(() => {});
