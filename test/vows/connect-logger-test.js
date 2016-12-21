/* jshint maxparams:7 */

'use strict';

const vows = require('vows');
const assert = require('assert');
const EE = require('events').EventEmitter;
const levels = require('../../lib/levels');

function MockLogger() {
  const that = this;
  this.messages = [];

  this.log = function (level, message) {
    that.messages.push({ level: level, message: message });
  };

  this.isLevelEnabled = function (level) {
    return level.isGreaterThanOrEqualTo(that.level);
  };

  this.level = levels.TRACE;
}

function MockRequest(remoteAddr, method, originalUrl, headers) {
  this.socket = { remoteAddress: remoteAddr };
  this.originalUrl = originalUrl;
  this.method = method;
  this.httpVersionMajor = '5';
  this.httpVersionMinor = '0';
  this.headers = headers || {};

  const self = this;
  Object.keys(this.headers).forEach((key) => {
    self.headers[key.toLowerCase()] = self.headers[key];
  });
}

class MockResponse extends EE {
  constructor() {
    super();
    const r = this;
    this.end = function () {
      r.emit('finish');
    };

    this.writeHead = function (code, headers) {
      this.statusCode = code;
      this._headers = headers;
    };
  }
}

function request(cl, method, url, code, reqHeaders, resHeaders) {
  const req = new MockRequest('my.remote.addr', method, url, reqHeaders);
  const res = new MockResponse();
  cl(req, res, () => {
  });
  res.writeHead(code, resHeaders);
  res.end('chunk', 'encoding');
}

vows.describe('log4js connect logger').addBatch({
  getConnectLoggerModule: {
    topic: function () {
      const clm = require('../../lib/connect-logger');
      return clm;
    },

    'should return a "connect logger" factory': function (clm) {
      assert.isObject(clm);
    },

    'take a log4js logger and return a "connect logger"': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cl = clm.connectLogger(ml);
        return cl;
      },

      'should return a "connect logger"': function (cl) {
        assert.isFunction(cl);
      }
    },

    'log events': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cl = clm.connectLogger(ml);
        const cb = this.callback;
        request(cl, 'GET', 'http://url', 200);
        setTimeout(() => {
          cb(null, ml.messages);
        }, 10);
      },

      'check message': function (messages) {
        assert.isArray(messages);
        assert.equal(messages.length, 1);
        assert.ok(levels.INFO.isEqualTo(messages[0].level));
        assert.include(messages[0].message, 'GET');
        assert.include(messages[0].message, 'http://url');
        assert.include(messages[0].message, 'my.remote.addr');
        assert.include(messages[0].message, '200');
      }
    },

    'log events with level below logging level': {
      topic: function (clm) {
        const ml = new MockLogger();
        ml.level = levels.FATAL;
        const cl = clm.connectLogger(ml);
        request(cl, 'GET', 'http://url', 200);
        return ml.messages;
      },

      'check message': function (messages) {
        assert.isArray(messages);
        assert.isEmpty(messages);
      }
    },

    'log events with non-default level and custom format': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cb = this.callback;
        ml.level = levels.INFO;
        const cl = clm.connectLogger(ml, { level: levels.INFO, format: ':method :url' });
        request(cl, 'GET', 'http://url', 200);
        setTimeout(() => {
          cb(null, ml.messages);
        }, 10);
      },

      'check message': function (messages) {
        assert.isArray(messages);
        assert.equal(messages.length, 1);
        assert.ok(levels.INFO.isEqualTo(messages[0].level));
        assert.equal(messages[0].message, 'GET http://url');
      }
    },

    'logger with options as string': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cb = this.callback;
        ml.level = levels.INFO;
        const cl = clm.connectLogger(ml, ':method :url');
        request(cl, 'POST', 'http://meh', 200);
        setTimeout(() => {
          cb(null, ml.messages);
        }, 10);
      },
      'should use the passed in format': function (messages) {
        assert.equal(messages[0].message, 'POST http://meh');
      }
    },

    'auto log levels': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cb = this.callback;
        ml.level = levels.INFO;
        const cl = clm.connectLogger(ml, { level: 'auto', format: ':method :url' });
        request(cl, 'GET', 'http://meh', 200);
        request(cl, 'GET', 'http://meh', 201);
        request(cl, 'GET', 'http://meh', 302);
        request(cl, 'GET', 'http://meh', 404);
        request(cl, 'GET', 'http://meh', 500);
        setTimeout(() => {
          cb(null, ml.messages);
        }, 10);
      },

      'should use INFO for 2xx': function (messages) {
        assert.ok(levels.INFO.isEqualTo(messages[0].level));
        assert.ok(levels.INFO.isEqualTo(messages[1].level));
      },

      'should use WARN for 3xx': function (messages) {
        assert.ok(levels.WARN.isEqualTo(messages[2].level));
      },

      'should use ERROR for 4xx': function (messages) {
        assert.ok(levels.ERROR.isEqualTo(messages[3].level));
      },

      'should use ERROR for 5xx': function (messages) {
        assert.ok(levels.ERROR.isEqualTo(messages[4].level));
      }
    },

    'format using a function': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cb = this.callback;
        ml.level = levels.INFO;
        const cl = clm.connectLogger(ml, () => 'I was called');
        request(cl, 'GET', 'http://blah', 200);
        setTimeout(() => {
          cb(null, ml.messages);
        }, 10);
      },

      'should call the format function': function (messages) {
        assert.equal(messages[0].message, 'I was called');
      }
    },

    'format that includes request headers': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cb = this.callback;
        ml.level = levels.INFO;
        const cl = clm.connectLogger(ml, ':req[Content-Type]');
        request(
          cl,
          'GET', 'http://blah', 200,
          { 'Content-Type': 'application/json' }
        );
        setTimeout(() => {
          cb(null, ml.messages);
        }, 10);
      },
      'should output the request header': function (messages) {
        assert.equal(messages[0].message, 'application/json');
      }
    },

    'format that includes response headers': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cb = this.callback;
        ml.level = levels.INFO;
        const cl = clm.connectLogger(ml, ':res[Content-Type]');
        request(
          cl,
          'GET', 'http://blah', 200,
          null,
          { 'Content-Type': 'application/cheese' }
        );
        setTimeout(() => {
          cb(null, ml.messages);
        }, 10);
      },

      'should output the response header': function (messages) {
        assert.equal(messages[0].message, 'application/cheese');
      }
    },

    'log events with custom token': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cb = this.callback;
        ml.level = levels.INFO;
        const cl = clm.connectLogger(ml, {
          level: levels.INFO,
          format: ':method :url :custom_string',
          tokens: [
            {
              token: ':custom_string', replacement: 'fooBAR'
            }
          ]
        });
        request(cl, 'GET', 'http://url', 200);
        setTimeout(() => {
          cb(null, ml.messages);
        }, 10);
      },

      'check message': function (messages) {
        assert.isArray(messages);
        assert.equal(messages.length, 1);
        assert.ok(levels.INFO.isEqualTo(messages[0].level));
        assert.equal(messages[0].message, 'GET http://url fooBAR');
      }
    },

    'log events with custom override token': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cb = this.callback;
        ml.level = levels.INFO;
        const cl = clm.connectLogger(ml, {
          level: levels.INFO,
          format: ':method :url :date',
          tokens: [
            {
              token: ':date', replacement: '20150310'
            }
          ]
        });
        request(cl, 'GET', 'http://url', 200);
        setTimeout(() => {
          cb(null, ml.messages);
        }, 10);
      },

      'check message': function (messages) {
        assert.isArray(messages);
        assert.equal(messages.length, 1);
        assert.ok(levels.INFO.isEqualTo(messages[0].level));
        assert.equal(messages[0].message, 'GET http://url 20150310');
      }
    }
  }
}).export(module);
