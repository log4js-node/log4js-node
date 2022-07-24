const { test } = require('tap');
const fs = require('fs');
const path = require('path');
const EOL = require('os').EOL || '\n';
const sandbox = require('@log4js-node/sandboxed-module');
const log4js = require('../../lib/log4js');

function remove(filename) {
  try {
    fs.unlinkSync(filename);
  } catch (e) {
    // doesn't really matter if it failed
  }
}

test('log4js fileSyncAppender', (batch) => {
  batch.test('with default fileSyncAppender settings', (t) => {
    const testFile = path.join(__dirname, '/fa-default-sync-test.log');
    const logger = log4js.getLogger('default-settings');
    remove(testFile);

    t.teardown(() => {
      remove(testFile);
    });

    log4js.configure({
      appenders: { sync: { type: 'fileSync', filename: testFile } },
      categories: { default: { appenders: ['sync'], level: 'debug' } },
    });

    logger.info('This should be in the file.');

    fs.readFile(testFile, 'utf8', (err, fileContents) => {
      t.match(fileContents, `This should be in the file.${EOL}`);
      t.match(
        fileContents,
        /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}] \[INFO] default-settings - /
      );
      t.end();
    });
  });

  batch.test('with existing file', (t) => {
    const testFile = path.join(__dirname, '/fa-existing-file-sync-test.log');
    const logger = log4js.getLogger('default-settings');
    remove(testFile);

    t.teardown(() => {
      remove(testFile);
    });

    log4js.configure({
      appenders: { sync: { type: 'fileSync', filename: testFile } },
      categories: { default: { appenders: ['sync'], level: 'debug' } },
    });

    logger.info('This should be in the file.');

    log4js.shutdown(() => {
      log4js.configure({
        appenders: { sync: { type: 'fileSync', filename: testFile } },
        categories: { default: { appenders: ['sync'], level: 'debug' } },
      });

      logger.info('This should also be in the file.');

      fs.readFile(testFile, 'utf8', (err, fileContents) => {
        t.match(fileContents, `This should be in the file.${EOL}`);
        t.match(fileContents, `This should also be in the file.${EOL}`);
        t.match(
          fileContents,
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}] \[INFO] default-settings - /
        );
        t.end();
      });
    });
  });

  batch.test('should give error if invalid filename', async (t) => {
    const file = '';
    t.throws(
      () =>
        log4js.configure({
          appenders: {
            file: {
              type: 'fileSync',
              filename: file,
            },
          },
          categories: {
            default: { appenders: ['file'], level: 'debug' },
          },
        }),
      new Error(`Invalid filename: ${file}`)
    );
    const dir = `.${path.sep}`;
    t.throws(
      () =>
        log4js.configure({
          appenders: {
            file: {
              type: 'fileSync',
              filename: dir,
            },
          },
          categories: {
            default: { appenders: ['file'], level: 'debug' },
          },
        }),
      new Error(`Filename is a directory: ${dir}`)
    );
    t.end();
  });

  batch.test('should give error if invalid maxLogSize', async (t) => {
    const maxLogSize = -1;
    const expectedError = new Error(`maxLogSize (${maxLogSize}) should be > 0`);
    t.throws(
      () =>
        log4js.configure({
          appenders: {
            file: {
              type: 'fileSync',
              filename: path.join(
                __dirname,
                'fa-invalidMaxFileSize-sync-test.log'
              ),
              maxLogSize: -1,
            },
          },
          categories: {
            default: { appenders: ['file'], level: 'debug' },
          },
        }),
      expectedError
    );
    t.end();
  });

  batch.test('with a max file size and no backups', (t) => {
    const testFile = path.join(__dirname, '/fa-maxFileSize-sync-test.log');
    const logger = log4js.getLogger('max-file-size');
    remove(testFile);

    t.teardown(() => {
      remove(testFile);
    });

    // log file of 100 bytes maximum, no backups
    log4js.configure({
      appenders: {
        sync: {
          type: 'fileSync',
          filename: testFile,
          maxLogSize: 100,
          backups: 0,
        },
      },
      categories: { default: { appenders: ['sync'], level: 'debug' } },
    });
    logger.info('This is the first log message.');
    logger.info('This is an intermediate log message.');
    logger.info('This is the second log message.');

    t.test('log file should only contain the second message', (assert) => {
      fs.readFile(testFile, 'utf8', (err, fileContents) => {
        assert.match(fileContents, `This is the second log message.${EOL}`);
        assert.equal(
          fileContents.indexOf('This is the first log message.'),
          -1
        );
        assert.end();
      });
    });

    t.test('there should be one test files', (assert) => {
      fs.readdir(__dirname, (err, files) => {
        const logFiles = files.filter((file) =>
          file.includes('fa-maxFileSize-sync-test.log')
        );
        assert.equal(logFiles.length, 1);
        assert.end();
      });
    });
    t.end();
  });

  batch.test('with a max file size in unit mode and no backups', (t) => {
    const testFile = path.join(__dirname, '/fa-maxFileSize-unit-sync-test.log');
    const logger = log4js.getLogger('max-file-size-unit');
    remove(testFile);
    remove(`${testFile}.1`);

    t.teardown(() => {
      remove(testFile);
      remove(`${testFile}.1`);
    });

    // log file of 100 bytes maximum, no backups
    log4js.configure({
      appenders: {
        sync: {
          type: 'fileSync',
          filename: testFile,
          maxLogSize: '1K',
          backups: 0,
          layout: { type: 'messagePassThrough' },
        },
      },
      categories: { default: { appenders: ['sync'], level: 'debug' } },
    });
    const maxLine = 22; // 1024 max file size / 47 bytes per line
    for (let i = 0; i < maxLine; i++) {
      logger.info('These are the log messages for the first file.'); // 46 bytes per line + '\n'
    }

    logger.info('This is the second log message.');

    t.test('log file should only contain the second message', (assert) => {
      fs.readFile(testFile, 'utf8', (err, fileContents) => {
        assert.match(fileContents, `This is the second log message.${EOL}`);
        assert.notMatch(
          fileContents,
          'These are the log messages for the first file.'
        );
        assert.end();
      });
    });

    t.test('there should be one test file', (assert) => {
      fs.readdir(__dirname, (err, files) => {
        const logFiles = files.filter((file) =>
          file.includes('fa-maxFileSize-unit-sync-test.log')
        );
        assert.equal(logFiles.length, 1);
        assert.end();
      });
    });
    t.end();
  });

  batch.test('with a max file size and 2 backups', (t) => {
    const testFile = path.join(
      __dirname,
      '/fa-maxFileSize-with-backups-sync-test.log'
    );
    const logger = log4js.getLogger('max-file-size-backups');
    remove(testFile);
    remove(`${testFile}.1`);
    remove(`${testFile}.2`);

    t.teardown(() => {
      remove(testFile);
      remove(`${testFile}.1`);
      remove(`${testFile}.2`);
    });

    // log file of 50 bytes maximum, 2 backups
    log4js.configure({
      appenders: {
        sync: {
          type: 'fileSync',
          filename: testFile,
          maxLogSize: 50,
          backups: 2,
        },
      },
      categories: { default: { appenders: ['sync'], level: 'debug' } },
    });
    logger.info('This is the first log message.');
    logger.info('This is the second log message.');
    logger.info('This is the third log message.');
    logger.info('This is the fourth log message.');

    t.test('the log files', (assert) => {
      assert.plan(5);
      fs.readdir(__dirname, (err, files) => {
        const logFiles = files.filter((file) =>
          file.includes('fa-maxFileSize-with-backups-sync-test.log')
        );
        assert.equal(logFiles.length, 3, 'should be 3 files');
        assert.same(
          logFiles,
          [
            'fa-maxFileSize-with-backups-sync-test.log',
            'fa-maxFileSize-with-backups-sync-test.log.1',
            'fa-maxFileSize-with-backups-sync-test.log.2',
          ],
          'should be named in sequence'
        );

        fs.readFile(
          path.join(__dirname, logFiles[0]),
          'utf8',
          (e, contents) => {
            assert.match(contents, 'This is the fourth log message.');
          }
        );
        fs.readFile(
          path.join(__dirname, logFiles[1]),
          'utf8',
          (e, contents) => {
            assert.match(contents, 'This is the third log message.');
          }
        );
        fs.readFile(
          path.join(__dirname, logFiles[2]),
          'utf8',
          (e, contents) => {
            assert.match(contents, 'This is the second log message.');
          }
        );
      });
    });
    t.end();
  });

  batch.test('configure with fileSyncAppender', (t) => {
    const testFile = 'tmp-sync-tests.log';
    remove(testFile);

    t.teardown(() => {
      remove(testFile);
    });

    // this config defines one file appender (to ./tmp-sync-tests.log)
    // and sets the log level for "tests" to WARN
    log4js.configure({
      appenders: {
        sync: {
          type: 'fileSync',
          filename: testFile,
          layout: { type: 'messagePassThrough' },
        },
      },
      categories: {
        default: { appenders: ['sync'], level: 'debug' },
        tests: { appenders: ['sync'], level: 'warn' },
      },
    });
    const logger = log4js.getLogger('tests');
    logger.info('this should not be written to the file');
    logger.warn('this should be written to the file');

    fs.readFile(testFile, 'utf8', (err, contents) => {
      t.match(contents, `this should be written to the file${EOL}`);
      t.equal(contents.indexOf('this should not be written to the file'), -1);
      t.end();
    });
  });

  batch.test(
    'configure with non-existent multi-directory (recursive, nodejs >= 10.12.0)',
    (t) => {
      const testFile = 'tmpA/tmpB/tmpC/tmp-sync-tests-recursive.log';
      remove(testFile);

      t.teardown(() => {
        remove(testFile);
        try {
          fs.rmdirSync('tmpA/tmpB/tmpC');
          fs.rmdirSync('tmpA/tmpB');
          fs.rmdirSync('tmpA');
        } catch (e) {
          // doesn't matter
        }
      });

      log4js.configure({
        appenders: {
          sync: {
            type: 'fileSync',
            filename: testFile,
            layout: { type: 'messagePassThrough' },
          },
        },
        categories: {
          default: { appenders: ['sync'], level: 'debug' },
        },
      });
      const logger = log4js.getLogger();
      logger.info('this should be written to the file');

      fs.readFile(testFile, 'utf8', (err, contents) => {
        t.match(contents, `this should be written to the file${EOL}`);
        t.end();
      });
    }
  );

  batch.test(
    'configure with non-existent multi-directory (non-recursive, nodejs < 10.12.0)',
    (t) => {
      const testFile = 'tmpA/tmpB/tmpC/tmp-sync-tests-non-recursive.log';
      remove(testFile);

      t.teardown(() => {
        remove(testFile);
        try {
          fs.rmdirSync('tmpA/tmpB/tmpC');
          fs.rmdirSync('tmpA/tmpB');
          fs.rmdirSync('tmpA');
        } catch (e) {
          // doesn't matter
        }
      });

      const sandboxedLog4js = sandbox.require('../../lib/log4js', {
        requires: {
          fs: {
            ...fs,
            mkdirSync(dirPath, options) {
              return fs.mkdirSync(dirPath, {
                ...options,
                ...{ recursive: false },
              });
            },
          },
        },
      });
      sandboxedLog4js.configure({
        appenders: {
          sync: {
            type: 'fileSync',
            filename: testFile,
            layout: { type: 'messagePassThrough' },
          },
        },
        categories: {
          default: { appenders: ['sync'], level: 'debug' },
        },
      });
      const logger = sandboxedLog4js.getLogger();
      logger.info('this should be written to the file');

      fs.readFile(testFile, 'utf8', (err, contents) => {
        t.match(contents, `this should be written to the file${EOL}`);
        t.end();
      });
    }
  );

  batch.test(
    'configure with non-existent multi-directory (error handling)',
    (t) => {
      const testFile = 'tmpA/tmpB/tmpC/tmp-sync-tests-error-handling.log';
      remove(testFile);

      t.teardown(() => {
        remove(testFile);
        try {
          fs.rmdirSync('tmpA/tmpB/tmpC');
          fs.rmdirSync('tmpA/tmpB');
          fs.rmdirSync('tmpA');
        } catch (e) {
          // doesn't matter
        }
      });

      const errorEPERM = new Error('EPERM');
      errorEPERM.code = 'EPERM';

      let sandboxedLog4js = sandbox.require('../../lib/log4js', {
        requires: {
          fs: {
            ...fs,
            mkdirSync() {
              throw errorEPERM;
            },
          },
        },
      });
      t.throws(
        () =>
          sandboxedLog4js.configure({
            appenders: {
              sync: {
                type: 'fileSync',
                filename: testFile,
                layout: { type: 'messagePassThrough' },
              },
            },
            categories: {
              default: { appenders: ['sync'], level: 'debug' },
            },
          }),
        errorEPERM
      );

      const errorEROFS = new Error('EROFS');
      errorEROFS.code = 'EROFS';

      sandboxedLog4js = sandbox.require('../../lib/log4js', {
        requires: {
          fs: {
            ...fs,
            mkdirSync() {
              throw errorEROFS;
            },
            statSync() {
              return {
                isDirectory() {
                  return false;
                },
              };
            },
          },
        },
      });
      t.throws(
        () =>
          sandboxedLog4js.configure({
            appenders: {
              sync: {
                type: 'fileSync',
                filename: testFile,
                layout: { type: 'messagePassThrough' },
              },
            },
            categories: {
              default: { appenders: ['sync'], level: 'debug' },
            },
          }),
        errorEROFS
      );

      fs.mkdirSync('tmpA');
      fs.mkdirSync('tmpA/tmpB');
      fs.mkdirSync('tmpA/tmpB/tmpC');

      sandboxedLog4js = sandbox.require('../../lib/log4js', {
        requires: {
          fs: {
            ...fs,
            mkdirSync() {
              throw errorEROFS;
            },
          },
        },
      });
      t.doesNotThrow(() =>
        sandboxedLog4js.configure({
          appenders: {
            sync: {
              type: 'fileSync',
              filename: testFile,
              layout: { type: 'messagePassThrough' },
            },
          },
          categories: {
            default: { appenders: ['sync'], level: 'debug' },
          },
        })
      );

      t.end();
    }
  );

  batch.test('test options', (t) => {
    const testFile = 'tmp-options-tests.log';
    remove(testFile);

    t.teardown(() => {
      remove(testFile);
    });

    // using non-standard options
    log4js.configure({
      appenders: {
        sync: {
          type: 'fileSync',
          filename: testFile,
          layout: { type: 'messagePassThrough' },
          flags: 'w',
          encoding: 'ascii',
          mode: 0o666,
        },
      },
      categories: {
        default: { appenders: ['sync'], level: 'info' },
      },
    });
    const logger = log4js.getLogger();
    logger.warn('log message');

    fs.readFile(testFile, 'ascii', (err, contents) => {
      t.match(contents, `log message${EOL}`);
      t.end();
    });
  });

  batch.end();
});
