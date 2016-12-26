'use strict';

const test = require('tap').test;
const path = require('path');
const sandbox = require('sandboxed-module');

test('Reload configuration shutdown hook', (t) => {
  let timerId;

  const log4js = sandbox.require(
    '../../lib/log4js',
    {
      globals: {
        clearInterval: function (id) {
          timerId = id;
        },
        setInterval: function () {
          return '1234';
        }
      }
    }
  );

  log4js.configure(
    path.join(__dirname, 'test-config.json'),
    { reloadSecs: 30 }
  );

  t.plan(1);
  log4js.shutdown(() => {
    t.equal(timerId, '1234', 'Shutdown should clear the reload timer');
    t.end();
  });
});
