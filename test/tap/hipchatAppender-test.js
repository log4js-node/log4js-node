'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');

function setupLogging(category, options) {
  const lastRequest = {};

  const fakeRequest = function (args, level) {
    lastRequest.notifier = this;
    lastRequest.body = args[0];
    lastRequest.callback = args[1];
    lastRequest.level = level;
  };

  const fakeHipchatNotifier = {
    make: function (room, token, from, host, notify) {
      return {
        room: room,
        token: token,
        from: from || '',
        host: host || 'api.hipchat.com',
        notify: notify || false,
        setRoom: function (val) {
          this.room = val;
        },
        setFrom: function (val) {
          this.from = val;
        },
        setHost: function (val) {
          this.host = val;
        },
        setNotify: function (val) {
          this.notify = val;
        },
        info: function () {
          fakeRequest.call(this, arguments, 'info');
        },
        warning: function () {
          fakeRequest.call(this, arguments, 'warning');
        },
        failure: function () {
          fakeRequest.call(this, arguments, 'failure');
        },
        success: function () {
          fakeRequest.call(this, arguments, 'success');
        }
      };
    }
  };

  const log4js = sandbox.require('../../lib/log4js', {
    requires: {
      'hipchat-notifier': fakeHipchatNotifier
    }
  });

  options = options || {};
  options.type = 'hipchat';

  log4js.configure({
    appenders: { hipchat: options },
    categories: { default: { appenders: ['hipchat'], level: 'debug' } }
  });

  return {
    logger: log4js.getLogger(category),
    lastRequest: lastRequest
  };
}

test('HipChat appender', (batch) => {
  batch.test('when logging to HipChat v2 API', (t) => {
    const customCallback = function () {
      return 'works';
    };

    const topic = setupLogging('myCategory', {
      type: 'hipchat',
      hipchat_token: 'User_Token_With_Notification_Privs',
      hipchat_room: 'Room_ID_Or_Name',
      hipchat_from: 'Log4js_Test',
      hipchat_notify: true,
      hipchat_host: 'hipchat.your-company.tld',
      hipchat_response_callback: customCallback
    });
    topic.logger.warn('Log event #1');

    t.test('a request to hipchat_host should be sent', (assert) => {
      assert.equal(topic.lastRequest.notifier.host, 'hipchat.your-company.tld');
      assert.equal(topic.lastRequest.notifier.notify, true);
      assert.equal(topic.lastRequest.body, 'Log event #1');
      assert.equal(topic.lastRequest.level, 'warning');
      assert.end();
    });

    t.equal(topic.lastRequest.callback(), 'works', 'a custom callback to the HipChat response is supported');
    t.end();
  });

  batch.test('when missing options', (t) => {
    const topic = setupLogging('myLogger', {
      type: 'hipchat',
    });
    topic.logger.error('Log event #2');

    t.test('it sets some defaults', (assert) => {
      assert.equal(topic.lastRequest.notifier.host, 'api.hipchat.com');
      assert.equal(topic.lastRequest.notifier.notify, false);
      assert.equal(topic.lastRequest.body, 'Log event #2');
      assert.equal(topic.lastRequest.level, 'failure');
      assert.end();
    });
    t.end();
  });

  batch.test('when basicLayout is provided', (t) => {
    const topic = setupLogging('myLogger', {
      type: 'hipchat',
      layout: { type: 'basic' }
    });
    topic.logger.debug('Log event #3');

    t.test('it should include the timestamp', (assert) => {
      // basicLayout adds [TIMESTAMP] [LEVEL] category - message
      // e.g. [2016-06-10 11:50:53.819] [DEBUG] myLogger - Log event #23

      assert.match(topic.lastRequest.body, /^\[[^\]]+] \[[^\]]+].*Log event #3$/);
      assert.equal(topic.lastRequest.level, 'info');
      assert.end();
    });
    t.end();
  });

  batch.end();
});
