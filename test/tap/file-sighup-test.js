'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');

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
  }, 10);
});
