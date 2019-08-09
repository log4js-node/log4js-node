const { test } = require("tap");
const log4js = require("../../lib/log4js");
const recording = require("../../lib/appenders/recording");

/**
 * test a simple regexp
 */
test("log4js noLogFilter", batch => {
  batch.beforeEach(done => {
    recording.reset();
    done();
  });

  batch.test(
    "appender should exclude events that match the regexp string",
    t => {
      log4js.configure({
        appenders: {
          recorder: { type: "recording" },
          filtered: {
            type: "noLogFilter",
            exclude: "This.*not",
            appender: "recorder"
          }
        },
        categories: { default: { appenders: ["filtered"], level: "DEBUG" } }
      });

      const logger = log4js.getLogger();
      logger.debug("This should not get logged");
      logger.debug("This should get logged");
      logger.debug(
        "Another case that not match the regex, so it should get logged"
      );
      const logEvents = recording.replay();
      t.equal(logEvents.length, 2);
      t.equal(logEvents[0].data[0], "This should get logged");
      t.equal(
        logEvents[1].data[0],
        "Another case that not match the regex, so it should get logged"
      );
      t.end();
    }
  );

  /**
   * test an array of regexp
   */
  batch.test(
    "appender should exclude events that match the regexp string contained in the array",
    t => {
      log4js.configure({
        appenders: {
          recorder: { type: "recording" },
          filtered: {
            type: "noLogFilter",
            exclude: ["This.*not", "instead"],
            appender: "recorder"
          }
        },
        categories: { default: { appenders: ["filtered"], level: "DEBUG" } }
      });

      const logger = log4js.getLogger();
      logger.debug("This should not get logged");
      logger.debug("This should get logged");
      logger.debug(
        "Another case that not match the regex, so it should get logged"
      );
      logger.debug("This case instead it should get logged");
      logger.debug("The last that should get logged");
      const logEvents = recording.replay();
      t.equal(logEvents.length, 3);
      t.equal(logEvents[0].data[0], "This should get logged");
      t.equal(
        logEvents[1].data[0],
        "Another case that not match the regex, so it should get logged"
      );
      t.equal(logEvents[2].data[0], "The last that should get logged");
      t.end();
    }
  );
  /**
   * test case insentitive regexp
   */
  batch.test(
    "appender should evaluate the regexp using incase sentitive option",
    t => {
      log4js.configure({
        appenders: {
          recorder: { type: "recording" },
          filtered: {
            type: "noLogFilter",
            exclude: ["NOT", "eX.*de"],
            appender: "recorder"
          }
        },
        categories: { default: { appenders: ["filtered"], level: "DEBUG" } }
      });

      const logger = log4js.getLogger();

      logger.debug("This should not get logged");
      logger.debug("This should get logged");
      logger.debug("Exclude this string");
      logger.debug("Include this string");
      const logEvents = recording.replay();
      t.equal(logEvents.length, 2);
      t.equal(logEvents[0].data[0], "This should get logged");
      t.equal(logEvents[1].data[0], "Include this string");
      t.end();
    }
  );

  /**
   * test empty string or null regexp
   */
  batch.test(
    "appender should skip the match in case of empty or null regexp",
    t => {
      log4js.configure({
        appenders: {
          recorder: { type: "recording" },
          filtered: {
            type: "noLogFilter",
            exclude: ["", null, undefined],
            appender: "recorder"
          }
        },
        categories: { default: { appenders: ["filtered"], level: "DEBUG" } }
      });

      const logger = log4js.getLogger();
      logger.debug("This should get logged");
      logger.debug("Another string that should get logged");
      const logEvents = recording.replay();
      t.equal(logEvents.length, 2);
      t.equal(logEvents[0].data[0], "This should get logged");
      t.equal(logEvents[1].data[0], "Another string that should get logged");
      t.end();
    }
  );

  /**
   * test for excluding all the events that contains digits
   */
  batch.test("appender should exclude the events that contains digits", t => {
    log4js.configure({
      appenders: {
        recorder: { type: "recording" },
        filtered: {
          type: "noLogFilter",
          exclude: "\\d",
          appender: "recorder"
        }
      },
      categories: { default: { appenders: ["filtered"], level: "DEBUG" } }
    });

    const logger = log4js.getLogger();
    logger.debug("This should get logged");
    logger.debug("The 2nd event should not get logged");
    logger.debug("The 3rd event should not get logged, such as the 2nd");
    const logEvents = recording.replay();
    t.equal(logEvents.length, 1);
    t.equal(logEvents[0].data[0], "This should get logged");
    t.end();
  });

  /**
   * test the cases provided in the documentation
   * https://log4js-node.github.io/log4js-node/noLogFilter.html
   */
  batch.test(
    "appender should exclude not valid events according to the documentation",
    t => {
      log4js.configure({
        appenders: {
          recorder: { type: "recording" },
          filtered: {
            type: "noLogFilter",
            exclude: ["NOT", "\\d", ""],
            appender: "recorder"
          }
        },
        categories: { default: { appenders: ["filtered"], level: "DEBUG" } }
      });

      const logger = log4js.getLogger();
      logger.debug("I will be logged in all-the-logs.log");
      logger.debug("I will be not logged in all-the-logs.log");
      logger.debug("A 2nd message that will be excluded in all-the-logs.log");
      logger.debug("Hello again");
      const logEvents = recording.replay();
      t.equal(logEvents.length, 2);
      t.equal(logEvents[0].data[0], "I will be logged in all-the-logs.log");
      t.equal(logEvents[1].data[0], "Hello again");
      t.end();
    }
  );

  batch.end();
});
