const test = require('tap').test;

test('TCP Server', (batch) => {
  batch.test('should listen for TCP messages and re-send via process.send');
  batch.end();
});
