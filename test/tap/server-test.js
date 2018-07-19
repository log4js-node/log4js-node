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

// give the socket a chance to start up
test('TCP Server', (batch) => {
  batch.test('should listen for TCP messages and re-send via process.send', (t) => {
    setTimeout(() => {
      const socket = net.connect(5678, () => {
        socket.write(
          `${(new LoggingEvent('test-category', levels.INFO, ['something'], {})).serialise()
          }__LOG4JS__${
            (new LoggingEvent('test-category', levels.INFO, ['something else'], {})).serialise()
          }__LOG4JS__some nonsense__LOG4JS__{"some":"json"}__LOG4JS__`,
          () => {
            socket.end();
            setTimeout(() => {
              log4js.shutdown(() => {
                const logs = vcr.replay();
                t.equal(logs.length, 4);
                t.match(logs[0], {
                  data: ['something'],
                  categoryName: 'test-category',
                  level: { levelStr: 'INFO' },
                  context: {}
                });
                t.match(logs[1], {
                  data: ['something else'],
                  categoryName: 'test-category',
                  level: { levelStr: 'INFO' },
                  context: {}
                });
                t.match(logs[2], {
                  data: ['Unable to parse log:', 'some nonsense', 'because: ', SyntaxError],
                  categoryName: 'log4js',
                  level: { levelStr: 'ERROR' },
                  context: {}
                });
                t.match(logs[3], {
                  data: ['Unable to parse log:', '{"some":"json"}', 'because: ', TypeError],
                  categoryName: 'log4js',
                  level: { levelStr: 'ERROR' },
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

    batch.end();
  });
});
