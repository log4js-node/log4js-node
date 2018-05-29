'use strict';

const test = require('tap').test;
const sandbox = require('@log4js-node/sandboxed-module');

test('file appender SIGHUP', (t) => {
  let closeCalled = 0;
  let openCalled = 0;

  sandbox.require(
    '../../lib/appenders/file',
    {
      requires: {
        streamroller: {
          RollingFileStream: function () {
            this.openTheStream = function () {
              openCalled++;
            };

            this.closeTheStream = function (cb) {
              closeCalled++;
              if (cb) {
                cb();
              }
            };

            this.on = function () {
            };

            this.end = function () {
            };

            this.write = function () {
              return true;
            };
          }
        }
      }
    }
  ).configure({ type: 'file', filename: 'sighup-test-file' }, { basicLayout: function () {} });

  process.kill(process.pid, 'SIGHUP');
  t.plan(2);
  setTimeout(() => {
    t.equal(openCalled, 1, 'open should be called once');
    t.equal(closeCalled, 1, 'close should be called once');
    t.end();
  }, 100);
});

test('file appender SIGHUP handler leak', (t) => {
  const log4js = require('../../lib/log4js');
  const initialListeners = process.listenerCount('SIGHUP');
  log4js.configure({
    appenders: {
      file: { type: 'file', filename: 'test.log' }
    },
    categories: { default: { appenders: ['file'], level: 'info' } }
  });
  log4js.shutdown(() => {
    t.equal(process.listenerCount('SIGHUP'), initialListeners);
    t.end();
  });
});
