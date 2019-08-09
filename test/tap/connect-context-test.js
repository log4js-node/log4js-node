const { test } = require("tap");
const EE = require("events").EventEmitter;
const levels = require("../../lib/levels");

class MockLogger {
  constructor() {
    this.level = levels.TRACE;
    this.context = {};
    this.contexts = [];
  }

  log() {
    this.contexts.push(Object.assign({}, this.context));
  }

  isLevelEnabled(level) {
    return level.isGreaterThanOrEqualTo(this.level);
  }

  addContext(key, value) {
    this.context[key] = value;
  }

  removeContext(key) {
    delete this.context[key];
  }
}

function MockRequest(remoteAddr, method, originalUrl) {
  this.socket = { remoteAddress: remoteAddr };
  this.originalUrl = originalUrl;
  this.method = method;
  this.httpVersionMajor = "5";
  this.httpVersionMinor = "0";
  this.headers = {};
}

class MockResponse extends EE {
  constructor(code) {
    super();
    this.statusCode = code;
    this.cachedHeaders = {};
  }

  end() {
    this.emit("finish");
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

test("log4js connect logger", batch => {
  const clm = require("../../lib/connect-logger");

  batch.test("with context config", t => {
    const ml = new MockLogger();
    const cl = clm(ml, { context: true });

    t.beforeEach(done => {
      ml.contexts = [];
      done();
    });

    t.test("response should be included in context", assert => {
      const { contexts } = ml;
      const req = new MockRequest(
        "my.remote.addr",
        "GET",
        "http://url/hoge.png"
      ); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end("chunk", "encoding");

      assert.type(contexts, "Array");
      assert.equal(contexts.length, 1);
      assert.type(contexts[0].res, MockResponse);
      assert.end();
    });

    t.end();
  });

  batch.test("without context config", t => {
    const ml = new MockLogger();
    const cl = clm(ml, {});

    t.beforeEach(done => {
      ml.contexts = [];
      done();
    });

    t.test("response should not be included in context", assert => {
      const { contexts } = ml;
      const req = new MockRequest(
        "my.remote.addr",
        "GET",
        "http://url/hoge.png"
      ); // not gif
      const res = new MockResponse(200);
      cl(req, res, () => {});
      res.end("chunk", "encoding");

      assert.type(contexts, "Array");
      assert.equal(contexts.length, 1);
      assert.type(contexts[0].res, undefined);
      assert.end();
    });

    t.end();
  });

  batch.end();
});
