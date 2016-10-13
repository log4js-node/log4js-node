"use strict";
//remember to change the require to just 'log4js' if you've npm install'ed it
var log4js = require('../lib/log4js');

var logger = log4js.getLogger('cheese');

logger.trace('Entering cheese testing');
logger.debug('Got cheese.');
logger.info('Cheese is Gouda.');
logger.warn('Cheese is quite smelly.');
logger.error('Cheese is too ripe!');
logger.fatal('Cheese was breeding ground for listeria.');
