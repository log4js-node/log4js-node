//Note that redis appender needs install redis to work.

var log4js = require('../lib/log4js');

log4js.configure({
  "appenders": [
    {
        type: 'console',
        category: 'console'
    }, {
        type: 'dateFile',
        filename: 'logs/log.txt',
        pattern: 'yyyyMMdd',
        alwaysIncludePattern: false,
        category: 'dateFile'
    }, {
        type: 'redis',
        host: '127.0.0.1',
        port: 6379,
        pass: '',
        channel: 'q_log',
        category: 'redis',
        layout: {
            type: 'pattern',
            pattern: '%d{yyyy-MM-dd hh:mm:ss:SSS}#%p#%m'
        }
    }
  ]
});
log = log4js.getLogger("console");
logRedis = log4js.getLogger("redis");

function doTheLogging(x) {
    log.info("Logging something %d", x);
    logRedis.info("Logging something %d", x);
}

for ( ; i < 500; i++) {
    doTheLogging(i);
}
