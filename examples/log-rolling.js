const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    console: {
      type: 'console'
    },
    file: {
      type: 'file',
      filename: 'tmp-test.log',
      maxLogSize: 1024,
      backups: 3
    }
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'info' }
  }
});
const log = log4js.getLogger('test');

function doTheLogging(x) {
  log.info('Logging something %d', x);
}
let i = 0;
for (; i < 5000; i += 1) {
  doTheLogging(i);
}
