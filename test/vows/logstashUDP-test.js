'use strict';

const vows = require('vows');
const assert = require('assert');
const log4js = require('../../lib/log4js');
const sandbox = require('sandboxed-module');

function setupLogging(category, options) {
  const udpSent = {};

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
        }
      };
    }
  };

  const logstashModule = sandbox.require('../../lib/appenders/logstashUDP', {
    singleOnly: true,
    requires: {
      dgram: fakeDgram
    }
  });
  log4js.clearAppenders();
  log4js.addAppender(logstashModule.configure(options), category);

  return {
    logger: log4js.getLogger(category),
    results: udpSent
  };
}

vows.describe('logstashUDP appender').addBatch({
  'when logging with logstash via UDP': {
    topic: function () {
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
      return setup;
    },
    'an UDP packet should be sent': function (topic) {
      assert.equal(topic.results.host, '127.0.0.1');
      assert.equal(topic.results.port, 10001);
      assert.equal(topic.results.offset, 0);
      const json = JSON.parse(topic.results.buffer.toString());
      assert.equal(json.type, 'myAppType');
      const fields = {
        field1: 'value1',
        field2: 'value2',
        level: 'TRACE',
        category: 'myCategory'
      };
      assert.equal(JSON.stringify(json.fields), JSON.stringify(fields));
      assert.equal(json.message, 'Log event #1');
      // Assert timestamp, up to hours resolution.
      const date = new Date(json['@timestamp']);
      assert.equal(
        date.toISOString().substring(0, 14),
        topic.results.date.toISOString().substring(0, 14)
      );
    }
  },

  'when missing some options': {
    topic: function () {
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
      return setup;
    },
    'it sets some defaults': function (topic) {
      const json = JSON.parse(topic.results.buffer.toString());
      assert.equal(json.type, 'myLogger');
      assert.equal(
        JSON.stringify(json.fields),
        JSON.stringify({ level: 'TRACE', category: 'myLogger' })
      );
    }
  },

  'when extra fields provided': {
    topic: function () {
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
      return setup;
    },
    'they should be added to fields structure': function (topic) {
      const json = JSON.parse(topic.results.buffer.toString());
      const fields = {
        extra1: 'value1',
        extra2: 'value2',
        level: 'TRACE',
        category: 'myLogger'
      };
      assert.equal(JSON.stringify(json.fields), JSON.stringify(fields));
    }
  }

}).export(module);
