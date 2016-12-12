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

vows.describe('log4js connect logger').addBatch({
  getConnectLoggerModule: {
    topic: function () {
      const clm = require('../../lib/connect-logger');
      return clm;
    },

    'should return a "connect logger" factory': function (clm) {
      assert.isObject(clm);
    },

    'nolog String': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cl = clm.connectLogger(ml, { nolog: '\\.gif' });
        return { cl: cl, ml: ml };
      },

      'check unmatch url request': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.png'); // not gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
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
          messages.pop();
        }
      },

      'check match url request': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.gif'); // gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
          }, 10);
        },
        'check message': function (messages) {
          assert.isArray(messages);
          assert.equal(messages.length, 0);
        }
      }
    },

    'nolog Strings': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cl = clm.connectLogger(ml, { nolog: '\\.gif|\\.jpe?g' });
        return { cl: cl, ml: ml };
      },

      'check unmatch url request (png)': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.png'); // not gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
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
          messages.pop();
        }
      },

      'check match url request (gif)': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.gif'); // gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
          }, 10);
        },
        'check message': function (messages) {
          assert.isArray(messages);
          assert.equal(messages.length, 0);
        }
      },
      'check match url request (jpeg)': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.jpeg'); // gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
          }, 10);
        },
        'check message': function (messages) {
          assert.isArray(messages);
          assert.equal(messages.length, 0);
        }
      }
    },
    'nolog Array<String>': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cl = clm.connectLogger(ml, { nolog: ['\\.gif', '\\.jpe?g'] });
        return { cl: cl, ml: ml };
      },

      'check unmatch url request (png)': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.png'); // not gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
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
          messages.pop();
        }
      },

      'check match url request (gif)': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.gif'); // gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
          }, 10);
        },
        'check message': function (messages) {
          assert.isArray(messages);
          assert.equal(messages.length, 0);
        }
      },

      'check match url request (jpeg)': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.jpeg'); // gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
          }, 10);
        },
        'check message': function (messages) {
          assert.isArray(messages);
          assert.equal(messages.length, 0);
        }
      },
    },
    'nolog RegExp': {
      topic: function (clm) {
        const ml = new MockLogger();
        const cl = clm.connectLogger(ml, { nolog: /\.gif|\.jpe?g/ });
        return { cl: cl, ml: ml };
      },

      'check unmatch url request (png)': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.png'); // not gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
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
          messages.pop();
        }
      },

      'check match url request (gif)': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.gif'); // gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
          }, 10);
        },
        'check message': function (messages) {
          assert.isArray(messages);
          assert.equal(messages.length, 0);
        }
      },

      'check match url request (jpeg)': {
        topic: function (d) {
          const req = new MockRequest('my.remote.addr', 'GET', 'http://url/hoge.jpeg'); // gif
          const res = new MockResponse(200);
          const cb = this.callback;
          d.cl(req, res, () => {
          });
          res.end('chunk', 'encoding');
          setTimeout(() => {
            cb(null, d.ml.messages);
          }, 10);
        },
        'check message': function (messages) {
          assert.isArray(messages);
          assert.equal(messages.length, 0);
        }
      }
    }
  }

}).export(module);
