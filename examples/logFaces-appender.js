const log4js = require('../lib/log4js');

/*
   logFaces server configured with UDP receiver, using JSON format,
   listening on port 55201 will receive the logs from the appender below.
*/

log4js.configure({
  appenders: {
    logFaces: {
      type: 'logFaces-UDP',       // (mandatory) appender type
      application: 'MY-NODEJS',       // (optional) name of the application (domain)
      remoteHost: 'localhost',        // (optional) logFaces server host or IP address
      port: 55201,                    // (optional) logFaces UDP receiver port (must use JSON format)
      layout: {                       // (optional) the layout to use for messages
        type: 'pattern',
        pattern: '%m'
      }
    }
  },
  categories: { default: { appenders: ['logFaces'], level: 'info' } }
});

const logger = log4js.getLogger('myLogger');
logger.info('Testing message %s', 'arg1');
