const test = require('tap').test;
const net = require('net');
const log4js = require('../../lib/log4js');
const vcr = require('../../lib/appenders/recording');
const levels = require('../../lib/levels');
const LoggingEvent = require('../../lib/LoggingEvent');

log4js.configure({
  appenders: {
    vcr: { type: 'recording' }
  },
  categories: {
    default: { appenders: ['vcr'], level: 'debug' }
  },
  listen: {
    port: 5678
  }
});

test('TCP Server', (batch) => {
  batch.test('should listen for TCP messages and re-send via process.send', (t) => {
    const socket = net.connect(5678, () => {
      socket.write(
        (new LoggingEvent('test-category', levels.INFO, ['something'], {})).serialise(),
        () => {
          socket.end();
          log4js.shutdown(() => {
            const logs = vcr.replay();
            t.equal(logs.length, 1);
            t.match(logs[0], {
              data: ['something'],
              categoryName: 'test-category',
              level: { levelStr: 'INFO' },
              context: {}
            });
            t.end();
          });
        }
      );
    });
    socket.unref();
  });
  batch.end();
});
