'use strict';

const test = require('tap').test;
const fs = require('fs');
const EOL = require('os').EOL || '\n';
const log4js = require('../../lib/log4js');

function remove(filename) {
  try {
    fs.unlinkSync(filename);
  } catch (e) {
    // doesn't really matter if it failed
  }
}

function cleanup(done) {
  remove(`${__dirname}/categoryFilter-web.log`);
  remove(`${__dirname}/categoryFilter-noweb.log`);
  done();
}

test('log4js categoryFilter', (batch) => {
  batch.beforeEach(cleanup);

  batch.test('appender should exclude categories', (t) => {
    const logEvents = [];
    const appender = require(
      '../../lib/appenders/categoryFilter'
    ).appender(
      ['app'],
      (evt) => {
        logEvents.push(evt);
      }
    );
    log4js.clearAppenders();
    log4js.addAppender(appender, ['app', 'web']);

    const webLogger = log4js.getLogger('web');
    const appLogger = log4js.getLogger('app');

    webLogger.debug('This should get logged');
    appLogger.debug('This should not');
    webLogger.debug('Hello again');
    log4js.getLogger('db').debug('This shouldn\'t be included by the appender anyway');

    t.equal(logEvents.length, 2);
    t.equal(logEvents[0].data[0], 'This should get logged');
    t.equal(logEvents[1].data[0], 'Hello again');
    t.end();
  });

  batch.test('should work with configuration file', (t) => {
    log4js.configure('test/tap/with-categoryFilter.json');
    const logger = log4js.getLogger('app');
    const weblogger = log4js.getLogger('web');

    logger.info('Loading app');
    logger.info('Initialising indexes');
    weblogger.info('00:00:00 GET / 200');
    weblogger.warn('00:00:00 GET / 500');

    setTimeout(() => {
      fs.readFile(`${__dirname}/categoryFilter-noweb.log`, 'utf8', (err, contents) => {
        const noWebMessages = contents.trim().split(EOL);
        t.same(noWebMessages, ['Loading app', 'Initialising indexes']);

        fs.readFile(`${__dirname}/categoryFilter-web.log`, 'utf8', (e, c) => {
          const messages = c.trim().split(EOL);
          t.same(messages, ['00:00:00 GET / 200', '00:00:00 GET / 500']);
          t.end();
        });
      });
    }, 500);
  });

  batch.afterEach(cleanup);
  batch.end();
});
