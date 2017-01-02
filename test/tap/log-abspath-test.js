'use strict';

const test = require('tap').test;
const path = require('path');
const sandbox = require('sandboxed-module');

test('log4js-abspath', (batch) => {
  batch.test('options', (t) => {
    let appenderOptions;

    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        singleOnly: true,
        requires: {
          './appenders/fake': {
            name: 'fake',
            appender: function () {
            },
            configure: function (configuration, options) {
              appenderOptions = options;
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
          type: 'fake',
          filename: 'cheesy-wotsits.log'
        }
      ]
    };

    log4js.configure(config, {
      cwd: '/absolute/path/to'
    });
    t.test('should be passed to appenders during configuration', (assert) => {
      assert.equal(appenderOptions.cwd, '/absolute/path/to');
      assert.end();
    });
    t.end();
  });

  batch.test('file appender', (t) => {
    let fileOpened;

    const fileAppender = sandbox.require(
      '../../lib/appenders/file',
      {
        requires: {
          streamroller: {
            RollingFileStream: function (file) {
              fileOpened = file;
              return {
                on: function () {
                },
                end: function () {
                }
              };
            }
          }
        }
      }
    );

    fileAppender.configure(
      {
        filename: 'whatever.log',
        maxLogSize: 10
      },
      { cwd: '/absolute/path/to' }
    );

    t.test('should prepend options.cwd to config.filename', (assert) => {
      const expected = path.sep + path.join('absolute', 'path', 'to', 'whatever.log');
      assert.equal(fileOpened, expected);
      assert.end();
    });
    t.end();
  });

  batch.end();
});
