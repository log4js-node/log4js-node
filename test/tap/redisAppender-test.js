'use strict';

const test = require('tap').test;
const sandbox = require('@log4js-node/sandboxed-module');
const appender = require('../../lib/appenders/redis');

function setupLogging(category, options) {
  const fakeRedis = {
    msgs: [],
    createClient: function (port, host, optionR) {
      this.port = port;
      this.host = host;
      this.optionR = optionR;

      return {
        on: function (event, callback) {
          fakeRedis.errorCb = callback;
        },
        publish: function (channel, message, callback) {
          fakeRedis.msgs.push({ channel: channel, message: message });
          fakeRedis.publishCb = callback;
        },
        quit: function () {
          fakeRedis.quitCalled = true;
        },
      };
    }
  };

  const fakeConsole = {
    log: () => {},
    errors: [],
    error: function (msg) {
      this.errors.push(msg);
    }
  };

  const log4js = sandbox.require('../../lib/log4js', {
    requires: {
      redis: fakeRedis
    },
    globals: {
      console: fakeConsole
    }
  });
  log4js.configure({
    appenders: { redis: options },
    categories: { default: { appenders: ['redis'], level: 'trace' } }
  });

  return {
    logger: log4js.getLogger(category),
    log4js: log4js,
    fakeRedis: fakeRedis,
    fakeConsole: fakeConsole
  };
}

test('log4js redisAppender', (batch) => {
  batch.test('should export a configure function', (t) => {
    t.type(appender.configure, 'function');
    t.end();
  });

  batch.test('redis setup', (t) => {
    const result = setupLogging('redis setup', {
      host: '123.123.123.123',
      port: 1234,
      pass: '123456',
      channel: 'log',
      type: 'redis',
      layout: {
        type: 'pattern',
        pattern: 'cheese %m'
      }
    });

    result.logger.info('Log event #1');
    result.fakeRedis.publishCb();

    t.test('redis credentials should match', (assert) => {
      assert.equal(result.fakeRedis.host, '123.123.123.123');
      assert.equal(result.fakeRedis.port, 1234);
      assert.equal(result.fakeRedis.optionR.auth_pass, '123456');
      assert.equal(result.fakeRedis.msgs.length, 1, 'should be one message only');
      assert.equal(result.fakeRedis.msgs[0].channel, 'log');
      assert.equal(result.fakeRedis.msgs[0].message, 'cheese Log event #1');
      assert.end();
    });

    t.end();
  });

  batch.test('default values', (t) => {
    const setup = setupLogging('defaults', {
      type: 'redis',
      channel: 'thing'
    });

    setup.logger.info('just testing');
    setup.fakeRedis.publishCb();

    t.test('should use localhost', (assert) => {
      assert.equal(setup.fakeRedis.host, '127.0.0.1');
      assert.equal(setup.fakeRedis.port, 6379);
      assert.same(setup.fakeRedis.optionR, {});
      assert.end();
    });

    t.test('should use message pass through layout', (assert) => {
      assert.equal(setup.fakeRedis.msgs.length, 1);
      assert.equal(setup.fakeRedis.msgs[0].channel, 'thing');
      assert.equal(setup.fakeRedis.msgs[0].message, 'just testing');
      assert.end();
    });

    t.end();
  });

  batch.test('redis errors', (t) => {
    const setup = setupLogging('errors', { type: 'redis', channel: 'testing' });

    setup.fakeRedis.errorCb('oh no, error on connect');
    setup.logger.info('something something');
    setup.fakeRedis.publishCb('oh no, error on publish');

    t.test('should go to the console', (assert) => {
      assert.equal(setup.fakeConsole.errors.length, 3);
      assert.equal(
        setup.fakeConsole.errors[1],
        'log4js.redisAppender - 127.0.0.1:6379 Error: \'oh no, error on connect\''
      );
      assert.equal(
        setup.fakeConsole.errors[2],
        'log4js.redisAppender - 127.0.0.1:6379 Error: \'oh no, error on publish\''
      );
      assert.end();
    });
    t.end();
  });

  batch.test('shutdown', (t) => {
    const setup = setupLogging('shutdown', { type: 'redis', channel: 'testing' });

    setup.log4js.shutdown(() => {
      t.ok(setup.fakeRedis.quitCalled);
      t.end();
    });
  });

  batch.end();
});
