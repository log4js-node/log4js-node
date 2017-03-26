'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');
const realLayouts = require('../../lib/layouts');

function setupLogging(category, options) {
  const msgs = [];

  const slackCredentials = {
    token: options.token,
    channel_id: options.channel_id,
    username: options.username,
    format: options.format,
    icon_url: options.icon_url
  };
  const fakeSlack = (function (key) {
    function constructor() {
      return {
        options: key,
        api: function (action, data, callback) {
          msgs.push(data);
          callback(false, { status: 'sent' });
        }
      };
    }

    return constructor(key);
  });

  const fakeLayouts = {
    layout: function (type, config) {
      this.type = type;
      this.config = config;
      return realLayouts.messagePassThroughLayout;
    },
    basicLayout: realLayouts.basicLayout,
    coloredLayout: realLayouts.coloredLayout,
    messagePassThroughLayout: realLayouts.messagePassThroughLayout
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

  const log4js = sandbox.require('../../lib/log4js', {
    requires: {
      'slack-node': fakeSlack,
      './layouts': fakeLayouts
    },
    globals: {
      console: fakeConsole
    }
  });

  options.type = 'slack';
  log4js.configure({
    appenders: {
      slack: options
    },
    categories: {
      default: { appenders: ['slack'], level: 'trace' }
    }
  });

  return {
    logger: log4js.getLogger(category),
    mailer: fakeSlack,
    layouts: fakeLayouts,
    console: fakeConsole,
    messages: msgs,
    credentials: slackCredentials
  };
}

function checkMessages(assert, result) {
  for (let i = 0; i < result.messages.length; ++i) {
    assert.equal(result.messages[i].channel, '#CHANNEL');
    assert.equal(result.messages[i].username, 'USERNAME');
    assert.ok(new RegExp(`.+Log event #${i + 1}`).test(result.messages[i].text));
  }
}

test('log4js slackAppender', (batch) => {
  batch.test('slack setup', (t) => {
    const result = setupLogging('slack setup', {
      token: 'TOKEN',
      channel_id: '#CHANNEL',
      username: 'USERNAME',
      format: 'FORMAT',
      icon_url: 'ICON_URL'
    });

    t.test('slack credentials should match', (assert) => {
      assert.equal(result.credentials.token, 'TOKEN');
      assert.equal(result.credentials.channel_id, '#CHANNEL');
      assert.equal(result.credentials.username, 'USERNAME');
      assert.equal(result.credentials.format, 'FORMAT');
      assert.equal(result.credentials.icon_url, 'ICON_URL');
      assert.end();
    });
    t.end();
  });

  batch.test('basic usage', (t) => {
    const setup = setupLogging('basic usage', {
      token: 'TOKEN',
      channel_id: '#CHANNEL',
      username: 'USERNAME',
      format: 'FORMAT',
      icon_url: 'ICON_URL',
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
      token: 'TOKEN',
      channel_id: '#CHANNEL',
      username: 'USERNAME',
      format: 'FORMAT',
      icon_url: 'ICON_URL',
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
