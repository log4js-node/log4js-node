'use strict';

const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    file: { type: 'dateFile', filename: 'thing.log', pattern: '.mm' }
  },
  categories: {
    default: { appenders: ['file'], level: 'debug' }
  }
});

const logger = log4js.getLogger('thing');

setInterval(() => {
  logger.info('just doing the thing');
}, 1000);
