'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');
const recording = require('../../lib/appenders/recording');

test('log4js', (batch) => {
  batch.test('getLogger', (t) => {
    const log4js = require('../../lib/log4js');
    log4js.configure({
      appenders: { recorder: { type: 'recording' } },
      categories: { default: { appenders: ['recorder'], level: 'DEBUG' } }
    });
    const logger = log4js.getLogger('tests');

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
      recording.reset();

      logger.debug('Debug event');
      logger.trace('Trace event 1');
      logger.trace('Trace event 2');
      logger.warn('Warning event');
      logger.error('Aargh!', new Error('Pants are on fire!'));
      logger.error('Simulated CouchDB problem', { err: 127, cause: 'incendiary underwear' });

      const events = recording.replay();

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
            configure: function () {
              function thing() {
                return null;
              }

              thing.shutdown = function (cb) {
                events.appenderShutdownCalled = true;
                cb();
              };
              return thing;
            }
          }
        }
      }
    );

    const config = {
      appenders: {
        file: {
          type: 'file',
          filename: 'cheesy-wotsits.log',
          maxLogSize: 1024,
          backups: 3
        }
      },
      categories: { default: { appenders: ['file'], level: 'DEBUG' } }
    };

    log4js.configure(config);
    log4js.shutdown(() => {
      t.ok(events.appenderShutdownCalled, 'should invoke appender shutdowns');
      t.end();
    });
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
                appenders: {
                  file: {
                    type: 'file',
                    filename: 'whatever.log'
                  }
                },
                categories: { default: { appenders: ['file'], level: 'DEBUG' } }
              });
            },
            readdirSync: function () {
              return ['file'];
            }
          },
          './appenders/file': {
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

  batch.test('with configure not called', (t) => {
    const fakeStdoutAppender = {
      configure: function () {
        return function (evt) {
          fakeStdoutAppender.evt = evt;
        };
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
    t.notOk(fakeStdoutAppender.evt, 'should not log anything');
    t.end();
  });

  batch.test('configuration persistence', (t) => {
    const firstLog4js = require('../../lib/log4js');
    firstLog4js.configure({
      appenders: { recorder: { type: 'recording' } },
      categories: { default: { appenders: ['recorder'], level: 'DEBUG' } }
    });
    recording.reset();

    const secondLog4js = require('../../lib/log4js');
    secondLog4js.getLogger().info('This should go to the appender defined in firstLog4js');

    t.equal(recording.replay()[0].data[0], 'This should go to the appender defined in firstLog4js');
    t.end();
  });

  batch.end();
});
