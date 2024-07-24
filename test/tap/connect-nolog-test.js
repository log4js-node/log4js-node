/* eslint max-classes-per-file: ["error", 2] */

const { test } = require('tap');
const EE = require('events').EventEmitter;
const levels = require('../../lib/levels');

class MockLogger {
  constructor() {
    this.messages = [];
    this.level = levels.TRACE;

    this.log = function (level, message) {
      this.messages.push({ level, message });
    };

    this.isLevelEnabled = function (level) {
      return level.isGreaterThanOrEqualTo(this.level);
    };
  }
}

function MockRequest(remoteAddr, method, originalUrl) {
  this.socket = { remoteAddress: remoteAddr };
  this.originalUrl = originalUrl;
  this.method = method;
  this.httpVersionMajor = '5';
  this.httpVersionMinor = '0';
  this.headers = {};
}

class MockResponse extends EE {
  constructor(code) {
    super();
    this.statusCode = code;
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
    return this;
  }
}

test('log4js connect logger', (batch) => {
  const clm = require('../../lib/connect-logger');

  batch.test('with nolog config', (t) => {
    const ml = new MockLogger();
    const cl = clm(ml, { nolog: '\\.gif' });

    t.beforeEach((done) => {
      ml.messages = [];
      if (typeof done === 'function') {
        done();
      }
    });

    t.test('check unmatch url request', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.png'
      ); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.type(messages, 'Array');
      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.match(messages[0].message, 'GET');
      assert.match(messages[0].message, 'http://url');
      assert.match(messages[0].message, 'my.remote.addr');
      assert.match(messages[0].message, '200');
      assert.end();
    });

    t.test('check match url request', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.gif'
      ); // gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.type(messages, 'Array');
      assert.equal(messages.length, 0);
      assert.end();
    });
    t.end();
  });

  batch.test('nolog Strings', (t) => {
    const ml = new MockLogger();
    const cl = clm(ml, { nolog: '\\.gif|\\.jpe?g' });

    t.beforeEach((done) => {
      ml.messages = [];
      if (typeof done === 'function') {
        done();
      }
    });

    t.test('check unmatch url request (png)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.png'
      ); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.match(messages[0].message, 'GET');
      assert.match(messages[0].message, 'http://url');
      assert.match(messages[0].message, 'my.remote.addr');
      assert.match(messages[0].message, '200');
      assert.end();
    });

    t.test('check match url request (gif)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.gif'
      );
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.test('check match url request (jpeg)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.jpeg'
      );
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.end();
  });

  batch.test('nolog Array<String>', (t) => {
    const ml = new MockLogger();
    const cl = clm(ml, { nolog: ['\\.gif', '\\.jpe?g'] });

    t.beforeEach((done) => {
      ml.messages = [];
      if (typeof done === 'function') {
        done();
      }
    });

    t.test('check unmatch url request (png)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.png'
      ); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.match(messages[0].message, 'GET');
      assert.match(messages[0].message, 'http://url');
      assert.match(messages[0].message, 'my.remote.addr');
      assert.match(messages[0].message, '200');
      assert.end();
    });

    t.test('check match url request (gif)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.gif'
      ); // gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.test('check match url request (jpeg)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.jpeg'
      ); // gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.end();
  });

  batch.test('nolog RegExp', (t) => {
    const ml = new MockLogger();
    const cl = clm(ml, { nolog: /\.gif|\.jpe?g/ });

    t.beforeEach((done) => {
      ml.messages = [];
      if (typeof done === 'function') {
        done();
      }
    });

    t.test('check unmatch url request (png)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.png'
      ); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.match(messages[0].message, 'GET');
      assert.match(messages[0].message, 'http://url');
      assert.match(messages[0].message, 'my.remote.addr');
      assert.match(messages[0].message, '200');
      assert.end();
    });

    t.test('check match url request (gif)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.gif'
      ); // gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.test('check match url request (jpeg)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.jpeg'
      ); // gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.end();
  });

  batch.test('nolog Array<RegExp>', (t) => {
    const ml = new MockLogger();
    const cl = clm(ml, { nolog: [/\.gif/, /\.jpe?g/] });

    t.beforeEach((done) => {
      ml.messages = [];
      if (typeof done === 'function') {
        done();
      }
    });

    t.test('check unmatch url request (png)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.png'
      ); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.match(messages[0].message, 'GET');
      assert.match(messages[0].message, 'http://url');
      assert.match(messages[0].message, 'my.remote.addr');
      assert.match(messages[0].message, '200');
      assert.end();
    });

    t.test('check match url request (gif)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.gif'
      ); // gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.test('check match url request (jpeg)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest(
        'my.remote.addr',
        'GET',
        'http://url/hoge.jpeg'
      ); // gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.end();
  });

  batch.test('nolog function', (t) => {
    const ml = new MockLogger();
    const cl = clm(ml, {
      nolog: (_req, res) =>
        res.getHeader('content-type') === 'image/png' || res.statusCode < 400,
    });

    t.beforeEach((done) => {
      ml.messages = [];
      if (typeof done === 'function') {
        done();
      }
    });

    t.test('check unmatch function return (statusCode < 400)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/log');
      const res = new MockResponse(500);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.match(messages[0].message, 'GET');
      assert.match(messages[0].message, 'http://url');
      assert.match(messages[0].message, 'my.remote.addr');
      assert.match(messages[0].message, '500');
      assert.end();
    });

    t.test('check match function return (statusCode >= 400)', (assert) => {
      const { messages } = ml;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/nolog');
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.test(
      'check match function server response content-type header',
      (assert) => {
        const { messages } = ml;
        const req = new MockRequest(
          'my.remote.addr',
          'GET',
          'http://url/nolog'
        );
        const res = new MockResponse(500);
        res.on('finish', () => {
          res.setHeader('content-type', 'image/png');
        });
        cl(req, res, () => {});
        res.end('chunk', 'encoding');

        assert.equal(messages.length, 0);
        assert.end();
      }
    );

    t.end();
  });

  batch.end();
});
