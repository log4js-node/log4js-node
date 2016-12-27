'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');

function makeTestAppender() {
  return {
    configure: function (config, options) {
      this.configureCalled = true;
      this.config = config;
      this.options = options;
      return this.appender();
    },
    appender: function () {
      const self = this;
      return function (logEvt) {
        self.logEvt = logEvt;
      };
    }
  };
}

test('log4js configure', (batch) => {
  batch.test('when appenders specified by type', (t) => {
    const testAppender = makeTestAppender();
    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        singleOnly: true,
        requires: {
          './appenders/cheese': testAppender
        }
      }
    );

    log4js.configure(
      {
        appenders: [
          { type: 'cheese', flavour: 'gouda' }
        ]
      },
      { pants: 'yes' }
    );
    t.ok(testAppender.configureCalled, 'should load appender');
    t.equal(testAppender.config.flavour, 'gouda', 'should pass config to appender');
    t.equal(testAppender.options.pants, 'yes', 'should pass log4js options to appender');
    t.end();
  });

  batch.test('when core appender loaded via loadAppender', (t) => {
    const testAppender = makeTestAppender();
    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        singleOnly: true,
        requires: { './appenders/cheese': testAppender }
      }
    );

    log4js.loadAppender('cheese');

    t.ok(log4js.appenders.cheese, 'should load appender from ../../lib/appenders');
    t.type(log4js.appenderMakers.cheese, 'function', 'should add appender configure function to appenderMakers');
    t.end();
  });

  batch.test('when appender in node_modules loaded via loadAppender', (t) => {
    const testAppender = makeTestAppender();
    const log4js = sandbox.require(
      '../../lib/log4js',
      {
        singleOnly: true,
        requires: { 'some/other/external': testAppender }
      }
    );

    log4js.loadAppender('some/other/external');
    t.ok(log4js.appenders['some/other/external'], 'should load appender via require');
    t.type(
      log4js.appenderMakers['some/other/external'], 'function',
      'should add appender configure function to appenderMakers'
    );
    t.end();
  });

  batch.test('when appender object loaded via loadAppender', (t) => {
    const testAppender = makeTestAppender();
    const log4js = sandbox.require('../../lib/log4js');

    log4js.loadAppender('some/other/external', testAppender);

    t.ok(log4js.appenders['some/other/external'], 'should load appender with provided object');
    t.type(
      log4js.appenderMakers['some/other/external'], 'function',
      'should add appender configure function to appenderMakers'
    );
    t.end();
  });

  batch.test('when configuration file loaded via LOG4JS_CONFIG env variable', (t) => {
    process.env.LOG4JS_CONFIG = 'some/path/to/mylog4js.json';
    let fileRead = 0;
    const modulePath = 'some/path/to/mylog4js.json';
    const pathsChecked = [];
    const mtime = new Date();

    const fakeFS = {
      config: {
        appenders: [{ type: 'console', layout: { type: 'messagePassThrough' } }],
        levels: { 'a-test': 'INFO' }
      },
      readdirSync: function (dir) {
        return require('fs').readdirSync(dir);
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

    sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          fs: fakeFS,
        }
      }
    );

    delete process.env.LOG4JS_CONFIG;

    t.equal(fileRead, 1, 'should load the specified local config file');
    t.end();
  });

  batch.end();
});
