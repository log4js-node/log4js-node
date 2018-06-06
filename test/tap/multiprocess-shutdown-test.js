'use strict';

const test = require('tap').test;
const log4js = require('../../lib/log4js');
const net = require('net');
const childProcess = require('child_process');
const sandbox = require('@log4js-node/sandboxed-module');

test('multiprocess appender shutdown (master)', { timeout: 2000 }, (t) => {
  log4js.configure({
    appenders: {
      stdout: { type: 'stdout' },
      multi: {
        type: 'multiprocess',
        mode: 'master',
        loggerPort: 12345,
        appender: 'stdout'
      }
    },
    categories: { default: { appenders: ['multi'], level: 'debug' } }
  });

  setTimeout(() => {
    log4js.shutdown(() => {
      setTimeout(() => {
        net.connect({ port: 12345 }, () => {
          t.fail('connection should not still work');
          t.end();
        }).on('error', (err) => {
          t.ok(err, 'we got a connection error');
          t.end();
        });
      }, 250);
    });
  }, 250);
});

test('multiprocess appender shutdown (worker)', (t) => {
  const fakeConnection = {
    evts: {},
    msgs: [],
    on: function (evt, cb) {
      this.evts[evt] = cb;
    },
    write: function (data) {
      this.msgs.push(data);
    },
    removeAllListeners: function () {
      this.removeAllListenersCalled = true;
    },
    end: function (cb) {
      this.endCb = cb;
    }
  };
  const logLib = sandbox.require('../../lib/log4js', {
    requires: {
      net: {
        createConnection: function () {
          return fakeConnection;
        }
      }
    }
  });
  logLib.configure({
    appenders: { worker: { type: 'multiprocess', mode: 'worker' } },
    categories: { default: { appenders: ['worker'], level: 'debug' } }
  });

  logLib.getLogger().info('Putting something in the buffer before the connection is established');
  // nothing been written yet.
  t.equal(fakeConnection.msgs.length, 0);

  let shutdownFinished = false;
  logLib.shutdown(() => {
    shutdownFinished = true;
  });

  // still nothing been written yet.
  t.equal(fakeConnection.msgs.length, 0);

  fakeConnection.evts.connect();

  setTimeout(() => {
    t.equal(fakeConnection.msgs.length, 2);
    t.ok(fakeConnection.removeAllListenersCalled);
    fakeConnection.endCb();

    t.ok(shutdownFinished);
    t.end();
  }, 500);
});

test('multiprocess appender crash (worker)', (t) => {
  const loggerPort = 12346;
  const messages = [];
  const fakeConsole = {
    log: function (msg) {
      messages.push(msg);
    }
  };
  const log4jsWithFakeConsole = sandbox.require(
    '../../lib/log4js',
    {
      globals: {
        console: fakeConsole
      }
    }
  );
  log4jsWithFakeConsole.configure({
    appenders: {
      console: { type: 'console', layout: { type: 'messagePassThrough' } },
      multi: {
        type: 'multiprocess',
        mode: 'master',
        loggerPort: loggerPort,
        appender: 'console'
      }
    },
    categories: { default: { appenders: ['multi'], level: 'debug' } }
  });

  const worker = childProcess.fork(
    require.resolve('./multiprocess-worker'),
    ['start-multiprocess-worker', loggerPort]
  );

  worker.on('message', (m) => {
    if (m === 'worker is done') {
      setTimeout(() => {
        worker.kill();
        t.equal(messages[0], 'Logging from worker');
        log4jsWithFakeConsole.shutdown(() => t.end());
      }, 100);
    }
  });
});
