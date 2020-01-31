const { test } = require("tap");

const categories = {
  default: { appenders: ["filtered"], level: "debug" }
}

let log4js;
let recording;

test("log4js appender dependencies", batch => {
  batch.beforeEach(done => {
    log4js = require("../../lib/log4js");
    recording = require("../../lib/appenders/recording");
    done();
  });
  batch.afterEach(done => {
    recording.erase();
    done();
  });
  batch.test("in order", t => {
    const config = {
      categories,
      appenders: {
        recorder: { type: "recording" },
        filtered: {
          type: "logLevelFilter",
          appender: "recorder",
          level: "ERROR"
        }
      }
    };
    t.test('should resolve if defined in dependency order', assert => {
      assert.doesNotThrow(() => {
        log4js.configure(config);
      }, 'this should not trigger an error');
      assert.end();
    });
    const logger = log4js.getLogger("logLevelTest");
    logger.debug("this should not trigger an event");
    logger.error("this should, though");

    const logEvents = recording.replay();
    t.test(
      "should process log events normally",
      assert => {
        assert.equal(logEvents.length, 1);
        assert.equal(logEvents[0].data[0], "this should, though");
        assert.end();
      }
    );
    t.end();
  });

  batch.test("not in order", t => {
    const config = {
      categories,
      appenders: {
        filtered: {
          type: "logLevelFilter",
          appender: "recorder",
          level: "ERROR"
        },
        recorder: { type: "recording" },
      }
    };
    t.test('should resolve if defined out of dependency order', assert => {
      assert.doesNotThrow(() => {
        log4js.configure(config);
      }, 'this should not trigger an error');
      assert.end();
    });
    const logger = log4js.getLogger("logLevelTest");
    logger.debug("this should not trigger an event");
    logger.error("this should, though");

    const logEvents = recording.replay();
    t.test(
      "should process log events normally",
      assert => {
        assert.equal(logEvents.length, 1);
        assert.equal(logEvents[0].data[0], "this should, though");
        assert.end();
      }
    );
    t.end();
  });

  batch.test("with dependency loop", t => {
    const config = {
      categories,
      appenders: {
        filtered: {
          type: "logLevelFilter",
          appender: "filtered2",
          level: "ERROR"
        },
        filtered2: {
          type: "logLevelFilter",
          appender: "filtered",
          level: "ERROR"
        },
        recorder: { type: "recording" },
      }
    };
    t.test('should throw an error if if a dependency loop is found', assert => {
      assert.throws(() => {
        log4js.configure(config);
      }, 'Dependency loop detected for appender filtered.');
      assert.end();
    });
    t.end();
  });
  batch.end();
});
