'use strict';

const test = require('tap').test;
const log4js = require('../../lib/log4js');
const net = require('net');

test('multiprocess appender shutdown (master)', { timeout: 2000 }, (t) => {
  log4js.configure({
    appenders: {
      stdout: { type: 'stdout' },
      multi: {
        type: 'multiprocess',
        mode: 'master',
        loggerPort: 12345,
        appender: 'stdout'
      }
    },
    categories: { default: { appenders: ['multi'], level: 'debug' } }
  });

  setTimeout(() => {
    log4js.shutdown(() => {
      net.connect({ port: 12345 }, () => {
        t.fail('connection should not still work');
        t.end();
      }).on('error', (err) => {
        t.ok(err, 'we got a connection error');
        t.end();
      });
    });
  }, 500);
});
