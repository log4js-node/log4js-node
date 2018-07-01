const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    console: {
      type: 'console'
    },
    logstash: {
      url: 'http://172.17.0.5:9200/_bulk',
      type: '@log4js-node/logstash-http',
      logType: 'application',
      logChannel: 'node',
      application: 'logstash-log4js',
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
