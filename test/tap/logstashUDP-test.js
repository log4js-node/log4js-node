'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');

function setupLogging(category, options) {
  const udpSent = {};
  const socket = { closed: false };

  const fakeDgram = {
    createSocket: function () {
      return {
        send: function (buffer, offset, length, port, host, callback) {
          udpSent.date = new Date();
          udpSent.host = host;
          udpSent.port = port;
          udpSent.length = length;
          udpSent.offset = 0;
          udpSent.buffer = buffer;
          callback(undefined, length);
        },
        close: function (cb) {
          socket.closed = true;
          cb();
        }
      };
    }
  };

  const log4js = sandbox.require('../../lib/log4js', {
    requires: {
      dgram: fakeDgram
    }
  });

  options = options || {};
  options.type = 'logstashUDP';
  log4js.configure({
    appenders: { logstash: options },
    categories: { default: { appenders: ['logstash'], level: 'trace' } }
  });

  return {
    logger: log4js.getLogger(category),
    log4js: log4js,
    results: udpSent,
    socket: socket
  };
}

test('logstashUDP appender', (batch) => {
  batch.test('a UDP packet should be sent', (t) => {
    const setup = setupLogging('myCategory', {
      host: '127.0.0.1',
      port: 10001,
      type: 'logstashUDP',
      logType: 'myAppType',
      category: 'myLogger',
      fields: {
        field1: 'value1',
        field2: 'value2'
      },
      layout: {
        type: 'pattern',
        pattern: '%m'
      }
    });
    setup.logger.log('trace', 'Log event #1');

    t.equal(setup.results.host, '127.0.0.1');
    t.equal(setup.results.port, 10001);
    t.equal(setup.results.offset, 0);

    const json = JSON.parse(setup.results.buffer.toString());
    t.equal(json.type, 'myAppType');
    const fields = {
      field1: 'value1',
      field2: 'value2',
      level: 'TRACE',
      category: 'myCategory'
    };

    const keys = Object.keys(fields);
    for (let i = 0, length = keys.length; i < length; i += 1) {
      t.equal(json[keys[i]], fields[keys[i]]);
    }

    t.equal(JSON.stringify(json.fields), JSON.stringify(fields));
    t.equal(json.message, 'Log event #1');
    // Assert timestamp, up to hours resolution.
    const date = new Date(json['@timestamp']);
    t.equal(
      date.toISOString().substring(0, 14),
      setup.results.date.toISOString().substring(0, 14)
    );

    t.end();
  });

  batch.test('default options', (t) => {
    const setup = setupLogging('myLogger', {
      host: '127.0.0.1',
      port: 10001,
      type: 'logstashUDP',
      category: 'myLogger',
      layout: {
        type: 'pattern',
        pattern: '%m'
      }
    });
    setup.logger.log('trace', 'Log event #1');

    const json = JSON.parse(setup.results.buffer.toString());
    t.equal(json.type, 'myLogger');
    t.equal(
      JSON.stringify(json.fields),
      JSON.stringify({ level: 'TRACE', category: 'myLogger' })
    );

    t.end();
  });

  batch.test('extra fields should be added to the fields structure', (t) => {
    const setup = setupLogging('myLogger', {
      host: '127.0.0.1',
      port: 10001,
      type: 'logstashUDP',
      category: 'myLogger',
      layout: {
        type: 'dummy'
      }
    });
    setup.logger.log('trace', 'Log event #1', { extra1: 'value1', extra2: 'value2' });

    const json = JSON.parse(setup.results.buffer.toString());
    const fields = {
      extra1: 'value1',
      extra2: 'value2',
      level: 'TRACE',
      category: 'myLogger'
    };
    t.equal(JSON.stringify(json.fields), JSON.stringify(fields));
    t.end();
  });

  batch.test('shutdown should close sockets', (t) => {
    const setup = setupLogging('myLogger', {
      host: '127.0.0.1',
      port: 10001,
      type: 'logstashUDP',
      category: 'myLogger',
      layout: {
        type: 'dummy'
      }
    });
    setup.log4js.shutdown(() => {
      t.ok(setup.socket.closed);
      t.end();
    });
  });

  batch.end();
});
