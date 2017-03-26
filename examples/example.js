'use strict';

const log4js = require('../lib/log4js');
// log the cheese logger messages to a file, and the console ones as well.
log4js.configure({
  appenders: {
    cheeseLogs: { type: 'file', filename: 'cheese.log' },
    console: { type: 'console' }
  },
  categories: {
    cheese: { appenders: ['cheeseLogs'], level: 'error' },
    another: { appenders: ['console'], level: 'trace' },
    default: { appenders: ['console', 'cheeseLogs'], level: 'trace' }
  }
});

// a custom logger outside of the log4js/lib/appenders directory can be accessed like so
// log4js.configure({
//  appenders: { outside: { type: 'what/you/would/put/in/require', otherArgs: 'blah' } }
//  ...
// });

const logger = log4js.getLogger('cheese');
// only errors and above get logged.
const otherLogger = log4js.getLogger();

// this will get coloured output on console, and appear in cheese.log
otherLogger.error('AAArgh! Something went wrong', { some: 'otherObject', useful_for: 'debug purposes' });
otherLogger.log('This should appear as info output');

// these will not appear (logging level beneath error)
logger.trace('Entering cheese testing');
logger.debug('Got cheese.');
logger.info('Cheese is Gouda.');
logger.log('Something funny about cheese.');
logger.warn('Cheese is quite smelly.');
// these end up only in cheese.log
logger.error('Cheese %s is too ripe!', 'gouda');
logger.fatal('Cheese was breeding ground for listeria.');

// these don't end up in cheese.log, but will appear on the console
const anotherLogger = log4js.getLogger('another');
anotherLogger.debug('Just checking');

// will also go to console and cheese.log, since that's configured for all categories
const pantsLog = log4js.getLogger('pants');
pantsLog.debug('Something for pants');
