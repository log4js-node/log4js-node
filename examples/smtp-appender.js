// Note that smtp appender needs nodemailer to work.
// If you haven't got nodemailer installed, you'll get cryptic
// "cannot find module" errors when using the smtp appender
const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    out: {
      type: 'console'
    },
    mail: {
      type: 'smtp',
      recipients: 'logfilerecipient@logging.com',
      sendInterval: 5,
      transport: 'SMTP',
      SMTP: {
        host: 'smtp.gmail.com',
        secureConnection: true,
        port: 465,
        auth: {
          user: 'someone@gmail',
          pass: '********************'
        },
        debug: true
      }
    }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' },
    mailer: { appenders: ['mail'], level: 'info' }
  }
});
const log = log4js.getLogger('test');
const logmailer = log4js.getLogger('mailer');

function doTheLogging(x) {
  log.info('Logging something %d', x);
  logmailer.info('Logging something %d', x);
}

for (let i = 0; i < 500; i += 1) {
  doTheLogging(i);
}
