/* jshint maxparams:7 */

'use strict';

const test = require('tap').test;
const EE = require('events').EventEmitter;
const levels = require('../../lib/levels')();

class MockLogger {
  constructor() {
    this.level = levels.TRACE;
    this.messages = [];
    this.log = function (level, message) {
      this.messages.push({ level: level, message: message });
    };
    this.isLevelEnabled = function (level) {
      return level.isGreaterThanOrEqualTo(this.level);
    };
  }
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

test('log4js connect logger', (batch) => {
  const clm = require('../../lib/connect-logger')(levels);
  batch.test('getConnectLoggerModule', (t) => {
    t.type(clm, 'object', 'should return a connect logger factory');

    t.test('should take a log4js logger and return a "connect logger"', (assert) => {
      const ml = new MockLogger();
      const cl = clm.connectLogger(ml);

      assert.type(cl, 'function');
      assert.end();
    });

    t.test('log events', (assert) => {
      const ml = new MockLogger();
      const cl = clm.connectLogger(ml);
      request(cl, 'GET', 'http://url', 200);

      const messages = ml.messages;
      assert.type(messages, 'Array');
      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.include(messages[0].message, 'GET');
      assert.include(messages[0].message, 'http://url');
      assert.include(messages[0].message, 'my.remote.addr');
      assert.include(messages[0].message, '200');
      assert.end();
    });

    t.test('log events with level below logging level', (assert) => {
      const ml = new MockLogger();
      ml.level = levels.FATAL;
      const cl = clm.connectLogger(ml);
      request(cl, 'GET', 'http://url', 200);

      assert.type(ml.messages, 'Array');
      assert.equal(ml.messages.length, 0);
      assert.end();
    });

    t.test('log events with non-default level and custom format', (assert) => {
      const ml = new MockLogger();
      ml.level = levels.INFO;
      const cl = clm.connectLogger(ml, { level: levels.INFO, format: ':method :url' });
      request(cl, 'GET', 'http://url', 200);

      const messages = ml.messages;
      assert.type(messages, Array);
      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.equal(messages[0].message, 'GET http://url');
      assert.end();
    });
    t.end();
  });

  batch.test('logger with options as string', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm.connectLogger(ml, ':method :url');
    request(cl, 'POST', 'http://meh', 200);

    const messages = ml.messages;
    t.equal(messages[0].message, 'POST http://meh');
    t.end();
  });

  batch.test('auto log levels', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm.connectLogger(ml, { level: 'auto', format: ':method :url' });
    request(cl, 'GET', 'http://meh', 200);
    request(cl, 'GET', 'http://meh', 201);
    request(cl, 'GET', 'http://meh', 302);
    request(cl, 'GET', 'http://meh', 404);
    request(cl, 'GET', 'http://meh', 500);

    const messages = ml.messages;
    t.test('should use INFO for 2xx', (assert) => {
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.ok(levels.INFO.isEqualTo(messages[1].level));
      assert.end();
    });

    t.test('should use WARN for 3xx', (assert) => {
      assert.ok(levels.WARN.isEqualTo(messages[2].level));
      assert.end();
    });

    t.test('should use ERROR for 4xx', (assert) => {
      assert.ok(levels.ERROR.isEqualTo(messages[3].level));
      assert.end();
    });

    t.test('should use ERROR for 5xx', (assert) => {
      assert.ok(levels.ERROR.isEqualTo(messages[4].level));
      assert.end();
    });
    t.end();
  });

  batch.test('format using a function', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm.connectLogger(ml, () => 'I was called');
    request(cl, 'GET', 'http://blah', 200);

    t.equal(ml.messages[0].message, 'I was called');
    t.end();
  });

  batch.test('format that includes request headers', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm.connectLogger(ml, ':req[Content-Type]');
    request(
      cl,
      'GET', 'http://blah', 200,
      { 'Content-Type': 'application/json' }
    );

    t.equal(ml.messages[0].message, 'application/json');
    t.end();
  });

  batch.test('format that includes response headers', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm.connectLogger(ml, ':res[Content-Type]');
    request(
      cl,
      'GET', 'http://blah', 200,
      null,
      { 'Content-Type': 'application/cheese' }
    );

    t.equal(ml.messages[0].message, 'application/cheese');
    t.end();
  });

  batch.test('log events with custom token', (t) => {
    const ml = new MockLogger();
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

    t.type(ml.messages, 'Array');
    t.equal(ml.messages.length, 1);
    t.ok(levels.INFO.isEqualTo(ml.messages[0].level));
    t.equal(ml.messages[0].message, 'GET http://url fooBAR');
    t.end();
  });

  batch.test('log events with custom override token', (t) => {
    const ml = new MockLogger();
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

    t.type(ml.messages, 'Array');
    t.equal(ml.messages.length, 1);
    t.ok(levels.INFO.isEqualTo(ml.messages[0].level));
    t.equal(ml.messages[0].message, 'GET http://url 20150310');
    t.end();
  });

  batch.end();
});
