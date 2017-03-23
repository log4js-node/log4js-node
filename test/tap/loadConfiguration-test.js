'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');

function setupConsoleTest() {
  const fakeConsole = {};
  const logEvents = [];

  ['trace', 'debug', 'log', 'info', 'warn', 'error'].forEach((fn) => {
    fakeConsole[fn] = function () {
      throw new Error('this should not be called.');
    };
  });

  const log4js = sandbox.require(
    '../../lib/log4js',
    {
      globals: {
        console: fakeConsole
      }
    }
  );

  log4js.clearAppenders();
  log4js.addAppender((evt) => {
    logEvents.push(evt);
  });

  return { log4js: log4js, logEvents: logEvents, fakeConsole: fakeConsole };
}

test('load configuration', (batch) => {
  batch.test('with non existent file', (t) => {
    const pathsChecked = [];
    const logEvents = [];
    const modulePath = 'path/to/log4js.json';

    let attemptedLoad = false;

    const fakeFS = {
      lastMtime: Date.now(),
      config: {
        appenders: [
          { type: 'console', layout: { type: 'messagePassThrough' } }
        ],
        //levels: { 'log4js': 'ALL' }
      },
      readFileSync: function (file, encoding) {
        attemptedLoad = true;
        throw new Error('no such file');
      },
      statSync: function (path) {
        throw new Error('no such file');
      }
    };

    const fakeConsole = {
      name: 'console',
      appender: function () {
        return function (evt) {
          logEvents.push(evt);
        };
      },
      configure: function () {
        return fakeConsole.appender();
      }
    };

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          fs: fakeFS,
          './appenders/stdout': fakeConsole
        },
        globals: {
          console: fakeConsole,
        }
      }
    );

    //try to load nonexistent file
    log4js.configure('path/to/log4js.json');

    t.equal(attemptedLoad,true,'attempt to load configuration file.');

    t.test('configure result', (assert) => {
      assert.equal(logEvents.length,1,"failure message logged to internal logger");
      assert.match(logEvents[0].data[0],/^Failed to open configuration/i, "failure message indicates Failed to open configuration");
      assert.match(logEvents[0].level.levelStr,"ERROR", "failure messaged logged as error");
      assert.end();
    })

    t.end();
  });

  batch.test('with config file that isnt json parseable', (t) => {
    const pathsChecked = [];
    const logEvents = [];
    const modulePath = 'path/to/log4js.json';

    let attemptedLoad = false;

    const fakeFS = {
      lastMtime: Date.now(),
      config: {
        appenders: [
          { type: 'console', layout: { type: 'messagePassThrough' } }
        ],
        //levels: { 'log4js': 'ALL' }
      },
      readFileSync: function (file, encoding) {
        attemptedLoad = true;
        t.equal(file, modulePath);
        t.equal(encoding, 'utf8');
        if(file === modulePath) {
          return '}}notparseablejson{{';
        }
        throw new Error('no such file');
      },
      statSync: function (path) {
        throw new Error('no such file');
      }
    };

    const fakeConsole = {
      name: 'console',
      appender: function () {
        return function (evt) {
          console.log('called append');
          logEvents.push(evt);
        };
      },
      configure: function () {
        console.log('called configure');
        return fakeConsole.appender();
      }
    };

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          fs: fakeFS,
          './appenders/stdout': fakeConsole
        },
        globals: {
          console: fakeConsole,
        }
      }
    );

    //try to load nonexistent file
    log4js.configure('path/to/log4js.json');

    t.equal(attemptedLoad,true,'attempt to load configuration file.');

    t.test('configure result', (assert) => {
      assert.equal(logEvents.length,1,"failure message logged to internal logger");
      assert.match(logEvents[0].data[0],/^Failed to parse configuration/i, "failure message indicates Failed to parse configuration");
      assert.match(logEvents[0].level.levelStr,"ERROR", "failure messaged logged as error");
      assert.end();
    })

    t.end();
  });

  batch.end();
});
