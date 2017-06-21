// Note that redis appender needs install redis to work.

const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    out: {
      type: 'console'
    },
    file: {
      type: 'dateFile',
      filename: 'logs/log.txt',
      pattern: 'yyyyMMdd',
      alwaysIncludePattern: false
    },
    db: {
      type: 'redis',
      host: '127.0.0.1',
      port: 6379,
      pass: '',
      channel: 'q_log',
      layout: {
        type: 'pattern',
        pattern: '%d{yyyy-MM-dd hh:mm:ss:SSS}#%p#%m'
      }
    }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' },
    dateFile: { appenders: ['file'], level: 'info' },
    redis: { appenders: ['db'], level: 'info' }
  }
});

const log = log4js.getLogger('console');
const logRedis = log4js.getLogger('redis');

function doTheLogging(x) {
  log.info('Logging something %d', x);
  logRedis.info('Logging something %d', x);
}

for (let i = 0; i < 500; i += 1) {
  doTheLogging(i);
}
