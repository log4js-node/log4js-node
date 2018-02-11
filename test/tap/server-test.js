const test = require('tap').test;
const net = require('net');
const log4js = require('../../lib/log4js');
const vcr = require('../../lib/appenders/recording');
const levels = require('../../lib/levels');
const LoggingEvent = require('../../lib/LoggingEvent');

log4js.configure({
  appenders: {
    vcr: { type: 'recording' },
    tcp: { type: 'tcp-server', port: 5678 }
  },
  categories: {
    default: { appenders: ['vcr'], level: 'debug' }
  }
});

test('TCP Server', (batch) => {
  batch.test('should listen for TCP messages and re-send via process.send', (t) => {
    // give the socket a chance to start up
    setTimeout(() => {
      const socket = net.connect(5678, () => {
        socket.write(
          (new LoggingEvent('test-category', levels.INFO, ['something'], {})).serialise(),
          () => {
            socket.end();
            setTimeout(() => {
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
            }, 100);
          }
        );
      });
      socket.unref();
    }, 100);
  });
  batch.end();
});
