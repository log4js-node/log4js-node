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
  pm2: true,
  pm2InstanceVar: 'INSTANCE_ID'
});
const logger = log4js.getLogger('app');
logger.info("I'm forever blowing bubbles ", process.env.INSTANCE_ID);
logger.info("I'm forever blowing bubbles ", process.env.INSTANCE_ID);
logger.info("I'm forever blowing bubbles ", process.env.INSTANCE_ID);
logger.info("I'm forever blowing bubbles ", process.env.INSTANCE_ID);
logger.info('last bubbles', process.env.INSTANCE_ID);
// give pm2 time to set everything up, before we tear it down
setTimeout(() => {
  log4js.shutdown(() => {
    console.error('All done, shutdown cb returned.');
  });
}, 5000);
