if (process.argv.indexOf('start-multiprocess-worker') >= 0) {
  const log4js = require('../../lib/log4js');
  const port = parseInt(process.argv[process.argv.length - 1], 10);
  log4js.configure({
    appenders: {
      multi: { type: 'multiprocess', mode: 'worker', loggerPort: port }
    },
    categories: { default: { appenders: ['multi'], level: 'debug' } }
  });
  log4js.getLogger('worker').info('Logging from worker');
  process.send('worker is done');
}
