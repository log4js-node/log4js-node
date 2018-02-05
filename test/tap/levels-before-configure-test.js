const test = require('tap').test;

test('Accessing things setup in configure before configure is called', (batch) => {
  batch.test('should work', (t) => {
    const log4js = require('../../lib/log4js');
    t.ok(log4js.levels);
    t.ok(log4js.connectLogger);
    t.end();
  });

  batch.end();
});
