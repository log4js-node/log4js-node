const { test } = require('tap');
const net = require('net');
const log4js = require('../../lib/log4js');
const vcr = require('../../lib/appenders/recording');
const levels = require('../../lib/levels');
const LoggingEvent = require('../../lib/LoggingEvent');

test('TCP Server', (batch) => {
  batch.test(
    'should listen for TCP messages and re-send via process.send',
    (t) => {
      log4js.configure({
        appenders: {
          vcr: { type: 'recording' },
          tcp: { type: 'tcp-server', port: 5678 },
        },
        categories: {
          default: { appenders: ['vcr'], level: 'debug' },
        },
      });
      // give the socket a chance to start up
      setTimeout(() => {
        const socket = net.connect(5678, () => {
          socket.write(
            `${new LoggingEvent(
              'test-category',
              levels.INFO,
              ['something'],
              {}
            ).serialise()}__LOG4JS__${new LoggingEvent(
              'test-category',
              levels.INFO,
              ['something else'],
              {}
            ).serialise()}__LOG4JS__some nonsense__LOG4JS__{"some":"json"}__LOG4JS__`,
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
                    context: {},
                  });
                  t.match(logs[1], {
                    data: ['something else'],
                    categoryName: 'test-category',
                    level: { levelStr: 'INFO' },
                    context: {},
                  });
                  t.match(logs[2], {
                    data: [
                      'Unable to parse log:',
                      'some nonsense',
                      'because: ',
                      SyntaxError,
                    ],
                    categoryName: 'log4js',
                    level: { levelStr: 'ERROR' },
                    context: {},
                  });
                  t.match(logs[3], {
                    data: [
                      'Unable to parse log:',
                      '{"some":"json"}',
                      'because: ',
                      TypeError,
                    ],
                    categoryName: 'log4js',
                    level: { levelStr: 'ERROR' },
                    context: {},
                  });
                  t.end();
                });
              }, 100);
            }
          );
        });

        socket.unref();
      }, 100);
    }
  );

  batch.test('sending incomplete messages in chunks', (t) => {
    log4js.configure({
      appenders: {
        vcr: { type: 'recording' },
        tcp: { type: 'tcp-server' },
      },
      categories: {
        default: { appenders: ['vcr'], level: 'debug' },
      },
    });
    // give the socket a chance to start up
    setTimeout(() => {
      const socket = net.connect(5000, () => {
        const syncWrite = (dataArray, finalCallback) => {
          if (!Array.isArray(dataArray)) {
            dataArray = [dataArray];
          }
          if (typeof finalCallback !== 'function') {
            finalCallback = () => {};
          }
          setTimeout(() => {
            if (!dataArray.length) {
              finalCallback();
            } else if (dataArray.length === 1) {
              socket.write(dataArray.shift(), finalCallback);
            } else {
              socket.write(dataArray.shift(), () => {
                syncWrite(dataArray, finalCallback);
              });
            }
          }, 100);
        };

        const dataArray = [
          '__LOG4JS__',
          'Hello__LOG4JS__World',
          '__LOG4JS__',
          'testing nonsense',
          `__LOG4JS__more nonsense__LOG4JS__`,
        ];

        const finalCallback = () => {
          socket.end();
          setTimeout(() => {
            log4js.shutdown(() => {
              const logs = vcr.replay();
              t.equal(logs.length, 8);
              t.match(logs[4], {
                data: [
                  'Unable to parse log:',
                  'Hello',
                  'because: ',
                  SyntaxError,
                ],
                categoryName: 'log4js',
                level: { levelStr: 'ERROR' },
                context: {},
              });
              t.match(logs[5], {
                data: [
                  'Unable to parse log:',
                  'World',
                  'because: ',
                  SyntaxError,
                ],
                categoryName: 'log4js',
                level: { levelStr: 'ERROR' },
                context: {},
              });
              t.match(logs[6], {
                data: [
                  'Unable to parse log:',
                  'testing nonsense',
                  'because: ',
                  SyntaxError,
                ],
                categoryName: 'log4js',
                level: { levelStr: 'ERROR' },
                context: {},
              });
              t.match(logs[7], {
                data: [
                  'Unable to parse log:',
                  'more nonsense',
                  'because: ',
                  SyntaxError,
                ],
                categoryName: 'log4js',
                level: { levelStr: 'ERROR' },
                context: {},
              });
              t.end();
            });
          }, 100);
        };

        syncWrite(dataArray, finalCallback);
      });

      socket.unref();
    }, 100);
  });

  batch.end();
});
