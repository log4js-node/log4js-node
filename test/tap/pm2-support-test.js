'use strict';

const test = require('tap').test;
const cluster = require('cluster');

// PM2 runs everything as workers
// - no master in the cluster (PM2 acts as master itself)
// - we will simulate that here (avoid having to include PM2 as a dev dep)
if (cluster.isMaster) {
  // create two worker forks
  // PASS IN NODE_APP_INSTANCE HERE
  const appEvents = {};
  ['0', '1'].forEach((i) => {
    cluster.fork({ NODE_APP_INSTANCE: i });
  });

  cluster.on('message', (worker, msg) => {
    if (worker.type || worker.topic) {
      msg = worker;
    }
    if (msg.type === 'testing') {
      appEvents[msg.instance] = msg.events;
    }

    // we have to do the re-broadcasting that the pm2-intercom module would do.
    if (msg.topic === 'log4js:message') {
      for (const id in cluster.workers) {
        cluster.workers[id].send(msg);
      }
    }
  });

  let count = 0;
  cluster.on('exit', () => {
    count += 1;
    if (count === 2) {
      test('PM2 Support', (batch) => {
        batch.test('should not get any events when turned off', (t) => {
          t.notOk(appEvents['0'].filter(e => e && e.data[0].indexOf('will not be logged') > -1).length);
          t.notOk(appEvents['1'].filter(e => e && e.data[0].indexOf('will not be logged') > -1).length);
          t.end();
        });

        batch.test('should get events on app instance 0', (t) => {
          t.equal(appEvents['0'].length, 2);
          t.equal(appEvents['0'][0].data[0], 'this should now get logged');
          t.equal(appEvents['0'][1].data[0], 'this should now get logged');
          t.end();
        });

        batch.test('should not get events on app instance 1', (t) => {
          t.equal(appEvents['1'].length, 0);
          t.end();
        });
        batch.end();
      });
    }
  });
} else {
  const recorder = require('../../lib/appenders/recording');
  const log4js = require('../../lib/log4js');
  log4js.configure({
    appenders: { out: { type: 'recording' } },
    categories: { default: { appenders: ['out'], level: 'info' } }
  });

  const logger = log4js.getLogger('test');
  logger.info('this is a test, but without enabling PM2 support it will not be logged');

  // we have to wait a bit, so that the process.send messages get a chance to propagate
  setTimeout(() => {
    log4js.configure({
      appenders: { out: { type: 'recording' } },
      categories: { default: { appenders: ['out'], level: 'info' } },
      pm2: true
    });
    const anotherLogger = log4js.getLogger('test');
    anotherLogger.info('this should now get logged');
  }, 500);

  // we have to wait a bit, so that the process.send messages get a chance to propagate
  setTimeout(() => {
    const events = recorder.replay();
    process.send({ type: 'testing', instance: process.env.NODE_APP_INSTANCE, events: events });
    cluster.worker.disconnect();
  }, 1000);
}
