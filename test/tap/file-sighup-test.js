const { test } = require('tap');
const path = require('path');
const fs = require('fs');
const sandbox = require('@log4js-node/sandboxed-module');

const removeFiles = async (filenames) => {
  if (!Array.isArray(filenames)) filenames = [filenames];
  const promises = filenames.map((filename) => fs.promises.unlink(filename));
  await Promise.allSettled(promises);
};

test('file appender single SIGHUP handler', (t) => {
  const initialListeners = process.listenerCount('SIGHUP');

  let warning;
  const originalListener = process.listeners('warning')[
    process.listeners('warning').length - 1
  ];
  const warningListener = (error) => {
    if (
      error.type === 'SIGHUP' &&
      error.name === 'MaxListenersExceededWarning'
    ) {
      warning = error;
      return;
    }
    originalListener(error);
  };
  process.off('warning', originalListener);
  process.on('warning', warningListener);

  const config = {
    appenders: {},
    categories: {
      default: { appenders: [], level: 'debug' },
    },
  };

  // create 11 appenders to make nodejs warn for >10 max listeners
  const numOfAppenders = 11;
  for (let i = 1; i <= numOfAppenders; i++) {
    config.appenders[`app${i}`] = {
      type: 'file',
      filename: path.join(__dirname, `file${i}.log`),
    };
    config.categories.default.appenders.push(`app${i}`);
  }

  const log4js = require('../../lib/log4js');
  log4js.configure(config);

  t.teardown(async () => {
    // next event loop so that past warnings will not be printed
    setImmediate(() => {
      process.off('warning', warningListener);
      process.on('warning', originalListener);
    });

    await new Promise((resolve) => {
      log4js.shutdown(resolve);
    });

    const filenames = Object.values(config.appenders).map(
      (appender) => appender.filename
    );
    await removeFiles(filenames);
  });

  t.plan(2);
  // next event loop to allow event emitter/listener to happen
  setImmediate(() => {
    t.notOk(warning, 'should not have MaxListenersExceededWarning for SIGHUP');
    t.equal(
      process.listenerCount('SIGHUP') - initialListeners,
      1,
      'should be 1 SIGHUP listener'
    );
    t.end();
  });
});

test('file appender SIGHUP', (t) => {
  let closeCalled = 0;
  let openCalled = 0;

  sandbox
    .require('../../lib/appenders/file', {
      requires: {
        streamroller: {
          RollingFileStream: class RollingFileStream {
            constructor() {
              openCalled++;
              this.ended = false;
            }

            on() {
              this.dummy = 'easier than turning off lint rule';
            }

            end(cb) {
              this.ended = true;
              closeCalled++;
              cb();
            }

            write() {
              if (this.ended) {
                throw new Error('write after end');
              }
              return true;
            }
          },
        },
      },
    })
    .configure(
      { type: 'file', filename: 'sighup-test-file' },
      {
        basicLayout() {
          return 'whatever';
        },
      }
    );

  process.emit('SIGHUP', 'SIGHUP', 1);

  t.plan(2);
  setTimeout(() => {
    t.equal(openCalled, 2, 'open should be called twice');
    t.equal(closeCalled, 1, 'close should be called once');
    t.end();
  }, 100);
});

test('file appender SIGHUP handler leak', (t) => {
  const log4js = require('../../lib/log4js');
  const initialListeners = process.listenerCount('SIGHUP');
  log4js.configure({
    appenders: {
      file: { type: 'file', filename: 'test.log' },
    },
    categories: { default: { appenders: ['file'], level: 'info' } },
  });
  t.teardown(async () => {
    await removeFiles('test.log');
  });
  t.plan(2);
  t.equal(process.listenerCount('SIGHUP'), initialListeners + 1);
  log4js.shutdown(() => {
    t.equal(process.listenerCount('SIGHUP'), initialListeners);
    t.end();
  });
});
