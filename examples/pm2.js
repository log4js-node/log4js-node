const log4js = require('../lib/log4js');

// NOTE: for PM2 support to work you'll need to install the pm2-intercom module
// `pm2 install pm2-intercom`
log4js.configure({
  appenders: {
    out: { type: 'file', filename: 'pm2logs.log' }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' }
  },
  pm2: true
});

const logger = log4js.getLogger('app');
setInterval(() => {
  logger.info("I'm forever blowing bubbles");
}, 1000);
