'use strict';

const test = require('tap').test;
const realLayouts = require('../../lib/layouts');
const sandbox = require('sandboxed-module');

function setupLogging(category, options, errorOnSend) {
  const msgs = [];

  const fakeMailer = {
    createTransport: function (name, opts) {
      return {
        config: opts,
        sendMail: function (msg, callback) {
          if (errorOnSend) {
            callback({ message: errorOnSend });
            return;
          }
          msgs.push(msg);
          callback(null, true);
        },
        close: function () {
        }
      };
    }
  };

  const fakeLayouts = {
    layout: function (type, config) {
      this.type = type;
      this.config = config;
      return realLayouts.messagePassThroughLayout;
    },
    basicLayout: realLayouts.basicLayout,
    messagePassThroughLayout: realLayouts.messagePassThroughLayout
  };

  const fakeConsole = {
    errors: [],
    error: function (msg, value) {
      this.errors.push({ msg: msg, value: value });
    }
  };

  const log4js = sandbox.require('../../lib/log4js', {
    requires: {
      nodemailer: fakeMailer,
      './layouts': fakeLayouts
    },
    globals: {
      console: fakeConsole
    }
  });

  options.type = 'smtp';
  log4js.configure({
    appenders: {
      smtp: options
    },
    categories: { default: { appenders: ['smtp'], level: 'trace' } }
  });

  return {
    logger: log4js.getLogger(category),
    mailer: fakeMailer,
    layouts: fakeLayouts,
    console: fakeConsole,
    results: msgs
  };
}

function checkMessages(assert, result, sender, subject) {
  for (let i = 0; i < result.results.length; ++i) {
    assert.equal(result.results[i].from, sender);
    assert.equal(result.results[i].to, 'recipient@domain.com');
    assert.equal(result.results[i].subject, subject ? subject : `Log event #${i + 1}`); // eslint-disable-line
    assert.ok(new RegExp(`.+Log event #${i + 1}\n$`).test(result.results[i].text));
  }
}

test('log4js smtpAppender', (batch) => {
  batch.test('minimal config', (t) => {
    const setup = setupLogging('minimal config', {
      recipients: 'recipient@domain.com',
      SMTP: {
        port: 25,
        auth: {
          user: 'user@domain.com'
        }
      }
    });
    setup.logger.info('Log event #1');

    t.equal(setup.results.length, 1, 'should be one message only');
    checkMessages(t, setup);
    t.end();
  });

  batch.test('fancy config', (t) => {
    const setup = setupLogging('fancy config', {
      recipients: 'recipient@domain.com',
      sender: 'sender@domain.com',
      subject: 'This is subject',
      SMTP: {
        port: 25,
        auth: {
          user: 'user@domain.com'
        }
      }
    });
    setup.logger.info('Log event #1');

    t.equal(setup.results.length, 1, 'should be one message only');
    checkMessages(t, setup, 'sender@domain.com', 'This is subject');
    t.end();
  });

  batch.test('config with layout', (t) => {
    const setup = setupLogging('config with layout', {
      layout: {
        type: 'tester'
      }
    });
    t.equal(setup.layouts.type, 'tester', 'should configure layout');
    t.end();
  });

  batch.test('separate email for each event', (t) => {
    const setup = setupLogging('separate email for each event', {
      recipients: 'recipient@domain.com',
      SMTP: {
        port: 25,
        auth: {
          user: 'user@domain.com'
        }
      }
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
      t.equal(setup.results.length, 3, 'there should be three messages');
      checkMessages(t, setup);
      t.end();
    }, 3000);
  });

  batch.test('multiple events in one email', (t) => {
    const setup = setupLogging('multiple events in one email', {
      recipients: 'recipient@domain.com',
      sendInterval: 1,
      SMTP: {
        port: 25,
        auth: {
          user: 'user@domain.com'
        }
      }
    });
    setTimeout(() => {
      setup.logger.info('Log event #1');
    }, 0);
    setTimeout(() => {
      setup.logger.info('Log event #2');
    }, 100);
    setTimeout(() => {
      setup.logger.info('Log event #3');
    }, 1500);
    setTimeout(() => {
      t.equal(setup.results.length, 2, 'there should be two messages');
      t.equal(setup.results[0].to, 'recipient@domain.com');
      t.equal(setup.results[0].subject, 'Log event #1');
      t.equal(
        setup.results[0].text.match(new RegExp('.+Log event #[1-2]$', 'gm')).length,
        2
      );
      t.equal(setup.results[1].to, 'recipient@domain.com');
      t.equal(setup.results[1].subject, 'Log event #3');
      t.ok(/.+Log event #3\n$/.test(setup.results[1].text));
      t.end();
    }, 3000);
  });

  batch.test('error when sending email', (t) => {
    const setup = setupLogging('error when sending email', {
      recipients: 'recipient@domain.com',
      sendInterval: 0,
      SMTP: { port: 25, auth: { user: 'user@domain.com' } }
    }, 'oh noes');

    setup.logger.info('This will break');

    t.test('should be logged to console', (assert) => {
      assert.equal(setup.console.errors.length, 1);
      assert.equal(setup.console.errors[0].msg, 'log4js.smtpAppender - Error happened');
      assert.equal(setup.console.errors[0].value.message, 'oh noes');
      assert.end();
    });
    t.end();
  });

  batch.test('transport full config', (t) => {
    const setup = setupLogging('transport full config', {
      recipients: 'recipient@domain.com',
      transport: {
        plugin: 'sendmail',
        options: {
          path: '/usr/sbin/sendmail'
        }
      }
    });
    setup.logger.info('Log event #1');

    t.equal(setup.results.length, 1, 'should be one message only');
    checkMessages(t, setup);
    t.end();
  });

  batch.test('transport no-options config', (t) => {
    const setup = setupLogging('transport no-options config', {
      recipients: 'recipient@domain.com',
      transport: {
        plugin: 'sendmail'
      }
    });
    setup.logger.info('Log event #1');

    t.equal(setup.results.length, 1, 'should be one message only');
    checkMessages(t, setup);
    t.end();
  });

  batch.test('transport no-plugin config', (t) => {
    const setup = setupLogging('transport no-plugin config', {
      recipients: 'recipient@domain.com',
      transport: {}
    });
    setup.logger.info('Log event #1');

    t.equal(setup.results.length, 1, 'should be one message only');
    checkMessages(t, setup);
    t.end();
  });

  batch.test('attachment config', (t) => {
    const setup = setupLogging('attachment config', {
      recipients: 'recipient@domain.com',
      attachment: {
        enable: true
      },
      SMTP: {
        port: 25,
        auth: {
          user: 'user@domain.com'
        }
      }
    });
    setup.logger.info('Log event #1');

    t.test('message should contain proper data', (assert) => {
      assert.equal(setup.results.length, 1);
      assert.equal(setup.results[0].attachments.length, 1);
      const attachment = setup.results[0].attachments[0];
      assert.equal(setup.results[0].text, 'See logs as attachment');
      assert.equal(attachment.filename, 'default.log');
      assert.equal(attachment.contentType, 'text/x-log');
      assert.ok(new RegExp(`.+Log event #${1}\n$`).test(attachment.content));
      assert.end();
    });
    t.end();
  });

  batch.end();
});
