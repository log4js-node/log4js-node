'use strict';

const test = require('tap').test;
const sandbox = require('@log4js-node/sandboxed-module');
const appender = require('../../lib/appenders/logstashHTTP');

function setupLogging(category, options) {
  const fakeAxios = {
    create: function (config) {
      this.config = config;
      return {
        post: function (emptyString, event) {
          fakeAxios.args = [emptyString, event];
          return {
            catch: function (cb) {
              fakeAxios.errorCb = cb;
            }
          };
        }
      };
    }
  };

  const fakeConsole = {
    log: () => {},
    error: function (msg) {
      this.msg = msg;
    }
  };

  const log4js = sandbox.require('../../lib/log4js', {
    requires: {
      axios: fakeAxios
    },
    globals: {
      console: fakeConsole
    }
  });

  options.type = 'logstashHTTP';
  log4js.configure({
    appenders: { http: options },
    categories: { default: { appenders: ['http'], level: 'trace' } }
  });

  return {
    logger: log4js.getLogger(category),
    fakeAxios: fakeAxios,
    fakeConsole: fakeConsole
  };
}

test('logstashappender', (batch) => {
  batch.test('should export a configure function', (t) => {
    t.type(appender.configure, 'function');
    t.end();
  });

  batch.test('when using HTTP receivers', (t) => {
    const setup = setupLogging('myCategory', {
      application: 'logstash-sample',
      logType: 'application',
      logChannel: 'sample',
      url: 'http://localhost/receivers/rx1'
    });

    t.test('axios should be configured', (assert) => {
      assert.equal(setup.fakeAxios.config.baseURL, 'http://localhost/receivers/rx1');
      assert.equal(setup.fakeAxios.config.timeout, 5000);
      assert.equal(setup.fakeAxios.config.withCredentials, true);
      assert.same(setup.fakeAxios.config.headers, { 'Content-Type': 'application/x-ndjson' });
      assert.end();
    });

    setup.logger.addContext('foo', 'bar');
    setup.logger.addContext('bar', 'foo');
    setup.logger.warn('Log event #1');

    t.test('an event should be sent', (assert) => {
      const packet = setup.fakeAxios.args[1].split('\n');
      const eventHeader = JSON.parse(packet[0]);
      const eventBody = JSON.parse(packet[1]);
      assert.equal(eventHeader.index._index, 'logstash-sample');
      assert.equal(eventHeader.index._type, 'application');

      assert.equal(eventBody.channel, 'sample');
      assert.equal(eventBody.message, 'Log event #1');
      assert.equal(eventBody.level_name, 'WARN');
      assert.equal(eventBody.context.foo, 'bar');
      assert.equal(eventBody.context.bar, 'foo');

      // Assert timestamp, up to hours resolution.
      const date = new Date(eventBody.datetime);
      assert.equal(
        date.toISOString().substring(0, 14),
        new Date().toISOString().substring(0, 14)
      );
      assert.end();
    });

    t.test('errors should be sent to console.error', (assert) => {
      setup.fakeAxios.errorCb({ response: { status: 500, data: 'oh no' } });
      assert.equal(
        setup.fakeConsole.msg,
        'log4js.logstashHTTP Appender error posting to http://localhost/receivers/rx1: 500 - oh no'
      );
      setup.fakeAxios.errorCb(new Error('oh dear'));
      assert.equal(setup.fakeConsole.msg, 'log4js.logstashHTTP Appender error: oh dear');
      assert.end();
    });
    t.end();
  });

  batch.end();
});
