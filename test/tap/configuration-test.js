'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');

test('log4js configure', (batch) => {
  batch.test('when configuration file loaded via LOG4JS_CONFIG env variable', (t) => {
    process.env.LOG4JS_CONFIG = 'some/path/to/mylog4js.json';
    let fileRead = 0;
    const modulePath = 'some/path/to/mylog4js.json';
    const pathsChecked = [];
    const mtime = new Date();

    const fakeFS = {
      config: {
        appenders: {
          console: { type: 'console', layout: { type: 'messagePassThrough' } }
        },
        categories: { default: { appenders: ['console'], level: 'INFO' } }
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
