const { test } = require("tap");
const log4js = require("../../lib/log4js");
const recording = require("../../lib/appenders/recording");

test("../../lib/logger", batch => {
  batch.beforeEach(() => {
    recording.reset();
  });

  batch.test("creating a new log level", t => {
    log4js.configure({
      levels: {
        DIAG: { value: 6000, colour: "green" }
      },
      appenders: {
        stdout: { type: "stdout" }
      },
      categories: {
        default: { appenders: ["stdout"], level: "trace" }
      }
    });

    const logger = log4js.getLogger();

    t.test("should export new log level in levels module", assert => {
      assert.ok(log4js.levels.DIAG);
      assert.equal(log4js.levels.DIAG.levelStr, "DIAG");
      assert.equal(log4js.levels.DIAG.level, 6000);
      assert.equal(log4js.levels.DIAG.colour, "green");
      assert.end();
    });

    t.type(
      logger.diag,
      "function",
      "should create named function on logger prototype"
    );
    t.type(
      logger.isDiagEnabled,
      "function",
      "should create isLevelEnabled function on logger prototype"
    );
    t.type(logger.info, "function", "should retain default levels");
    t.end();
  });

  batch.test("creating a new log level with underscores", t => {
    log4js.configure({
      levels: {
        NEW_LEVEL_OTHER: { value: 6000, colour: "blue" }
      },
      appenders: { stdout: { type: "stdout" } },
      categories: { default: { appenders: ["stdout"], level: "trace" } }
    });
    const logger = log4js.getLogger();

    t.test("should export new log level to levels module", assert => {
      assert.ok(log4js.levels.NEW_LEVEL_OTHER);
      assert.equal(log4js.levels.NEW_LEVEL_OTHER.levelStr, "NEW_LEVEL_OTHER");
      assert.equal(log4js.levels.NEW_LEVEL_OTHER.level, 6000);
      assert.equal(log4js.levels.NEW_LEVEL_OTHER.colour, "blue");
      assert.end();
    });

    t.type(
      logger.newLevelOther,
      "function",
      "should create named function on logger prototype in camel case"
    );
    t.type(
      logger.isNewLevelOtherEnabled,
      "function",
      "should create named isLevelEnabled function on logger prototype in camel case"
    );
    t.end();
  });

  batch.test("creating log events containing newly created log level", t => {
    log4js.configure({
      levels: {
        LVL1: { value: 6000, colour: "grey" },
        LVL2: { value: 5000, colour: "magenta" }
      },
      appenders: { recorder: { type: "recording" } },
      categories: {
        default: { appenders: ["recorder"], level: "LVL1" }
      }
    });
    const logger = log4js.getLogger();

    logger.log(log4js.levels.getLevel("LVL1", log4js.levels.DEBUG), "Event 1");
    logger.log(log4js.levels.getLevel("LVL1"), "Event 2");
    logger.log("LVL1", "Event 3");
    logger.lvl1("Event 4");

    logger.lvl2("Event 5");

    const events = recording.replay();

    t.test("should show log events with new log level", assert => {
      assert.equal(events[0].level.toString(), "LVL1");
      assert.equal(events[0].data[0], "Event 1");

      assert.equal(events[1].level.toString(), "LVL1");
      assert.equal(events[1].data[0], "Event 2");

      assert.equal(events[2].level.toString(), "LVL1");
      assert.equal(events[2].data[0], "Event 3");

      assert.equal(events[3].level.toString(), "LVL1");
      assert.equal(events[3].data[0], "Event 4");
      assert.end();
    });

    t.equal(
      events.length,
      4,
      "should not be present if min log level is greater than newly created level"
    );
    t.end();
  });

  batch.test("creating a new log level with incorrect parameters", t => {
    t.throws(() => {
      log4js.configure({
        levels: {
          cheese: { value: "biscuits" }
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, 'level "cheese".value must have an integer value');

    t.throws(() => {
      log4js.configure({
        levels: {
          cheese: "biscuits"
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, 'level "cheese" must be an object');

    t.throws(() => {
      log4js.configure({
        levels: {
          cheese: { thing: "biscuits" }
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, "level \"cheese\" must have a 'value' property");

    t.throws(() => {
      log4js.configure({
        levels: {
          cheese: { value: 3 }
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, "level \"cheese\" must have a 'colour' property");

    t.throws(() => {
      log4js.configure({
        levels: {
          cheese: { value: 3, colour: "pants" }
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, 'level "cheese".colour must be one of white, grey, black, blue, cyan, green, magenta, red, yellow');

    t.throws(() => {
      log4js.configure({
        levels: {
          "#pants": 3
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, 'level name "#pants" is not a valid identifier (must start with a letter, only contain A-Z,a-z,0-9,_)');

    t.throws(() => {
      log4js.configure({
        levels: {
          "thing#pants": 3
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, 'level name "thing#pants" is not a valid identifier (must start with a letter, only contain A-Z,a-z,0-9,_)');

    t.throws(() => {
      log4js.configure({
        levels: {
          "1pants": 3
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, 'level name "1pants" is not a valid identifier (must start with a letter, only contain A-Z,a-z,0-9,_)');

    t.throws(() => {
      log4js.configure({
        levels: {
          2: 3
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, 'level name "2" is not a valid identifier (must start with a letter, only contain A-Z,a-z,0-9,_)');

    t.throws(() => {
      log4js.configure({
        levels: {
          "cheese!": 3
        },
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "trace" } }
      });
    }, 'level name "cheese!" is not a valid identifier (must start with a letter, only contain A-Z,a-z,0-9,_)');

    t.end();
  });

  batch.test("calling log with an undefined log level", t => {
    log4js.configure({
      appenders: { recorder: { type: "recording" } },
      categories: { default: { appenders: ["recorder"], level: "trace" } }
    });

    const logger = log4js.getLogger();

    // fallback behavior
    logger.log("LEVEL_DOES_NOT_EXIST", "Event 1");

    // synonym behavior
    logger.log(log4js.levels.getLevel("LEVEL_DOES_NOT_EXIST"), "Event 2", "2 Text");
    logger.log("Event 3");
    logger.log("Event 4", "4 Text");

    const events = recording.replay();

    t.equal(events[0].level.toString(), "WARN", "should log warning");
    t.equal(events[0].data[0], "log4js:logger.log: valid log-level not found as first parameter given:");
    t.equal(events[0].data[1], "LEVEL_DOES_NOT_EXIST");
    t.equal(events[1].level.toString(), "INFO", "should fall back to INFO");
    t.equal(events[1].data[0], "[LEVEL_DOES_NOT_EXIST]");
    t.equal(events[1].data[1], "Event 1");

    t.equal(events[2].level.toString(), "INFO", "LOG is synonym of INFO");
    t.equal(events[2].data[0], undefined);
    t.equal(events[2].data[1], "Event 2");
    t.equal(events[2].data[2], "2 Text");

    t.equal(events[3].level.toString(), "INFO", "LOG is synonym of INFO");
    t.equal(events[3].data[0], "Event 3");

    t.equal(events[4].level.toString(), "INFO", "LOG is synonym of INFO");
    t.equal(events[4].data[0], "Event 4");
    t.equal(events[4].data[1], "4 Text");

    t.end();
  });

  batch.test("creating a new level with an existing level name", t => {
    log4js.configure({
      levels: {
        info: { value: 1234, colour: "blue" }
      },
      appenders: { recorder: { type: "recording" } },
      categories: { default: { appenders: ["recorder"], level: "all" } }
    });

    t.equal(
      log4js.levels.INFO.level,
      1234,
      "should override the existing log level"
    );
    t.equal(
      log4js.levels.INFO.colour,
      "blue",
      "should override the existing log level"
    );

    const logger = log4js.getLogger();
    logger.info("test message");

    const events = recording.replay();
    t.equal(
      events[0].level.level,
      1234,
      "should override the existing log level"
    );
    t.end();
  });
  batch.end();
});
