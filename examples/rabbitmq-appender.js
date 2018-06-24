// Note that rabbitmq appender needs install amqplib to work.

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
    mq: {
      type: '@log4js-node/rabbitmq',
      host: '127.0.0.1',
      port: 5672,
      username: 'guest',
      password: 'guest',
      routing_key: 'logstash',
      exchange: 'exchange_logs',
      mq_type: 'direct',
      durable: true,
      layout: {
        type: 'pattern',
        pattern: '%d{yyyy-MM-dd hh:mm:ss:SSS}#%p#%m'
      }
    }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' },
    dateFile: { appenders: ['file'], level: 'info' },
    rabbitmq: { appenders: ['mq'], level: 'info' }
  }
});

const log = log4js.getLogger('console');
const logRabbitmq = log4js.getLogger('rabbitmq');

function doTheLogging(x) {
  log.info('Logging something %d', x);
  logRabbitmq.info('Logging something %d', x);
}

for (let i = 0; i < 500; i += 1) {
  doTheLogging(i);
}
