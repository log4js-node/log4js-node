const log4js = require('../lib/log4js');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

let i = 0;

if (cluster.isMaster) {
  log4js.configure({
    appenders: {
      console: { type: 'console' },
      master: {
        type: 'multiprocess',
        mode: 'master',
        appender: 'console'
      }
    },
    categories: {
      default: { appenders: ['console'], level: 'info' }
    }
  });

  console.info('Master creating %d workers', numCPUs);
  for (i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('death', (worker) => {
    console.info('Worker %d died.', worker.pid);
  });
} else {
  log4js.configure({
    appenders: {
      worker: { type: 'multiprocess', mode: 'worker' }
    },
    categories: {
      default: { appenders: ['worker'], level: 'info' }
    }
  });
  const logger = log4js.getLogger('example-socket');

  console.info('Worker %d started.', process.pid);
  for (i = 0; i < 1000; i++) {
    logger.info('Worker %d - logging something %d', process.pid, i);
  }
  log4js.shutdown(() => {
    process.exit();
  });
}
