import * as log4js from './log4js';

log4js.configure('./filename');
const logger1 = log4js.getLogger();
logger1.level = 'debug';
logger1.debug("Some debug messages");

const logger3 = log4js.getLogger('cheese');
logger3.trace('Entering cheese testing');
logger3.debug('Got cheese.');
logger3.info('Cheese is Gouda.');
logger3.warn('Cheese is quite smelly.');
logger3.error('Cheese is too ripe!');
logger3.fatal('Cheese was breeding ground for listeria.');

log4js.configure({
	appenders: { cheese: { type: 'console', filename: 'cheese.log' } },
	categories: { default: { appenders: ['cheese'], level: 'error' } }
});

import { configure, getLogger } from './log4js';
configure('./filename');
const logger2 = getLogger();
logger2.level = 'debug';
logger2.debug("Some debug messages");

configure({
	appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
	categories: { default: { appenders: ['cheese'], level: 'error' } }
});
