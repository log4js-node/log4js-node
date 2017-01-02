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

test('reload configuration', (batch) => {
  batch.test('with config file changing', (t) => {
    const pathsChecked = [];
    const logEvents = [];
    const modulePath = 'path/to/log4js.json';

    const fakeFS = {
      lastMtime: Date.now(),
      config: {
        appenders: [
          { type: 'console', layout: { type: 'messagePassThrough' } }
        ],
        levels: { 'a-test': 'INFO' }
      },
      readFileSync: function (file, encoding) {
        t.equal(file, modulePath);
        t.equal(encoding, 'utf8');
        return JSON.stringify(fakeFS.config);
      },
      statSync: function (path) {
        pathsChecked.push(path);
        if (path === modulePath) {
          fakeFS.lastMtime += 1;
          return { mtime: new Date(fakeFS.lastMtime) };
        }
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

    let setIntervalCallback;

    const fakeSetInterval = function (cb) {
      setIntervalCallback = cb;
    };

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          fs: fakeFS,
          './appenders/console': fakeConsole
        },
        globals: {
          console: fakeConsole,
          setInterval: fakeSetInterval,
        }
      }
    );

    log4js.configure('path/to/log4js.json', { reloadSecs: 30 });
    const logger = log4js.getLogger('a-test');
    logger.info('info1');
    logger.debug('debug2 - should be ignored');
    fakeFS.config.levels['a-test'] = 'DEBUG';
    setIntervalCallback();
    logger.info('info3');
    logger.debug('debug4');

    t.test('should configure log4js from first log4js.json found', (assert) => {
      assert.equal(logEvents[0].data[0], 'info1');
      assert.equal(logEvents[1].data[0], 'info3');
      assert.equal(logEvents[2].data[0], 'debug4');
      assert.equal(logEvents.length, 3);
      assert.end();
    });
    t.end();
  });

  batch.test('with config file staying the same', (t) => {
    const pathsChecked = [];
    let fileRead = 0;
    const logEvents = [];
    const modulePath = require('path').normalize(`${__dirname}/../../lib/log4js.json`);
    const mtime = new Date();

    const fakeFS = {
      config: {
        appenders: [
          { type: 'console', layout: { type: 'messagePassThrough' } }
        ],
        levels: { 'a-test': 'INFO' }
      },
      readFileSync: function (file, encoding) {
        fileRead += 1;
        t.type(file, 'string');
        t.equal(file, modulePath);
        t.equal(encoding, 'utf8');
        return JSON.stringify(fakeFS.config);
      },
      statSync: function (path) {
        pathsChecked.push(path);
        if (path === modulePath) {
          return { mtime: mtime };
        }
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

    let setIntervalCallback;

    const fakeSetInterval = function (cb) {
      setIntervalCallback = cb;
    };

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          fs: fakeFS,
          './appenders/console': fakeConsole
        },
        globals: {
          console: fakeConsole,
          setInterval: fakeSetInterval,
        }
      }
    );

    log4js.configure(modulePath, { reloadSecs: 3 });
    const logger = log4js.getLogger('a-test');
    logger.info('info1');
    logger.debug('debug2 - should be ignored');
    setIntervalCallback();
    logger.info('info3');
    logger.debug('debug4');

    t.equal(fileRead, 1, 'should only read the configuration file once');
    t.test('should configure log4js from first log4js.json found', (assert) => {
      assert.equal(logEvents.length, 2);
      assert.equal(logEvents[0].data[0], 'info1');
      assert.equal(logEvents[1].data[0], 'info3');
      assert.end();
    });
    t.end();
  });

  batch.test('when config file is removed', (t) => {
    let fileRead = 0;
    const logEvents = [];
    const modulePath = require('path').normalize(`${__dirname}/../../lib/log4js.json`);

    const fakeFS = {
      config: {
        appenders: [
          { type: 'console', layout: { type: 'messagePassThrough' } }
        ],
        levels: { 'a-test': 'INFO' }
      },
      readFileSync: function (file, encoding) {
        fileRead += 1;
        t.type(file, 'string');
        t.equal(file, modulePath);
        t.equal(encoding, 'utf8');
        return JSON.stringify(fakeFS.config);
      },
      statSync: function () {
        this.statSync = function () {
          throw new Error('no such file');
        };
        return { mtime: new Date() };
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

    let setIntervalCallback;

    const fakeSetInterval = function (cb) {
      setIntervalCallback = cb;
    };

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          fs: fakeFS,
          './appenders/console': fakeConsole
        },
        globals: {
          console: fakeConsole,
          setInterval: fakeSetInterval,
        }
      }
    );

    log4js.configure(modulePath, { reloadSecs: 3 });
    const logger = log4js.getLogger('a-test');
    logger.info('info1');
    logger.debug('debug2 - should be ignored');
    setIntervalCallback();
    logger.info('info3');
    logger.debug('debug4');

    t.equal(fileRead, 1, 'should only read the configuration file once');
    t.test('should not clear configuration when config file not found', (assert) => {
      assert.equal(logEvents.length, 3);
      assert.equal(logEvents[0].data[0], 'info1');
      assert.equal(logEvents[1].level.toString(), 'WARN');
      assert.include(logEvents[1].data[0], 'Failed to load configuration file');
      assert.equal(logEvents[2].data[0], 'info3');
      assert.end();
    });
    t.end();
  });

  batch.test('when passed an object', (t) => {
    const setup = setupConsoleTest();
    setup.log4js.configure({}, { reloadSecs: 30 });
    const events = setup.logEvents;

    t.test('should log a warning', (assert) => {
      assert.equal(events[0].level.toString(), 'WARN');
      assert.equal(
        events[0].data[0],
        'Ignoring configuration reload parameter for "object" configuration.'
      );
      assert.end();
    });
    t.end();
  });

  batch.test('when called twice with reload options', (t) => {
    const modulePath = require('path').normalize(`${__dirname}/../../lib/log4js.json`);

    const fakeFS = {
      readFileSync: function () {
        return JSON.stringify({});
      },
      statSync: function () {
        return { mtime: new Date() };
      }
    };

    const fakeConsole = {
      name: 'console',
      appender: function () {
        return function () {
        };
      },
      configure: function () {
        return fakeConsole.appender();
      }
    };

    let setIntervalCallback; // eslint-disable-line
    let intervalCleared = false;
    let clearedId;

    const fakeSetInterval = function (cb) {
      setIntervalCallback = cb;
      return 1234;
    };

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          fs: fakeFS,
          './appenders/console': fakeConsole
        },
        globals: {
          console: fakeConsole,
          setInterval: fakeSetInterval,
          clearInterval: function (interval) {
            intervalCleared = true;
            clearedId = interval;
          }
        }
      }
    );

    log4js.configure(modulePath, { reloadSecs: 3 });
    log4js.configure(modulePath, { reloadSecs: 15 });

    t.test('should clear the previous interval', (assert) => {
      assert.ok(intervalCleared);
      assert.equal(clearedId, 1234);
      assert.end();
    });
    t.end();
  });

  batch.end();
});
