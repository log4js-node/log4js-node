'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');

function setupLogging(category, options) {
  const fakeAxios = {
    args: [],
    create: function (config) {
      this.config = config;
      return {
        post: function (emptyString, event) {
          fakeAxios.args.push([emptyString, event]);
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

  options.type = 'logFaces-HTTP';
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

test('logFaces appender', (batch) => {
  batch.test('when using HTTP receivers', (t) => {
    const setup = setupLogging('myCategory', {
      type: 'logFacesAppender',
      application: 'LFS-HTTP',
      url: 'http://localhost/receivers/rx1'
    });

    setup.logger.warn('Log event #1');

    t.test('an event should be sent', (assert) => {
      const event = setup.results;
      assert.equal(event.a, 'LFS-HTTP');
      assert.equal(event.m, 'Log event #1');
      assert.equal(event.g, 'myCategory');
      assert.equal(event.p, 'WARN');
      assert.equal(event.p_foo, 'bar');
      assert.equal(event.p_bar, 'foo');

      // Assert timestamp, up to hours resolution.
      const date = new Date(event.t);
      assert.equal(
        date.toISOString().substring(0, 14),
        new Date().toISOString().substring(0, 14)
      );
      assert.end();
    });
    t.end();
  });

  batch.test('when using UDP receivers', (t) => {
    const setup = setupLogging('udpCategory', {
      type: 'logFacesAppender',
      application: 'LFS-UDP',
      remoteHost: '127.0.0.1',
      port: 55201
    });

    setup.logger.error('Log event #2');

    t.test('an event should be sent', (assert) => {
      const event = setup.results;
      assert.equal(event.a, 'LFS-UDP');
      assert.equal(event.m, 'Log event #2');
      assert.equal(event.g, 'udpCategory');
      assert.equal(event.p, 'ERROR');
      assert.equal(event.p_foo, 'bar');
      assert.equal(event.p_bar, 'foo');

      // Assert timestamp, up to hours resolution.
      const date = new Date(event.t);
      assert.equal(
        date.toISOString().substring(0, 14),
        new Date().toISOString().substring(0, 14)
      );
      assert.end();
    });
    t.end();
  });

  batch.end();
});
