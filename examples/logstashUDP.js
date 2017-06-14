const log4js = require('../lib/log4js');

/*
 Sample logstash config:
   udp {
    codec => json
    port => 10001
    queue_size => 2
    workers => 2
    type => myAppType
  }
*/

log4js.configure({
  appenders: {
    console: {
      type: 'console'
    },
    logstash: {
      host: '127.0.0.1',
      port: 10001,
      type: 'logstashUDP',
      logType: 'myAppType', // Optional, defaults to 'category'
      fields: {             // Optional, will be added to the 'fields' object in logstash
        field1: 'value1',
        field2: 'value2'
      },
      layout: {
        type: 'pattern',
        pattern: '%m'
      }
    }
  },
  categories: {
    default: { appenders: ['console', 'logstash'], level: 'info' }
  }
});

const logger = log4js.getLogger('myLogger');
logger.info('Test log message %s', 'arg1', 'arg2');
