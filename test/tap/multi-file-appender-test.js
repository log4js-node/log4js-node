'use strict';

const test = require('tap').test;
const log4js = require('../../lib/log4js');
const fs = require('fs');

test('multiFile appender', (batch) => {
  batch.test('should write to multiple files based on the loggingEvent property', (t) => {
    log4js.configure({
      appenders: {
        multi: {
          type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log'
        }
      },
      categories: { default: { appenders: ['multi'], level: 'info' } }
    });
    const loggerA = log4js.getLogger('A');
    const loggerB = log4js.getLogger('B');
    loggerA.info('I am in logger A');
    loggerB.info('I am in logger B');
    log4js.shutdown(() => {
      t.contains(fs.readFileSync('logs/A.log', 'utf-8'), 'I am in logger A');
      t.contains(fs.readFileSync('logs/B.log', 'utf-8'), 'I am in logger B');
      t.end();
    });
  });

  batch.test('should write to multiple files based on loggingEvent.context properties', (t) => {
    log4js.configure({
      appenders: {
        multi: {
          type: 'multiFile', base: 'logs/', property: 'label', extension: '.log'
        }
      },
      categories: { default: { appenders: ['multi'], level: 'info' } }
    });
    const loggerC = log4js.getLogger('cheese');
    const loggerD = log4js.getLogger('biscuits');
    loggerC.addContext('label', 'C');
    loggerD.addContext('label', 'D');
    loggerC.info('I am in logger C');
    loggerD.info('I am in logger D');
    log4js.shutdown(() => {
      t.contains(fs.readFileSync('logs/C.log', 'utf-8'), 'I am in logger C');
      t.contains(fs.readFileSync('logs/D.log', 'utf-8'), 'I am in logger D');
      t.end();
    });
  });

  batch.test('should fail silently if loggingEvent property has no value', (t) => {
    log4js.configure({
      appenders: {
        multi: {
          type: 'multiFile', base: 'logs/', property: 'label', extension: '.log'
        }
      },
      categories: { default: { appenders: ['multi'], level: 'info' } }
    });
    const loggerE = log4js.getLogger();
    loggerE.addContext('label', 'E');
    loggerE.info('I am in logger E');
    loggerE.removeContext('label');
    loggerE.info('I am not in logger E');
    loggerE.addContext('label', null);
    loggerE.info('I am also not in logger E');
    log4js.shutdown(() => {
      const contents = fs.readFileSync('logs/E.log', 'utf-8');
      t.contains(contents, 'I am in logger E');
      t.notMatch(contents, 'I am not in logger E');
      t.notMatch(contents, 'I am also not in logger E');
      t.end();
    });
  });

  batch.test('should pass options to rolling file stream', (t) => {
    log4js.configure({
      appenders: {
        multi: {
          type: 'multiFile',
          base: 'logs/',
          property: 'label',
          extension: '.log',
          maxLogSize: 61,
          backups: 2
        }
      },
      categories: { default: { appenders: ['multi'], level: 'info' } }
    });
    const loggerF = log4js.getLogger();
    loggerF.addContext('label', 'F');
    loggerF.info('Being in logger F is the best');
    loggerF.info('I am also in logger F');
    loggerF.info('I am in logger F');
    log4js.shutdown(() => {
      let contents = fs.readFileSync('logs/F.log', 'utf-8');
      t.contains(contents, 'I am in logger F');
      contents = fs.readFileSync('logs/F.log.1', 'utf-8');
      t.contains(contents, 'I am also in logger F');
      contents = fs.readFileSync('logs/F.log.2', 'utf-8');
      t.contains(contents, 'Being in logger F is the best');
      t.end();
    });
  });

  batch.test('should inherit config from category hierarchy', (t) => {
    log4js.configure({
      appenders: {
        out: { type: 'stdout' },
        test: {
          type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log'
        }
      },
      categories: {
        default: { appenders: ['out'], level: 'info' },
        test: { appenders: ['test'], level: 'debug' }
      }
    });

    const testLogger = log4js.getLogger('test.someTest');
    testLogger.debug('This should go to the file');
    log4js.shutdown(() => {
      const contents = fs.readFileSync('logs/test.someTest.log', 'utf-8');
      t.contains(contents, 'This should go to the file');
      t.end();
    });
  });

  batch.end();
});
