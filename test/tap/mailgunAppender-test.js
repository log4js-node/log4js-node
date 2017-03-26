'use strict';

const test = require('tap').test;
const layouts = require('../../lib/layouts');
const sandbox = require('sandboxed-module');

function setupLogging(category, options) {
  const msgs = [];

  const mailgunCredentials = {
    apiKey: options.apikey,
    domain: options.domain
  };

  const fakeMailgun = function () {
    return {
      messages: function () {
        return {
          config: options,
          send: function (data, callback) {
            msgs.push(data);
            callback(false, { status: 'OK' });
          }
        };
      }
    };
  };

  const fakeLayouts = {
    layout: function (type, config) {
      this.type = type;
      this.config = config;
      return layouts.messagePassThroughLayout;
    },
    basicLayout: layouts.basicLayout,
    messagePassThroughLayout: layouts.messagePassThroughLayout
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
      'mailgun-js': fakeMailgun,
      './layouts': fakeLayouts
    },
    globals: {
      console: fakeConsole
    }
  });
  options = options || {};
  options.type = 'mailgun';
  log4js.configure({
    appenders: { mailgun: options },
    categories: { default: { appenders: ['mailgun'], level: 'trace' } }
  });

  return {
    logger: log4js.getLogger(category),
    mailer: fakeMailgun,
    layouts: fakeLayouts,
    console: fakeConsole,
    mails: msgs,
    credentials: mailgunCredentials
  };
}

function checkMessages(assert, result) {
  for (let i = 0; i < result.mails.length; ++i) {
    assert.equal(result.mails[i].from, 'sender@domain.com');
    assert.equal(result.mails[i].to, 'recepient@domain.com');
    assert.equal(result.mails[i].subject, 'This is subject');
    assert.ok(new RegExp(`.+Log event #${i + 1}`).test(result.mails[i].text));
  }
}

test('log4js mailgunAppender', (batch) => {
  batch.test('mailgun setup', (t) => {
    const result = setupLogging('mailgun setup', {
      apikey: 'APIKEY',
      domain: 'DOMAIN',
      from: 'sender@domain.com',
      to: 'recepient@domain.com',
      subject: 'This is subject'
    });

    t.test('mailgun credentials should match', (assert) => {
      assert.equal(result.credentials.apiKey, 'APIKEY');
      assert.equal(result.credentials.domain, 'DOMAIN');
      assert.end();
    });
    t.end();
  });

  batch.test('basic usage', (t) => {
    const result = setupLogging('basic usage', {
      apikey: 'APIKEY',
      domain: 'DOMAIN',
      from: 'sender@domain.com',
      to: 'recepient@domain.com',
      subject: 'This is subject'
    });

    result.logger.info('Log event #1');

    t.equal(result.mails.length, 1, 'should be one message only');
    checkMessages(t, result);
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

  batch.test('error when sending email', (t) => {
    const setup = setupLogging('separate email for each event', {
      apikey: 'APIKEY',
      domain: 'DOMAIN',
      from: 'sender@domain.com',
      to: 'recepient@domain.com',
      subject: 'This is subject'
    });

    setup.mailer.messages = function () {
      return {
        send: function (msg, cb) {
          cb({ msg: 'log4js.mailgunAppender - Error happened' }, null);
        }
      };
    };

    setup.logger.info('This will break');
    const cons = setup.console;

    t.test('should be logged to console', (assert) => {
      assert.equal(cons.errors.length, 1);
      assert.equal(cons.errors[0].msg, 'log4js.mailgunAppender - Error happened');
      assert.end();
    });
    t.end();
  });

  batch.test('separate email for each event', (t) => {
    const setup = setupLogging('separate email for each event', {
      apikey: 'APIKEY',
      domain: 'DOMAIN',
      from: 'sender@domain.com',
      to: 'recepient@domain.com',
      subject: 'This is subject'
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
      t.equal(setup.mails.length, 3, 'should be three messages');
      checkMessages(t, setup);
      t.end();
    }, 3000);
  });

  batch.end();
});
