/* jshint maxparams:7 */

'use strict';

const test = require('tap').test;
const EE = require('events').EventEmitter;
const levels = require('../../lib/levels');

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

function MockRequest(remoteAddr, method, originalUrl, headers, url, custom) {
  this.socket = { remoteAddress: remoteAddr };
  this.originalUrl = originalUrl;
  this.url = url;
  this.method = method;
  this.httpVersionMajor = '5';
  this.httpVersionMinor = '0';
  this.headers = headers || {};

  if (custom) {
    for (const key of Object.keys(custom)) {
      this[key] = custom[key];
    }
  }

  const self = this;
  Object.keys(this.headers).forEach((key) => {
    self.headers[key.toLowerCase()] = self.headers[key];
  });
}

class MockResponse extends EE {
  constructor() {
    super();
    this.cachedHeaders = {};
  }

  end() {
    this.emit('finish');
  }

  setHeader(key, value) {
    this.cachedHeaders[key.toLowerCase()] = value;
  }

  getHeader(key) {
    return this.cachedHeaders[key.toLowerCase()];
  }

  writeHead(code /* , headers */) {
    this.statusCode = code;
  }
}

function request(cl, method, originalUrl, code, reqHeaders, resHeaders, next, url, custom = undefined) {
  const req = new MockRequest('my.remote.addr', method, originalUrl, reqHeaders, url, custom);
  const res = new MockResponse();
  if (next) {
    next = next.bind(null, req, res, () => {});
  } else {
    next = () => {};
  }
  cl(req, res, next);
  res.writeHead(code, resHeaders);
  res.end('chunk', 'encoding');
}

test('log4js connect logger', (batch) => {
  const clm = require('../../lib/connect-logger');
  batch.test('getConnectLoggerModule', (t) => {
    t.type(clm, 'function', 'should return a connect logger factory');

    t.test('should take a log4js logger and return a "connect logger"', (assert) => {
      const ml = new MockLogger();
      const cl = clm(ml);

      assert.type(cl, 'function');
      assert.end();
    });

    t.test('log events', (assert) => {
      const ml = new MockLogger();
      const cl = clm(ml);
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
      const cl = clm(ml);
      request(cl, 'GET', 'http://url', 200);

      assert.type(ml.messages, 'Array');
      assert.equal(ml.messages.length, 0);
      assert.end();
    });

    t.test('log events with non-default level and custom format', (assert) => {
      const ml = new MockLogger();
      ml.level = levels.INFO;
      const cl = clm(ml, { level: levels.WARN, format: ':method :url' });
      request(cl, 'GET', 'http://url', 200);

      const messages = ml.messages;
      assert.type(messages, Array);
      assert.equal(messages.length, 1);
      assert.ok(levels.WARN.isEqualTo(messages[0].level));
      assert.equal(messages[0].message, 'GET http://url');
      assert.end();
    });

    t.test('adding multiple loggers should only log once', (assert) => {
      const ml = new MockLogger();
      ml.level = levels.INFO;
      const cl = clm(ml, { level: levels.WARN, format: ':method :url' });
      const nextLogger = clm(ml, { level: levels.INFO, format: ':method' });
      request(cl, 'GET', 'http://url', 200, null, null, nextLogger);

      const messages = ml.messages;
      assert.type(messages, Array);
      assert.equal(messages.length, 1);
      assert.ok(levels.WARN.isEqualTo(messages[0].level));
      assert.equal(messages[0].message, 'GET http://url');

      assert.end();
    });
    t.end();
  });

  batch.test('logger with options as string', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm(ml, ':method :url');
    request(cl, 'POST', 'http://meh', 200);

    const messages = ml.messages;
    t.equal(messages[0].message, 'POST http://meh');
    t.end();
  });

  batch.test('auto log levels', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm(ml, { level: 'auto', format: ':method :url' });
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

  batch.test('logger with status code rules applied', (t) => {
    const ml = new MockLogger();
    ml.level = levels.DEBUG;
    const clr = [
      { codes: [201, 304], level: levels.DEBUG.toString() },
      { from: 200, to: 299, level: levels.DEBUG.toString() },
      { from: 300, to: 399, level: levels.INFO.toString() }
    ];
    const cl = clm(ml, { level: 'auto', format: ':method :url', statusRules: clr });
    request(cl, 'GET', 'http://meh', 200);
    request(cl, 'GET', 'http://meh', 201);
    request(cl, 'GET', 'http://meh', 302);
    request(cl, 'GET', 'http://meh', 304);
    request(cl, 'GET', 'http://meh', 404);
    request(cl, 'GET', 'http://meh', 500);

    const messages = ml.messages;
    t.test('should use DEBUG for 2xx', (assert) => {
      assert.ok(levels.DEBUG.isEqualTo(messages[0].level));
      assert.ok(levels.DEBUG.isEqualTo(messages[1].level));
      assert.end();
    });

    t.test('should use WARN for 3xx, DEBUG for 304', (assert) => {
      assert.ok(levels.INFO.isEqualTo(messages[2].level));
      assert.ok(levels.DEBUG.isEqualTo(messages[3].level));
      assert.end();
    });

    t.test('should use ERROR for 4xx', (assert) => {
      assert.ok(levels.ERROR.isEqualTo(messages[4].level));
      assert.end();
    });

    t.test('should use ERROR for 5xx', (assert) => {
      assert.ok(levels.ERROR.isEqualTo(messages[5].level));
      assert.end();
    });
    t.end();
  });

  batch.test('format using a function', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm(ml, () => 'I was called');
    request(cl, 'GET', 'http://blah', 200);

    t.equal(ml.messages[0].message, 'I was called');
    t.end();
  });

  batch.test('format using a function that also uses tokens', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm(ml, (req, res, tokenReplacer) => `${req.method} ${tokenReplacer(':status')}`);
    request(cl, 'GET', 'http://blah', 200);

    t.equal(ml.messages[0].message, 'GET 200');
    t.end();
  });

  batch.test('format using a function, but do not log anything if the function returns nothing', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm(ml, () => null);
    request(cl, 'GET', 'http://blah', 200);

    t.equal(ml.messages.length, 0);
    t.end();
  });

  batch.test('format that includes request headers', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm(ml, ':req[Content-Type]');
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
    const cl = clm(ml, ':res[Content-Type]');
    request(
      cl,
      'GET', 'http://blah', 200,
      null,
      { 'Content-Type': 'application/cheese' }
    );

    t.equal(ml.messages[0].message, 'application/cheese');
    t.end();
  });

  batch.test('url token should check originalUrl and url', (t) => {
    const ml = new MockLogger();
    const cl = clm(ml, ':url');
    request(cl, 'GET', null, 200, null, null, null, 'http://cheese');

    t.equal(ml.messages[0].message, 'http://cheese');
    t.end();
  });

  batch.test('log events with custom token', (t) => {
    const ml = new MockLogger();
    ml.level = levels.INFO;
    const cl = clm(ml, {
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
    const cl = clm(ml, {
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

  batch.test('logger event with custom token on post request', (t) => {
    const ml = new MockLogger();
    const options = {
      format: ':method :url :body :baseUrl :xhr',
      tokens: [
        {
          token: ':body',
          replacement: function (req) {
            return (() => (JSON.stringify(req.body)));
          }
        },
        {
          token: ':baseUrl',
          replacement: 'http://meh'
        },
        {
          token: ':xhr',
          replacement: function (req) {
            return req.xhr;
          }
        }
      ]
    };
    const cl = clm(ml, options);
    request(cl, 'POST', 'http://meh', 200, null, null, null, 'http://meh', {
      body: { message: 'hello body' },
      baseUrl: 'http://baseURL',
      xhr: false
    });
    t.type(cl, 'function');
    const messages = ml.messages;
    const jsonBody = JSON.stringify({ message: 'hello body' });
    t.equal(messages[0].message, `POST http://meh ${jsonBody} http://meh false`);
    t.end();
  });

  batch.test('handle weird old node versions where socket contains socket', (t) => {
    const ml = new MockLogger();
    const cl = clm(ml, ':remote-addr');
    const req = new MockRequest(null, 'GET', 'http://blah');
    req.socket = { socket: { remoteAddress: 'this is weird' } };

    const res = new MockResponse();
    cl(req, res, () => {});
    res.writeHead(200, {});
    res.end('chunk', 'encoding');

    t.equal(ml.messages[0].message, 'this is weird');
    t.end();
  });

  batch.end();
});
