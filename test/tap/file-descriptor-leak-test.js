const { test } = require('tap');
const fs = require('fs');
const path = require('path');
const log4js = require('../../lib/log4js');

const removeFiles = async (filenames) => {
  if (!Array.isArray(filenames)) filenames = [filenames];
  const promises = filenames.map((filename) => fs.promises.unlink(filename));
  await Promise.allSettled(promises);
};

// no file descriptors on Windows, so don't run the tests
if (process.platform !== 'win32') {
  test('multiple log4js configure fd leak test', (batch) => {
    const config = {
      appenders: {},
      categories: {
        default: { appenders: [], level: 'debug' },
      },
    };

    // create 11 appenders
    const numOfAppenders = 11;
    for (let i = 1; i <= numOfAppenders; i++) {
      config.appenders[`app${i}`] = {
        type: 'file',
        filename: path.join(__dirname, `file${i}.log`),
      };
      config.categories.default.appenders.push(`app${i}`);
    }

    const initialFd = fs.readdirSync('/proc/self/fd').length;
    let loadedFd;

    batch.test(
      'initial log4js configure to increase file descriptor count',
      (t) => {
        log4js.configure(config);

        // wait for the file system to catch up
        setTimeout(() => {
          loadedFd = fs.readdirSync('/proc/self/fd').length;
          t.equal(
            loadedFd,
            initialFd + numOfAppenders,
            `file descriptor count should increase by ${numOfAppenders} after 1st configure() call`
          );
          t.end();
        }, 250);
      }
    );

    batch.test(
      'repeated log4js configure to not increase file descriptor count',
      (t) => {
        log4js.configure(config);
        log4js.configure(config);
        log4js.configure(config);

        // wait for the file system to catch up
        setTimeout(() => {
          t.equal(
            fs.readdirSync('/proc/self/fd').length,
            loadedFd,
            `file descriptor count should be identical after repeated configure() calls`
          );
          t.end();
        }, 250);
      }
    );

    batch.test(
      'file descriptor count should return back to initial count',
      (t) => {
        log4js.shutdown();

        // wait for the file system to catch up
        setTimeout(() => {
          t.equal(
            fs.readdirSync('/proc/self/fd').length,
            initialFd,
            `file descriptor count should be back to initial`
          );
          t.end();
        }, 250);
      }
    );

    batch.teardown(async () => {
      await new Promise((resolve) => {
        log4js.shutdown(resolve);
      });

      const filenames = Object.values(config.appenders).map(
        (appender) => appender.filename
      );
      await removeFiles(filenames);
    });

    batch.end();
  });
}
