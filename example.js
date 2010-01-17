var log4js = require('./lib/log4js-node');
log4js.addAppender(log4js.consoleAppender());
log4js.addAppender(log4js.fileAppender('cheese.log'), 'cheese');
  
var logger = log4js.getLogger('cheese');
logger.setLevel('ERROR');

logger.trace('Entering cheese testing');
logger.debug('Got cheese.');
logger.info('Cheese is Gouda.');  
logger.warn('Cheese is quite smelly.');
logger.error('Cheese is too ripe!');
logger.fatal('Cheese was breeding ground for listeria.');
