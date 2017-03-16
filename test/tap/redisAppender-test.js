'use strict';

const test = require('tap').test;
const log4js = require('../../lib/log4js');
const sandbox = require('sandboxed-module');

function setupLogging(category, options) {
  const msgs = [];

  const redisHost = {
    host: options.host,
    port: options.port,
    pass: options.pass,
    channel: options.channel
  };

  const fakeRedis = {
    createClient: function (port, post, optionR) {
      return {
        on: function (event, callback) {
          callback('throw redis error #1');
        },
        publish: function (channel, message, callback) {
          msgs.push({channel: channel, message: message});
          callback(null, {status: 'sent'});
        }
      };
    }
  };

  const fakeLayouts = {
    layout: function (type, config) {
      this.type = type;
      this.config = config;
      return log4js.layouts.messagePassThroughLayout;
    },
    basicLayout: log4js.layouts.basicLayout,
    coloredLayout: log4js.layouts.coloredLayout,
    messagePassThroughLayout: log4js.layouts.messagePassThroughLayout
  };

  const fakeUtil = {
    inspect: function (item) {
      return JSON.stringify(item);
    }
  };

  const fakeConsole = {
    errors: [],
    logs: [],
    error: function (msg, value) {
      this.errors.push({ msg: msg, value: value });
    },
    log: function (msg, value) {
      this.logs.push({ msg: msg, value: value });
    }
  };

  const redisModule = sandbox.require('../../lib/appenders/redis', {
    requires: {
      'redis': fakeRedis,
      '../layouts': fakeLayouts,
      'util': fakeUtil
    },
    globals: {
      console: fakeConsole
    }
  });

  log4js.addAppender(redisModule.configure(options), category);

  return {
    logger: log4js.getLogger(category),
    redis: fakeRedis,
    layouts: fakeLayouts,
    console: fakeConsole,
    messages: msgs,
    redishost: redisHost
  };
}

function checkMessages(assert, result) {
  for (let i = 0; i < result.messages.length; ++i) {
    assert.equal(result.messages[i].channel, 'log');
    assert.ok(new RegExp(`.+Log event #${i + 1}`).test(result.messages[i].text));
  }
}

log4js.clearAppenders();

test('log4js redisAppender', (batch) => {
  batch.test('redis setup', (t) => {
    const result = setupLogging('redis setup', {
      host: '127.0.0.1',
      port: 6739,
      pass: '',
      channel: 'log'
    });

    t.test('redis credentials should match', (assert) => {
      assert.equal(result.redishost.host, '127.0.0.1');
      assert.equal(result.redishost.port, 6739);
      assert.equal(result.redishost.pass, '');
      assert.equal(result.redishost.channel, 'log');
      assert.end();
    });
    t.end();
  });

  batch.test('basic usage', (t) => {
    const setup = setupLogging('basic usage', {
      host: '127.0.0.1',
      port: 6739,
      pass: '',
      channel: 'log'
    });

    setup.logger.info('Log event #1');

    t.equal(setup.messages.length, 1, 'should be one message only');
    checkMessages(t, setup);
    t.end();
  });

  batch.test('config with layout', (t) => {
    const result = setupLogging('config with layout', {
      layout: {
        type: 'tester'
      }
    });
    t.equal(result.layouts.type, 'tester', 'should configure layout');
    t.end();
  });

  batch.test('separate notification for each event', (t) => {
    const setup = setupLogging('separate notification for each event', {
      host: '127.0.0.1',
      port: 6739,
      pass: '',
      channel: 'log'
    });
    setTimeout(() => {
      setup.logger.info('Log event #1');
    }, 0);
    setTimeout(() => {
      setup.logger.info('Log event #2');
    }, 500);
    setTimeout(() => {
      setup.logger.info('Log event #3');
    }, 1100);
    setTimeout(() => {
      t.equal(setup.messages.length, 3, 'should be three messages');
      checkMessages(t, setup);
      t.end();
    }, 3000);
  });

  batch.end();
});
