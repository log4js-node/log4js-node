'use strict';

const cluster = require('cluster');
const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    out: { type: 'stdout' }
  },
  categories: { default: { appenders: ['out'], level: 'debug' } }
});

let logger;
if (cluster.isMaster) {
  logger = log4js.getLogger('master');
  cluster.fork();
  logger.info('master is done', process.pid, new Error('flaps'));
} else {
  logger = log4js.getLogger('worker');
  logger.info("I'm a worker, with pid ", process.pid, new Error('pants'));
  logger.info("I'm a worker, with pid ", process.pid, new Error());
  logger.info('cluster.worker ', cluster.worker);
  cluster.worker.disconnect();
}
