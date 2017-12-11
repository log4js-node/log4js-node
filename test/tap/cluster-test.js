'use strict';

const test = require('tap').test;
const cluster = require('cluster');
const log4js = require('../../lib/log4js');
const recorder = require('../../lib/appenders/recording');

log4js.configure({
  appenders: {
    vcr: { type: 'recording' }
  },
  categories: { default: { appenders: ['vcr'], level: 'debug' } }
});

if (cluster.isMaster) {
  cluster.fork();

  const masterLogger = log4js.getLogger('master');
  const masterPid = process.pid;
  masterLogger.info('this is master');

  let workerLevel;
  cluster.on('message', (worker, message) => {
    if (worker.type || worker.topic) {
      message = worker;
    }
    if (message.type && message.type === '::testing') {
      workerLevel = message.level;
    }
  });

  cluster.on('exit', (worker) => {
    const workerPid = worker.process.pid;
    const logEvents = recorder.replay();

    test('cluster master', (batch) => {
      batch.test('events should be logged', (t) => {
        t.equal(logEvents.length, 3);
        t.equal(logEvents[0].categoryName, 'master');
        t.equal(logEvents[0].pid, masterPid);
        t.equal(logEvents[1].categoryName, 'worker');
        t.equal(logEvents[1].pid, workerPid);
        t.type(logEvents[1].data[1], 'Error');
        t.contains(logEvents[1].data[1].stack, 'Error: oh dear');
        t.type(logEvents[1].data[2], 'object');
        t.type(logEvents[1].data[2].me, 'object');
        t.equal(logEvents[2].categoryName, 'log4js');
        t.equal(logEvents[2].level.toString(), 'ERROR');
        t.equal(logEvents[2].data[0], 'Unable to parse log:');
        t.end();
      });

      batch.end();
    });

    test('cluster worker', (batch) => {
      batch.test('logger should get correct config', (t) => {
        t.equal(workerLevel, 'DEBUG');
        t.end();
      });
      batch.end();
    });
  });
} else {
  const workerLogger = log4js.getLogger('worker');
  const circle = {};
  circle.me = circle;
  workerLogger.info('this is worker', new Error('oh dear'), circle);
  // can't run the test in the worker, things get weird
  process.send({
    type: '::testing',
    level: workerLogger.level.toString()
  });
  // test sending a badly-formed log message
  process.send({ topic: 'log4js:message', data: { cheese: 'gouda' } });
  cluster.worker.disconnect();
}
