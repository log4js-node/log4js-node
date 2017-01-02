'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');
const LoggingEvent = require('../../lib/logger').LoggingEvent;

test('log4js cluster appender', (batch) => {
  batch.test('when in master mode', (t) => {
    const registeredClusterEvents = [];
    const loggingEvents = [];
    let onChildProcessForked;
    let onMasterReceiveChildMessage;

    // Fake cluster module, so no real cluster listeners be really added
    const fakeCluster = {

      on: function (event, callback) {
        registeredClusterEvents.push(event);
        onChildProcessForked = callback;
      },

      isMaster: true,
      isWorker: false,

    };
    const fakeWorker = {
      on: function (event, callback) {
        onMasterReceiveChildMessage = callback;
      },
      process: {
        pid: 123
      },
      id: 'workerid'
    };

    const fakeActualAppender = function (loggingEvent) {
      loggingEvents.push(loggingEvent);
    };

    // Load appender and fake modules in it
    const appenderModule = sandbox.require('../../lib/appenders/clustered', {
      requires: {
        cluster: fakeCluster,
      }
    });

    const masterAppender = appenderModule.appender({
      actualAppenders: [fakeActualAppender, fakeActualAppender, fakeActualAppender],
      appenders: [{}, { category: 'test' }, { category: 'wovs' }]
    });

    // Actual test - log message using masterAppender
    masterAppender(new LoggingEvent('wovs', 'Info', ['masterAppender test']));

    // Simulate a 'fork' event to register the master's message handler on our fake worker.
    onChildProcessForked(fakeWorker);
    // Simulate a cluster message received by the masterAppender.
    const simulatedLoggingEvent = new LoggingEvent(
      'wovs',
      'Error',
      [
        'message deserialization test',
        { stack: 'my wrapped stack' }
      ]
    );
    onMasterReceiveChildMessage({
      type: '::log-message',
      event: JSON.stringify(simulatedLoggingEvent)
    });

    t.test("should register 'fork' event listener on 'cluster'", (assert) => {
      assert.equal(registeredClusterEvents[0], 'fork');
      assert.end();
    });

    t.test('should log using actual appender', (assert) => {
      assert.equal(loggingEvents.length, 4);
      assert.equal(loggingEvents[0].data[0], 'masterAppender test');
      assert.equal(loggingEvents[1].data[0], 'masterAppender test');
      assert.equal(loggingEvents[2].data[0], 'message deserialization test');
      assert.equal(loggingEvents[2].data[1], 'my wrapped stack');
      assert.equal(loggingEvents[3].data[0], 'message deserialization test');
      assert.equal(loggingEvents[3].data[1], 'my wrapped stack');
      assert.end();
    });

    t.end();
  });

  batch.test('when in worker mode', (t) => {
    const registeredProcessEvents = [];

    // Fake cluster module, to fake we're inside a worker process
    const fakeCluster = {

      isMaster: false,
      isWorker: true,

    };

    const fakeProcess = {

      send: function (data) {
        registeredProcessEvents.push(data);
      },
      env: process.env

    };

    // Load appender and fake modules in it
    const appenderModule = sandbox.require('../../lib/appenders/clustered', {
      requires: {
        cluster: fakeCluster,
      },
      globals: {
        process: fakeProcess,
      }
    });

    const workerAppender = appenderModule.appender();

    // Actual test - log message using masterAppender
    workerAppender(new LoggingEvent('wovs', 'Info', ['workerAppender test']));
    workerAppender(new LoggingEvent('wovs', 'Info', [new Error('Error test')]));

    t.test('worker appender should call process.send', (assert) => {
      assert.equal(registeredProcessEvents[0].type, '::log-message');
      assert.equal(
        JSON.parse(registeredProcessEvents[0].event).data[0],
        'workerAppender test'
      );
      assert.end();
    });

    t.test('worker should serialize an Error correctly', (assert) => {
      assert.equal(registeredProcessEvents[1].type, '::log-message');
      assert.ok(JSON.parse(registeredProcessEvents[1].event).data[0].stack);
      const actual = JSON.parse(registeredProcessEvents[1].event).data[0].stack;
      assert.match(actual, /^Error: Error test/);
      assert.end();
    });

    t.end();
  });

  batch.end();
});
