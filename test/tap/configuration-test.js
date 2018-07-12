'use strict';

const test = require('tap').test;
const sandbox = require('@log4js-node/sandboxed-module');

const modulePath = 'some/path/to/mylog4js.json';
const pathsChecked = [];

let fakeFS = {};
let dependencies;
let fileRead;

test('log4js configure', (batch) => {
  batch.beforeEach((done) => {
    fileRead = 0;

    fakeFS = {
      config: {
        appenders: {
          console: {
            type: 'console',
            layout: { type: 'messagePassThrough' }
          }
        },
        categories: {
          default: {
            appenders: ['console'],
            level: 'INFO'
          }
        }
      },
      readdirSync: dir => require('fs').readdirSync(dir),
      readFileSync: (file, encoding) => {
        fileRead += 1;
        batch.type(file, 'string');
        batch.equal(file, modulePath);
        batch.equal(encoding, 'utf8');
        return JSON.stringify(fakeFS.config);
      },
      statSync: (path) => {
        pathsChecked.push(path);
        if (path === modulePath) {
          return { mtime: new Date() };
        }
        throw new Error('no such file');
      }
    };

    dependencies = {
      requires: {
        fs: fakeFS
      }
    };

    done();
  });

  batch.test('when configuration file loaded via LOG4JS_CONFIG env variable', (t) => {
    process.env.LOG4JS_CONFIG = 'some/path/to/mylog4js.json';

    const log4js = sandbox.require('../../lib/log4js', dependencies);

    log4js.getLogger('test-logger');
    t.equal(fileRead, 1, 'should load the specified local config file');

    delete process.env.LOG4JS_CONFIG;

    t.end();
  });

  batch.test('when configuration is set via configure() method call, return the log4js object', (t) => {
    const log4js = sandbox.require('../../lib/log4js', dependencies).configure(fakeFS.config);
    t.type(log4js, 'object', 'Configure method call should return the log4js object!');

    const log = log4js.getLogger('daemon');
    t.type(log, 'object', 'log4js object, returned by configure(...) method should be able to create log object.');
    t.type(log.info, 'function');

    t.end();
  });

  batch.end();
});
