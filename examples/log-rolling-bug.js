const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    handler: {
      type: 'file',
      filename: 'logs/handler.log',
      maxLogSize: 100000,
      backups: 5,
      keepFileExt: true,
      compress: true
    }
  },
  categories: {
    default: { appenders: ['handler'], level: 'debug' },
    handler: { appenders: ['handler'], level: 'debug' },
  }
});

const logsToTest = [
  'handler'
];

const logStartDate = new Date();

const loggers = logsToTest.map(log => log4js.getLogger(log));

// write out a lot
setInterval(() => {
  loggers.forEach(logger => logger.info(`TESTING LOGGER!!!!!!${logStartDate}`));
}, 10);
