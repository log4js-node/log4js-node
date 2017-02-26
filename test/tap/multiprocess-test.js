'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');
const recording = require('../../lib/appenders/recording');

function makeFakeNet() {
  return {
    data: [],
    cbs: {},
    createConnectionCalled: 0,
    createConnection: function (port, host) {
      const fakeNet = this;
      this.port = port;
      this.host = host;
      this.createConnectionCalled += 1;
      return {
        on: function (evt, cb) {
          fakeNet.cbs[evt] = cb;
        },
        write: function (data, encoding) {
          fakeNet.data.push(data);
          fakeNet.encoding = encoding;
        },
        end: function () {
          fakeNet.closeCalled = true;
        }
      };
    },
    createServer: function (cb) {
      const fakeNet = this;
      cb({
        remoteAddress: '1.2.3.4',
        remotePort: '1234',
        setEncoding: function (encoding) {
          fakeNet.encoding = encoding;
        },
        on: function (event, cb2) {
          fakeNet.cbs[event] = cb2;
        }
      });

      return {
        listen: function (port, host) {
          fakeNet.port = port;
          fakeNet.host = host;
        }
      };
    }
  };
}

test('Multiprocess Appender', (batch) => {
  batch.beforeEach((done) => {
    recording.erase();
    done();
  });

  batch.test('worker', (t) => {
    const fakeNet = makeFakeNet();

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          net: fakeNet
        }
      }
    );
    log4js.configure({
      appenders: { worker: { type: 'multiprocess', mode: 'worker', loggerPort: 1234, loggerHost: 'pants' } },
      categories: { default: { appenders: ['worker'], level: 'trace' } }
    });

    const logger = log4js.getLogger();
    logger.info('before connect');
    fakeNet.cbs.connect();
    logger.info('after connect');
    fakeNet.cbs.close(true);
    logger.info('after error, before connect');
    fakeNet.cbs.connect();
    logger.info('after error, after connect');
    logger.error(new Error('Error test'));

    const net = fakeNet;
    t.test('should open a socket to the loggerPort and loggerHost', (assert) => {
      assert.equal(net.port, 1234);
      assert.equal(net.host, 'pants');
      assert.end();
    });

    t.test('should buffer messages written before socket is connected', (assert) => {
      assert.include(net.data[0], JSON.stringify('before connect'));
      assert.end();
    });

    t.test('should write log messages to socket as json strings with a terminator string', (assert) => {
      assert.include(net.data[0], JSON.stringify('before connect'));
      assert.equal(net.data[1], '__LOG4JS__');
      assert.include(net.data[2], JSON.stringify('after connect'));
      assert.equal(net.data[3], '__LOG4JS__');
      assert.equal(net.encoding, 'utf8');
      assert.end();
    });

    t.test('should attempt to re-open the socket on error', (assert) => {
      assert.include(net.data[4], JSON.stringify('after error, before connect'));
      assert.equal(net.data[5], '__LOG4JS__');
      assert.include(net.data[6], JSON.stringify('after error, after connect'));
      assert.equal(net.data[7], '__LOG4JS__');
      assert.equal(net.createConnectionCalled, 2);
      assert.end();
    });

    t.test('should serialize an Error correctly', (assert) => {
      assert.ok(
        JSON.parse(net.data[8]).data[0].stack,
        `Expected:\n\n${net.data[8]}\n\n to have a 'data[0].stack' property`
      );
      const actual = JSON.parse(net.data[8]).data[0].stack;
      assert.match(actual, /^Error: Error test/);
      assert.end();
    });

    t.end();
  });

  batch.test('worker with timeout', (t) => {
    const fakeNet = makeFakeNet();

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          net: fakeNet
        }
      }
    );
    log4js.configure({
      appenders: { worker: { type: 'multiprocess', mode: 'worker' } },
      categories: { default: { appenders: ['worker'], level: 'trace' } }
    });

    const logger = log4js.getLogger();
    logger.info('before connect');
    fakeNet.cbs.connect();
    logger.info('after connect');
    fakeNet.cbs.timeout();
    logger.info('after timeout, before close');
    fakeNet.cbs.close();
    logger.info('after close, before connect');
    fakeNet.cbs.connect();
    logger.info('after close, after connect');

    const net = fakeNet;

    t.test('should attempt to re-open the socket', (assert) => {
      // skipping the __LOG4JS__ separators
      assert.include(net.data[0], JSON.stringify('before connect'));
      assert.include(net.data[2], JSON.stringify('after connect'));
      assert.include(net.data[4], JSON.stringify('after timeout, before close'));
      assert.include(net.data[6], JSON.stringify('after close, before connect'));
      assert.include(net.data[8], JSON.stringify('after close, after connect'));
      assert.equal(net.createConnectionCalled, 2);
      assert.end();
    });
    t.end();
  });

  batch.test('worker defaults', (t) => {
    const fakeNet = makeFakeNet();

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          net: fakeNet
        }
      }
    );
    log4js.configure({
      appenders: { worker: { type: 'multiprocess', mode: 'worker' } },
      categories: { default: { appenders: ['worker'], level: 'trace' } }
    });

    t.test('should open a socket to localhost:5000', (assert) => {
      assert.equal(fakeNet.port, 5000);
      assert.equal(fakeNet.host, 'localhost');
      assert.end();
    });
    t.end();
  });

  batch.test('master', (t) => {
    const fakeNet = makeFakeNet();

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          net: fakeNet,
          './appenders/recording': recording
        }
      }
    );
    log4js.configure({
      appenders: {
        recorder: { type: 'recording' },
        master: {
          type: 'multiprocess',
          mode: 'master',
          loggerPort: 1234,
          loggerHost: 'server',
          appender: 'recorder'
        }
      },
      categories: { default: { appenders: ['master'], level: 'trace' } }
    });

    const net = fakeNet;

    t.test('should listen for log messages on loggerPort and loggerHost', (assert) => {
      assert.equal(net.port, 1234);
      assert.equal(net.host, 'server');
      assert.end();
    });

    t.test('should return the underlying appender', (assert) => {
      log4js.getLogger().info('this should be sent to the actual appender directly');

      assert.equal(recording.replay()[0].data[0], 'this should be sent to the actual appender directly');
      assert.end();
    });

    t.test('when a client connects', (assert) => {
      const logString = `${JSON.stringify(
        {
          level: { level: 10000, levelStr: 'DEBUG' },
          data: ['some debug']
        }
      )}__LOG4JS__`;

      net.cbs.data(
        `${JSON.stringify(
          {
            level: { level: 40000, levelStr: 'ERROR' },
            data: ['an error message']
          }
        )}__LOG4JS__`
      );
      net.cbs.data(logString.substring(0, 10));
      net.cbs.data(logString.substring(10));
      net.cbs.data(logString + logString + logString);
      net.cbs.end(
        `${JSON.stringify(
          {
            level: { level: 50000, levelStr: 'FATAL' },
            data: ["that's all folks"]
          }
        )}__LOG4JS__`
      );
      net.cbs.data('bad message__LOG4JS__');

      const logEvents = recording.replay();
      // should parse log messages into log events and send to appender
      assert.equal(logEvents[0].level.toString(), 'ERROR');
      assert.equal(logEvents[0].data[0], 'an error message');
      assert.equal(logEvents[0].remoteAddress, '1.2.3.4');
      assert.equal(logEvents[0].remotePort, '1234');

      // should parse log messages split into multiple chunks'
      assert.equal(logEvents[1].level.toString(), 'DEBUG');
      assert.equal(logEvents[1].data[0], 'some debug');
      assert.equal(logEvents[1].remoteAddress, '1.2.3.4');
      assert.equal(logEvents[1].remotePort, '1234');

      // should parse multiple log messages in a single chunk'
      assert.equal(logEvents[2].data[0], 'some debug');
      assert.equal(logEvents[3].data[0], 'some debug');
      assert.equal(logEvents[4].data[0], 'some debug');

      // should handle log messages sent as part of end event'
      assert.equal(logEvents[5].data[0], "that's all folks");

      // should handle unparseable log messages
      assert.equal(logEvents[6].level.toString(), 'ERROR');
      assert.equal(logEvents[6].categoryName, 'log4js');
      assert.equal(logEvents[6].data[0], 'Unable to parse log:');
      assert.equal(logEvents[6].data[1], 'bad message');

      assert.end();
    });
    t.end();
  });

  batch.test('master without actual appender throws error', (t) => {
    const fakeNet = makeFakeNet();

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          net: fakeNet
        }
      }
    );
    t.throws(() =>
      log4js.configure({
        appenders: { master: { type: 'multiprocess', mode: 'master' } },
        categories: { default: { appenders: ['master'], level: 'trace' } }
      }),
      new Error('multiprocess master must have an "appender" defined')
    );
    t.end();
  });

  batch.test('master with unknown appender throws error', (t) => {
    const fakeNet = makeFakeNet();

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          net: fakeNet
        }
      }
    );
    t.throws(() =>
      log4js.configure({
        appenders: { master: { type: 'multiprocess', mode: 'master', appender: 'cheese' } },
        categories: { default: { appenders: ['master'], level: 'trace' } }
      }),
      new Error('multiprocess master appender "cheese" not defined')
    );
    t.end();
  });

  batch.test('master defaults', (t) => {
    const fakeNet = makeFakeNet();

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          net: fakeNet
        }
      }
    );
    log4js.configure({
      appenders: {
        stdout: { type: 'stdout' },
        master: { type: 'multiprocess', mode: 'master', appender: 'stdout' }
      },
      categories: { default: { appenders: ['master'], level: 'trace' } }
    });

    t.test('should listen for log messages on localhost:5000', (assert) => {
      assert.equal(fakeNet.port, 5000);
      assert.equal(fakeNet.host, 'localhost');
      assert.end();
    });
    t.end();
  });

  batch.end();
});
