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

test('log4js', (batch) => {
  batch.test('getBufferedLogger', (t) => {
    const log4js = require('../../lib/log4js');
    log4js.clearAppenders();
    const logger = log4js.getBufferedLogger('tests');

    t.test('should take a category and return a logger', (assert) => {
      assert.equal(logger.target.category, 'tests');
      assert.type(logger.flush, 'function');
      assert.type(logger.trace, 'function');
      assert.type(logger.debug, 'function');
      assert.type(logger.info, 'function');
      assert.type(logger.warn, 'function');
      assert.type(logger.error, 'function');
      assert.type(logger.fatal, 'function');
      assert.end();
    });

    t.test('cache events', (assert) => {
      const events = [];
      logger.target.setLevel('TRACE');
      logger.target.addListener('log', (logEvent) => {
        events.push(logEvent);
      });
      logger.debug('Debug event');
      logger.trace('Trace event 1');
      logger.trace('Trace event 2');
      logger.warn('Warning event');
      logger.error('Aargh!', new Error('Pants are on fire!'));
      logger.error(
        'Simulated CouchDB problem',
        { err: 127, cause: 'incendiary underwear' }
      );

      assert.equal(events.length, 0, 'should not emit log events if .flush() is not called.');
      logger.flush();
      assert.equal(events.length, 6, 'should emit log events when .flush() is called.');
      assert.end();
    });
    t.end();
  });


  batch.test('getLogger', (t) => {
    const log4js = require('../../lib/log4js');
    log4js.clearAppenders();
    const logger = log4js.getLogger('tests');
    logger.setLevel('DEBUG');

    t.test('should take a category and return a logger', (assert) => {
      assert.equal(logger.category, 'tests');
      assert.equal(logger.level.toString(), 'DEBUG');
      assert.type(logger.debug, 'function');
      assert.type(logger.info, 'function');
      assert.type(logger.warn, 'function');
      assert.type(logger.error, 'function');
      assert.type(logger.fatal, 'function');
      assert.end();
    });

    t.test('log events', (assert) => {
      const events = [];
      logger.addListener('log', (logEvent) => {
        events.push(logEvent);
      });
      logger.debug('Debug event');
      logger.trace('Trace event 1');
      logger.trace('Trace event 2');
      logger.warn('Warning event');
      logger.error('Aargh!', new Error('Pants are on fire!'));
      logger.error('Simulated CouchDB problem', { err: 127, cause: 'incendiary underwear' });

      assert.equal(events[0].level.toString(), 'DEBUG');
      assert.equal(events[0].data[0], 'Debug event');
      assert.type(events[0].startTime, 'Date');

      assert.equal(events.length, 4, 'should not emit events of a lower level');
      assert.equal(events[1].level.toString(), 'WARN');

      assert.type(events[2].data[1], 'Error', 'should include the error if passed in');
      assert.equal(events[2].data[1].message, 'Pants are on fire!');
      assert.end();
    });

    t.end();
  });

  batch.test('when shutdown is called', (t) => {
    const events = {
      appenderShutdownCalled: false
    };

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          './appenders/file': {
            name: 'file',
            appender: function () {
            },
            configure: function () {
              return function () {
              };
            },
            shutdown: function (cb) {
              events.appenderShutdownCalled = true;
              cb();
            }
          }
        }
      }
    );

    const config = {
      appenders: [
        {
          type: 'file',
          filename: 'cheesy-wotsits.log',
          maxLogSize: 1024,
          backups: 3
        }
      ]
    };

    log4js.configure(config);
    log4js.shutdown(() => {
      // Re-enable log writing so other tests that use logger are not
      // affected.
      require('../../lib/logger').enableAllLogWrites();
      t.ok(events.appenderShutdownCalled, 'should invoke appender shutdowns');
      t.end();
    });
  });

  // 'invalid configuration': {
  //   'should throw an exception': function () {
  //     assert.throws(() => {
  //       // todo: here is weird, it's not ideal test
  //       require('../../lib/log4js').configure({ type: 'invalid' });
  //     });
  //   }
  // },

  batch.test('configuration when passed as object', (t) => {
    let appenderConfig;

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          './appenders/file': {
            name: 'file',
            appender: function () {
            },
            configure: function (configuration) {
              appenderConfig = configuration;
              return function () {
              };
            }
          }
        }
      }
    );

    const config = {
      appenders: [
        {
          type: 'file',
          filename: 'cheesy-wotsits.log',
          maxLogSize: 1024,
          backups: 3
        }
      ]
    };

    log4js.configure(config);
    t.equal(appenderConfig.filename, 'cheesy-wotsits.log', 'should be passed to appender config');
    t.end();
  });

  batch.test('configuration that causes an error', (t) => {
    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          './appenders/file': {
            name: 'file',
            appender: function () {
            },
            configure: function () {
              throw new Error('oh noes');
            }
          }
        }
      }
    );

    const config = {
      appenders: [
        {
          type: 'file',
          filename: 'cheesy-wotsits.log',
          maxLogSize: 1024,
          backups: 3
        }
      ]
    };

    try {
      log4js.configure(config);
    } catch (e) {
      t.ok(e.message.includes('log4js configuration problem for'));
      t.end();
    }
  });

  batch.test('configuration when passed as filename', (t) => {
    let appenderConfig;
    let configFilename;

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          fs: {
            statSync: function () {
              return { mtime: Date.now() };
            },
            readFileSync: function (filename) {
              configFilename = filename;
              return JSON.stringify({
                appenders: [
                  {
                    type: 'file',
                    filename: 'whatever.log'
                  }
                ]
              });
            },
            readdirSync: function () {
              return ['file'];
            }
          },
          './appenders/file': {
            name: 'file',
            appender: function () {
            },
            configure: function (configuration) {
              appenderConfig = configuration;
              return function () {
              };
            }
          }
        }
      }
    );

    log4js.configure('/path/to/cheese.json');
    t.equal(configFilename, '/path/to/cheese.json', 'should read the config from a file');
    t.equal(appenderConfig.filename, 'whatever.log', 'should pass config to appender');
    t.end();
  });

  batch.test('with no appenders defined', (t) => {
    const fakeStdoutAppender = {
      name: 'stdout',
      appender: function () {
        return function (evt) {
          t.equal(evt.data[0], 'This is a test', 'should default to the stdout appender');
          t.end();
        };
      },
      configure: function () {
        return fakeStdoutAppender.appender();
      }
    };

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          './appenders/stdout': fakeStdoutAppender
        }
      }
    );

    const logger = log4js.getLogger('some-logger');
    logger.debug('This is a test');
    // assert is back at the top, in the fake stdout appender
  });

  batch.test('addAppender', (t) => {
    const log4js = require('../../lib/log4js');
    log4js.clearAppenders();

    t.test('without a category', (assert) => {
      let appenderEvent;

      const appender = function (evt) {
        appenderEvent = evt;
      };

      const logger = log4js.getLogger('tests');

      log4js.addAppender(appender);
      logger.debug('This is a test');

      assert.equal(
        appenderEvent.data[0],
        'This is a test',
        'should register the function as a listener for all loggers'
      );
      assert.equal(appenderEvent.categoryName, 'tests');
      assert.equal(appenderEvent.level.toString(), 'DEBUG');
      assert.end();
    });

    t.test('if an appender for a category is defined', (assert) => {
      let otherEvent;
      let appenderEvent;

      log4js.addAppender((evt) => {
        appenderEvent = evt;
      });
      log4js.addAppender((evt) => {
        otherEvent = evt;
      }, 'cheese');

      const cheeseLogger = log4js.getLogger('cheese');
      cheeseLogger.debug('This is a test');

      assert.same(appenderEvent, otherEvent, 'should register for that category');
      assert.equal(otherEvent.data[0], 'This is a test');
      assert.equal(otherEvent.categoryName, 'cheese');

      otherEvent = undefined;
      appenderEvent = undefined;
      log4js.getLogger('pants').debug('this should not be propagated to otherEvent');
      assert.notOk(otherEvent);
      assert.equal(appenderEvent.data[0], 'this should not be propagated to otherEvent');
      assert.end();
    });

    t.test('with a category', (assert) => {
      let appenderEvent;

      const appender = function (evt) {
        appenderEvent = evt;
      };

      const logger = log4js.getLogger('tests');

      log4js.addAppender(appender, 'tests');
      logger.debug('this is a category test');
      assert.equal(
        appenderEvent.data[0],
        'this is a category test',
        'should only register the function as a listener for that category'
      );

      appenderEvent = undefined;
      log4js.getLogger('some other category').debug('Cheese');
      assert.notOk(appenderEvent);
      assert.end();
    });

    t.test('with multiple categories', (assert) => {
      let appenderEvent;

      const appender = function (evt) {
        appenderEvent = evt;
      };

      const logger = log4js.getLogger('tests');

      log4js.addAppender(appender, 'tests', 'biscuits');

      logger.debug('this is a test');
      assert.equal(
        appenderEvent.data[0],
        'this is a test',
        'should register the function as a listener for all the categories'
      );

      appenderEvent = undefined;
      const otherLogger = log4js.getLogger('biscuits');
      otherLogger.debug('mmm... garibaldis');
      assert.equal(appenderEvent.data[0], 'mmm... garibaldis');

      appenderEvent = undefined;

      log4js.getLogger('something else').debug('pants');
      assert.notOk(appenderEvent);
      assert.end();
    });

    t.test('should register the function when the list of categories is an array', (assert) => {
      let appenderEvent;

      const appender = function (evt) {
        appenderEvent = evt;
      };

      log4js.addAppender(appender, ['tests', 'pants']);

      log4js.getLogger('tests').debug('this is a test');
      assert.equal(appenderEvent.data[0], 'this is a test');

      appenderEvent = undefined;

      log4js.getLogger('pants').debug('big pants');
      assert.equal(appenderEvent.data[0], 'big pants');

      appenderEvent = undefined;

      log4js.getLogger('something else').debug('pants');
      assert.notOk(appenderEvent);
      assert.end();
    });

    t.end();
  });

  batch.test('default setup', (t) => {
    const appenderEvents = [];

    const fakeStdout = {
      name: 'stdout',
      appender: function () {
        return function (evt) {
          appenderEvents.push(evt);
        };
      },
      configure: function () {
        return fakeStdout.appender();
      }
    };

    const globalConsole = {
      log: function () {
      }
    };

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          './appenders/stdout': fakeStdout
        },
        globals: {
          console: globalConsole
        }
      }
    );

    const logger = log4js.getLogger('a-test');

    logger.debug('this is a test');
    globalConsole.log('this should not be logged');

    t.equal(appenderEvents[0].data[0], 'this is a test', 'should configure a stdout appender');
    t.equal(appenderEvents.length, 1, 'should not replace console.log with log4js version');
    t.end();
  });

  batch.test('console', (t) => {
    const setup = setupConsoleTest();

    t.test('when replaceConsole called', (assert) => {
      setup.log4js.replaceConsole();

      setup.fakeConsole.log('Some debug message someone put in a module');
      setup.fakeConsole.debug('Some debug');
      setup.fakeConsole.error('An error');
      setup.fakeConsole.info('some info');
      setup.fakeConsole.warn('a warning');

      setup.fakeConsole.log('cheese (%s) and biscuits (%s)', 'gouda', 'garibaldis');
      setup.fakeConsole.log({ lumpy: 'tapioca' });
      setup.fakeConsole.log('count %d', 123);
      setup.fakeConsole.log('stringify %j', { lumpy: 'tapioca' });

      const logEvents = setup.logEvents;
      assert.equal(logEvents.length, 9);
      assert.equal(logEvents[0].data[0], 'Some debug message someone put in a module');
      assert.equal(logEvents[0].level.toString(), 'INFO');
      assert.equal(logEvents[1].data[0], 'Some debug');
      assert.equal(logEvents[1].level.toString(), 'DEBUG');
      assert.equal(logEvents[2].data[0], 'An error');
      assert.equal(logEvents[2].level.toString(), 'ERROR');
      assert.equal(logEvents[3].data[0], 'some info');
      assert.equal(logEvents[3].level.toString(), 'INFO');
      assert.equal(logEvents[4].data[0], 'a warning');
      assert.equal(logEvents[4].level.toString(), 'WARN');
      assert.equal(logEvents[5].data[0], 'cheese (%s) and biscuits (%s)');
      assert.equal(logEvents[5].data[1], 'gouda');
      assert.equal(logEvents[5].data[2], 'garibaldis');
      assert.end();
    });

    t.test('when turned off', (assert) => {
      setup.log4js.restoreConsole();
      try {
        setup.fakeConsole.log('This should cause the error described in the setup');
      } catch (e) {
        assert.type(e, 'Error', 'should call the original console methods');
        assert.equal(e.message, 'this should not be called.');
        assert.end();
      }
    });
    t.end();
  });

  batch.test('console configuration', (t) => {
    const setup = setupConsoleTest();

    t.test('when disabled', (assert) => {
      setup.log4js.replaceConsole();
      setup.log4js.configure({ replaceConsole: false });
      try {
        setup.fakeConsole.log('This should cause the error described in the setup');
      } catch (e) {
        assert.type(e, 'Error');
        assert.equal(e.message, 'this should not be called.');
        assert.end();
      }
    });

    t.test('when enabled', (assert) => {
      setup.log4js.restoreConsole();
      setup.log4js.configure({ replaceConsole: true });
      // log4js.configure clears all appenders
      setup.log4js.addAppender((evt) => {
        setup.logEvents.push(evt);
      });

      setup.fakeConsole.debug('Some debug');

      const logEvents = setup.logEvents;
      assert.equal(logEvents.length, 1);
      assert.equal(logEvents[0].level.toString(), 'DEBUG');
      assert.equal(logEvents[0].data[0], 'Some debug');
      assert.end();
    });

    t.end();
  });

  batch.test('configuration persistence', (t) => {
    let logEvent;
    const firstLog4js = require('../../lib/log4js');

    firstLog4js.clearAppenders();
    firstLog4js.addAppender((evt) => {
      logEvent = evt;
    });

    const secondLog4js = require('../../lib/log4js');
    secondLog4js.getLogger().info('This should go to the appender defined in firstLog4js');

    t.equal(logEvent.data[0], 'This should go to the appender defined in firstLog4js');
    t.end();
  });

  batch.test('getDefaultLogger', (t) => {
    const logger = require('../../lib/log4js').getDefaultLogger();

    t.test('should return a logger', (assert) => {
      assert.ok(logger.info);
      assert.ok(logger.debug);
      assert.ok(logger.error);
      assert.end();
    });
    t.end();
  });

  batch.end();
});
