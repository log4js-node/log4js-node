const test = require('tap').test;
const net = require('net');
const log4js = require('../../lib/log4js');

const messages = [];
const server = net.createServer((socket) => {
  socket.setEncoding('utf8');
  socket.on('data', (data) => {
    messages.push(JSON.parse(data));
  });
});

server.unref();

server.listen(() => {
  const port = server.address().port;
  log4js.configure({
    appenders: {
      tcp: { type: 'tcp', port: port }
    },
    categories: {
      default: { appenders: ['tcp'], level: 'debug' }
    }
  });

  const logger = log4js.getLogger();
  logger.info('This should be sent via TCP.');
  log4js.shutdown(() => {
    server.close(() => {
      test('TCP Appender', (batch) => {
        batch.test('should send log messages as JSON over TCP', (t) => {
          t.equal(messages.length, 1);
          t.match(messages[0], {
            data: ['This should be sent via TCP.'],
            categoryName: 'default',
            context: {},
            level: { levelStr: 'INFO' }
          });
          t.end();
        });
        batch.end();
      });
    });
  });
});
