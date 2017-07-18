'use strict';

const test = require('tap').test;

test('PM2 Cluster support', (batch) => {
  batch.test('should listen for messages if pm2 support enabled');
  batch.test('should write messages on NODE_APP_INSTANCE - 0');
  batch.test('should send messages with the correct format');
  batch.end();
});
