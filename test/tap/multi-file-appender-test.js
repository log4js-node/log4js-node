const process = require('process');
const { test } = require('tap');
const debug = require('debug');
const fs = require('fs');
const sandbox = require('@log4js-node/sandboxed-module');
const log4js = require('../../lib/log4js');

const removeFiles = async (filenames) => {
  if (!Array.isArray(filenames)) filenames = [filenames];
  const promises = filenames.map((filename) => fs.promises.unlink(filename));
  await Promise.allSettled(promises);
};

test('multiFile appender', (batch) => {
  batch.test(
    'should write to multiple files based on the loggingEvent property',
    (t) => {
      t.teardown(async () => {
        await removeFiles(['logs/A.log', 'logs/B.log']);
      });
      log4js.configure({
        appenders: {
          multi: {
            type: 'multiFile',
            base: 'logs/',
            property: 'categoryName',
            extension: '.log',
          },
        },
        categories: { default: { appenders: ['multi'], level: 'info' } },
      });
      const loggerA = log4js.getLogger('A');
      const loggerB = log4js.getLogger('B');
      loggerA.info('I am in logger A');
      loggerB.info('I am in logger B');
      log4js.shutdown(() => {
        t.match(fs.readFileSync('logs/A.log', 'utf-8'), 'I am in logger A');
        t.match(fs.readFileSync('logs/B.log', 'utf-8'), 'I am in logger B');
        t.end();
      });
    }
  );

  batch.test(
    'should write to multiple files based on loggingEvent.context properties',
    (t) => {
      t.teardown(async () => {
        await removeFiles(['logs/C.log', 'logs/D.log']);
      });
      log4js.configure({
        appenders: {
          multi: {
            type: 'multiFile',
            base: 'logs/',
            property: 'label',
            extension: '.log',
          },
        },
        categories: { default: { appenders: ['multi'], level: 'info' } },
      });
      const loggerC = log4js.getLogger('cheese');
      const loggerD = log4js.getLogger('biscuits');
      loggerC.addContext('label', 'C');
      loggerD.addContext('label', 'D');
      loggerC.info('I am in logger C');
      loggerD.info('I am in logger D');
      log4js.shutdown(() => {
        t.match(fs.readFileSync('logs/C.log', 'utf-8'), 'I am in logger C');
        t.match(fs.readFileSync('logs/D.log', 'utf-8'), 'I am in logger D');
        t.end();
      });
    }
  );

  batch.test('should close file after timeout', (t) => {
    /* checking that the file is closed after a timeout is done by looking at the debug logs
      since detecting file locks with node.js is platform specific.
     */
    const debugWasEnabled = debug.enabled('log4js:multiFile');
    const debugLogs = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = (string, encoding, fd) => {
      debugLogs.push(string);
      if (debugWasEnabled) {
        originalWrite.apply(process.stderr, [string, encoding, fd]);
      }
    };
    const originalNamespace = debug.disable();
    debug.enable(`${originalNamespace}, log4js:multiFile`);

    t.teardown(async () => {
      await new Promise((resolve) => {
        log4js.shutdown(resolve);
      });
      await removeFiles('logs/C.log');
      process.stderr.write = originalWrite;
      debug.enable(originalNamespace);
    });

    const timeoutMs = 25;
    log4js.configure({
      appenders: {
        multi: {
          type: 'multiFile',
          base: 'logs/',
          property: 'label',
          extension: '.log',
          timeout: timeoutMs,
        },
      },
      categories: { default: { appenders: ['multi'], level: 'info' } },
    });
    const loggerC = log4js.getLogger('cheese');
    loggerC.addContext('label', 'C');
    loggerC.info('I am in logger C');
    setTimeout(() => {
      t.match(
        debugLogs[debugLogs.length - 1],
        `C not used for > ${timeoutMs} ms => close`,
        '(timeout1) should have closed'
      );
      t.end();
    }, timeoutMs * 1 + 50); // add a 50 ms delay
  });

  batch.test('should close file safely after timeout', (t) => {
    const error = new Error('fileAppender shutdown error');
    const sandboxedLog4js = sandbox.require('../../lib/log4js', {
      requires: {
        './appenders/file': {
          configure(config, layouts) {
            const fileAppender = require('../../lib/appenders/file').configure(
              config,
              layouts
            );
            const originalShutdown = fileAppender.shutdown;
            fileAppender.shutdown = function (complete) {
              const onCallback = function () {
                complete(error);
              };
              originalShutdown(onCallback);
            };
            return fileAppender;
          },
        },
        debug,
      },
    });
    /* checking that the file is closed after a timeout is done by looking at the debug logs
      since detecting file locks with node.js is platform specific.
     */
    const debugWasEnabled = debug.enabled('log4js:multiFile');
    const debugLogs = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = (string, encoding, fd) => {
      debugLogs.push(string);
      if (debugWasEnabled) {
        originalWrite.apply(process.stderr, [string, encoding, fd]);
      }
    };
    const originalNamespace = debug.disable();
    debug.enable(`${originalNamespace}, log4js:multiFile`);

    t.teardown(async () => {
      await new Promise((resolve) => {
        sandboxedLog4js.shutdown(resolve);
      });
      await removeFiles('logs/C.log');
      process.stderr.write = originalWrite;
      debug.enable(originalNamespace);
    });

    const timeoutMs = 25;
    sandboxedLog4js.configure({
      appenders: {
        multi: {
          type: 'multiFile',
          base: 'logs/',
          property: 'label',
          extension: '.log',
          timeout: timeoutMs,
        },
      },
      categories: { default: { appenders: ['multi'], level: 'info' } },
    });
    const loggerC = sandboxedLog4js.getLogger('cheese');
    loggerC.addContext('label', 'C');
    loggerC.info('I am in logger C');
    setTimeout(() => {
      t.match(
        debugLogs[debugLogs.length - 2],
        `C not used for > ${timeoutMs} ms => close`,
        '(timeout1) should have closed'
      );
      t.match(
        debugLogs[debugLogs.length - 1],
        `ignore error on file shutdown: ${error.message}`,
        'safely shutdown'
      );
      t.end();
    }, timeoutMs * 1 + 50); // add a 50 ms delay
  });

  batch.test('should close file after extended timeout', (t) => {
    /* checking that the file is closed after a timeout is done by looking at the debug logs
      since detecting file locks with node.js is platform specific.
     */
    const debugWasEnabled = debug.enabled('log4js:multiFile');
    const debugLogs = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = (string, encoding, fd) => {
      debugLogs.push(string);
      if (debugWasEnabled) {
        originalWrite.apply(process.stderr, [string, encoding, fd]);
      }
    };
    const originalNamespace = debug.disable();
    debug.enable(`${originalNamespace}, log4js:multiFile`);

    t.teardown(async () => {
      await new Promise((resolve) => {
        log4js.shutdown(resolve);
      });
      await removeFiles('logs/D.log');
      process.stderr.write = originalWrite;
      debug.enable(originalNamespace);
    });

    const timeoutMs = 100;
    log4js.configure({
      appenders: {
        multi: {
          type: 'multiFile',
          base: 'logs/',
          property: 'label',
          extension: '.log',
          timeout: timeoutMs,
        },
      },
      categories: { default: { appenders: ['multi'], level: 'info' } },
    });
    const loggerD = log4js.getLogger('cheese');
    loggerD.addContext('label', 'D');
    loggerD.info('I am in logger D');
    setTimeout(() => {
      loggerD.info('extending activity!');
      t.match(
        debugLogs[debugLogs.length - 1],
        'D extending activity',
        'should have extended'
      );
    }, timeoutMs / 2);
    setTimeout(() => {
      t.notOk(
        debugLogs.some(
          (s) => s.indexOf(`D not used for > ${timeoutMs} ms => close`) !== -1
        ),
        '(timeout1) should not have closed'
      );
    }, timeoutMs * 1 + 50); // add a 50 ms delay
    setTimeout(() => {
      t.match(
        debugLogs[debugLogs.length - 1],
        `D not used for > ${timeoutMs} ms => close`,
        '(timeout2) should have closed'
      );
      t.end();
    }, timeoutMs * 2 + 50); // add a 50 ms delay
  });

  batch.test('should clear interval for active timers on shutdown', (t) => {
    /* checking that the file is closed after a timeout is done by looking at the debug logs
      since detecting file locks with node.js is platform specific.
     */
    const debugWasEnabled = debug.enabled('log4js:multiFile');
    const debugLogs = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = (string, encoding, fd) => {
      debugLogs.push(string);
      if (debugWasEnabled) {
        originalWrite.apply(process.stderr, [string, encoding, fd]);
      }
    };
    const originalNamespace = debug.disable();
    debug.enable(`${originalNamespace}, log4js:multiFile`);

    t.teardown(async () => {
      await removeFiles('logs/D.log');
      process.stderr.write = originalWrite;
      debug.enable(originalNamespace);
    });

    const timeoutMs = 100;
    log4js.configure({
      appenders: {
        multi: {
          type: 'multiFile',
          base: 'logs/',
          property: 'label',
          extension: '.log',
          timeout: timeoutMs,
        },
      },
      categories: { default: { appenders: ['multi'], level: 'info' } },
    });
    const loggerD = log4js.getLogger('cheese');
    loggerD.addContext('label', 'D');
    loggerD.info('I am in logger D');
    log4js.shutdown(() => {
      t.notOk(
        debugLogs.some(
          (s) => s.indexOf(`D not used for > ${timeoutMs} ms => close`) !== -1
        ),
        'should not have closed'
      );
      t.ok(
        debugLogs.some((s) => s.indexOf('clearing timer for  D') !== -1),
        'should have cleared timers'
      );
      t.match(
        debugLogs[debugLogs.length - 1],
        'calling shutdown for  D',
        'should have called shutdown'
      );
      t.end();
    });
  });

  batch.test(
    'should fail silently if loggingEvent property has no value',
    (t) => {
      t.teardown(async () => {
        await removeFiles('logs/E.log');
      });
      log4js.configure({
        appenders: {
          multi: {
            type: 'multiFile',
            base: 'logs/',
            property: 'label',
            extension: '.log',
          },
        },
        categories: { default: { appenders: ['multi'], level: 'info' } },
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
        t.match(contents, 'I am in logger E');
        t.notMatch(contents, 'I am not in logger E');
        t.notMatch(contents, 'I am also not in logger E');
        t.end();
      });
    }
  );

  batch.test('should pass options to rolling file stream', (t) => {
    t.teardown(async () => {
      await removeFiles(['logs/F.log', 'logs/F.log.1', 'logs/F.log.2']);
    });
    log4js.configure({
      appenders: {
        multi: {
          type: 'multiFile',
          base: 'logs/',
          property: 'label',
          extension: '.log',
          maxLogSize: 30,
          backups: 2,
          layout: { type: 'messagePassThrough' },
        },
      },
      categories: { default: { appenders: ['multi'], level: 'info' } },
    });
    const loggerF = log4js.getLogger();
    loggerF.addContext('label', 'F');
    loggerF.info('Being in logger F is the best.');
    loggerF.info('I am also in logger F, awesome');
    loggerF.info('I am in logger F');
    log4js.shutdown(() => {
      let contents = fs.readFileSync('logs/F.log', 'utf-8');
      t.match(contents, 'I am in logger F');
      contents = fs.readFileSync('logs/F.log.1', 'utf-8');
      t.match(contents, 'I am also in logger F');
      contents = fs.readFileSync('logs/F.log.2', 'utf-8');
      t.match(contents, 'Being in logger F is the best');
      t.end();
    });
  });

  batch.test('should inherit config from category hierarchy', (t) => {
    t.teardown(async () => {
      await removeFiles('logs/test.someTest.log');
    });
    log4js.configure({
      appenders: {
        out: { type: 'stdout' },
        test: {
          type: 'multiFile',
          base: 'logs/',
          property: 'categoryName',
          extension: '.log',
        },
      },
      categories: {
        default: { appenders: ['out'], level: 'info' },
        test: { appenders: ['test'], level: 'debug' },
      },
    });

    const testLogger = log4js.getLogger('test.someTest');
    testLogger.debug('This should go to the file');
    log4js.shutdown(() => {
      const contents = fs.readFileSync('logs/test.someTest.log', 'utf-8');
      t.match(contents, 'This should go to the file');
      t.end();
    });
  });

  batch.test('should shutdown safely even if it is not used', (t) => {
    log4js.configure({
      appenders: {
        out: { type: 'stdout' },
        test: {
          type: 'multiFile',
          base: 'logs/',
          property: 'categoryName',
          extension: '.log',
        },
      },
      categories: {
        default: { appenders: ['out'], level: 'info' },
        test: { appenders: ['test'], level: 'debug' },
      },
    });
    log4js.shutdown(() => {
      t.ok('callback is called');
      t.end();
    });
  });

  batch.teardown(async () => {
    try {
      const files = fs.readdirSync('logs');
      await removeFiles(files.map((filename) => `logs/${filename}`));
      fs.rmdirSync('logs');
    } catch (e) {
      // doesn't matter
    }
  });

  batch.end();
});
