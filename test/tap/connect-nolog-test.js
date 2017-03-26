'use strict';

const test = require('tap').test;
const EE = require('events').EventEmitter;
const levels = require('../../lib/levels')();

class MockLogger {
  constructor() {
    this.messages = [];
    this.level = levels.TRACE;

    this.log = function (level, message) {
      this.messages.push({ level: level, message: message });
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
  constructor(statusCode) {
    super();
    const r = this;
    this.statusCode = statusCode;

    this.end = function () {
      r.emit('finish');
    };
  }
}

test('log4js connect logger', (batch) => {
  const clm = require('../../lib/connect-logger')(levels);

  batch.test('with nolog config', (t) => {
    const ml = new MockLogger();
    const cl = clm.connectLogger(ml, { nolog: '\\.gif' });

    t.beforeEach((done) => { ml.messages = []; done(); });

    t.test('check unmatch url request', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.png'); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => { });
      res.end('chunk', 'encoding');

      assert.type(messages, 'Array');
      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.include(messages[0].message, 'GET');
      assert.include(messages[0].message, 'http://url');
      assert.include(messages[0].message, 'my.remote.addr');
      assert.include(messages[0].message, '200');
      assert.end();
    });

    t.test('check match url request', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.gif'); // gif
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
    const cl = clm.connectLogger(ml, { nolog: '\\.gif|\\.jpe?g' });

    t.beforeEach((done) => { ml.messages = []; done(); });

    t.test('check unmatch url request (png)', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.png'); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => { });
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.include(messages[0].message, 'GET');
      assert.include(messages[0].message, 'http://url');
      assert.include(messages[0].message, 'my.remote.addr');
      assert.include(messages[0].message, '200');
      assert.end();
    });

    t.test('check match url request (gif)', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.gif');
      const res = new MockResponse(200);
      cl(req, res, () => { });
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.test('check match url request (jpeg)', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.jpeg');
      const res = new MockResponse(200);
      cl(req, res, () => { });
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.end();
  });

  batch.test('nolog Array<String>', (t) => {
    const ml = new MockLogger();
    const cl = clm.connectLogger(ml, { nolog: ['\\.gif', '\\.jpe?g'] });

    t.beforeEach((done) => { ml.messages = []; done(); });

    t.test('check unmatch url request (png)', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.png'); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => { });
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.include(messages[0].message, 'GET');
      assert.include(messages[0].message, 'http://url');
      assert.include(messages[0].message, 'my.remote.addr');
      assert.include(messages[0].message, '200');
      assert.end();
    });

    t.test('check match url request (gif)', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.gif'); // gif
      const res = new MockResponse(200);
      cl(req, res, () => { });
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.test('check match url request (jpeg)', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.jpeg'); // gif
      const res = new MockResponse(200);
      cl(req, res, () => { });
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.end();
  });

  batch.test('nolog RegExp', (t) => {
    const ml = new MockLogger();
    const cl = clm.connectLogger(ml, { nolog: /\.gif|\.jpe?g/ });

    t.beforeEach((done) => { ml.messages = []; done(); });

    t.test('check unmatch url request (png)', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.png'); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => { });
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 1);
      assert.ok(levels.INFO.isEqualTo(messages[0].level));
      assert.include(messages[0].message, 'GET');
      assert.include(messages[0].message, 'http://url');
      assert.include(messages[0].message, 'my.remote.addr');
      assert.include(messages[0].message, '200');
      assert.end();
    });

    t.test('check match url request (gif)', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.gif'); // gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.test('check match url request (jpeg)', (assert) => {
      const messages = ml.messages;
      const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.jpeg'); // gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end('chunk', 'encoding');

      assert.equal(messages.length, 0);
      assert.end();
    });

    t.end();
  });

  batch.end();
});
