const test = require('tap').test;
const sandbox = require('@log4js-node/sandboxed-module');

// passenger provides a non-functional cluster module,
// but it does not implement the event emitter functions
const passengerCluster = {
  disconnect: function () { return false; },
  fork: function () { return false; },
  setupMaster: function () { return false; },
  isWorker: true,
  isMaster: false,
  schedulingPolicy: false,
  settings: false,
  worker: false,
  workers: false,
};

const vcr = require('../../lib/appenders/recording');

const log4js = sandbox.require(
  '../../lib/log4js',
  {
    requires: {
      cluster: passengerCluster,
      './appenders/recording': vcr
    }
  }
);

test('When running in Passenger', (batch) => {
  batch.test('it should still log', (t) => {
    log4js.configure({
      appenders: {
        vcr: { type: 'recording' }
      },
      categories: {
        default: { appenders: ['vcr'], level: 'info' }
      },
      disableClustering: true
    });
    log4js.getLogger().info('This should still work');

    const events = vcr.replay();
    t.equal(events.length, 1);
    t.equal(events[0].data[0], 'This should still work');
    t.end();
  });

  batch.end();
});
