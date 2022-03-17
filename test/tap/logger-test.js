const { test } = require("tap");
const debug = require("debug")("log4js:test.logger");
const sandbox = require("@log4js-node/sandboxed-module");
const callsites = require("callsites");
const levels = require("../../lib/levels");
const categories = require("../../lib/categories");

const events = [];
const messages = [];
const Logger = sandbox.require("../../lib/logger", {
  requires: {
    "./levels": levels,
    "./categories": categories,
    "./clustering": {
      isMaster: () => true,
      onlyOnMaster: fn => fn(),
      send: evt => {
        debug("fake clustering got event:", evt);
        events.push(evt);
      }
    }
  },
  globals: {
    console: {
      ...console,
      error(msg) {
        messages.push(msg);
      }
    }
  }
});

const testConfig = {
  level: levels.TRACE
};

test("../../lib/logger", batch => {
  batch.beforeEach(() => {
    events.length = 0;
    testConfig.level = levels.TRACE;
  });

  batch.test("constructor with no parameters", t => {
    t.throws(() => new Logger(), new Error("No category provided."));
    t.end();
  });

  batch.test("constructor with category", t => {
    const logger = new Logger("cheese");
    t.equal(logger.category, "cheese", "should use category");
    t.equal(logger.level, levels.OFF, "should use OFF log level");
    t.end();
  });

  batch.test("set level should delegate", t => {
    const logger = new Logger("cheese");
    logger.level = "debug";
    t.equal(logger.category, "cheese", "should use category");
    t.equal(logger.level, levels.DEBUG, "should use level");
    t.end();
  });

  batch.test("isLevelEnabled", t => {
    const logger = new Logger("cheese");
    const functions = [
      "isTraceEnabled",
      "isDebugEnabled",
      "isInfoEnabled",
      "isWarnEnabled",
      "isErrorEnabled",
      "isFatalEnabled"
    ];
    t.test(
      "should provide a level enabled function for all levels",
      subtest => {
        subtest.plan(functions.length);
        functions.forEach(fn => {
          subtest.type(logger[fn], "function");
        });
      }
    );
    logger.level = "INFO";
    t.notOk(logger.isTraceEnabled());
    t.notOk(logger.isDebugEnabled());
    t.ok(logger.isInfoEnabled());
    t.ok(logger.isWarnEnabled());
    t.ok(logger.isErrorEnabled());
    t.ok(logger.isFatalEnabled());
    t.end();
  });

  batch.test("should send log events to dispatch function", t => {
    const logger = new Logger("cheese");
    logger.level = "debug";
    logger.debug("Event 1");
    logger.debug("Event 2");
    logger.debug("Event 3");

    t.equal(events.length, 3);
    t.equal(events[0].data[0], "Event 1");
    t.equal(events[1].data[0], "Event 2");
    t.equal(events[2].data[0], "Event 3");
    t.end();
  });

  batch.test("should add context values to every event", t => {
    const logger = new Logger("fromage");
    logger.level = "debug";
    logger.debug("Event 1");
    logger.addContext("cheese", "edam");
    logger.debug("Event 2");
    logger.debug("Event 3");
    logger.addContext("biscuits", "timtam");
    logger.debug("Event 4");
    logger.removeContext("cheese");
    logger.debug("Event 5");
    logger.clearContext();
    logger.debug("Event 6");

    t.equal(events.length, 6);
    t.same(events[0].context, {});
    t.same(events[1].context, { cheese: "edam" });
    t.same(events[2].context, { cheese: "edam" });
    t.same(events[3].context, { cheese: "edam", biscuits: "timtam" });
    t.same(events[4].context, { biscuits: "timtam" });
    t.same(events[5].context, {});
    t.end();
  });

  batch.test("should not break when log data has no toString", t => {
    const logger = new Logger("thing");
    logger.level = "debug";
    logger.info("Just testing ", Object.create(null));

    t.equal(events.length, 1);
    t.end();
  });

  batch.test("default should disable useCallStack unless manual enable", t => {
    const logger = new Logger("stack");
    logger.level = "debug";

    t.equal(logger.useCallStack, false);

    logger.useCallStack = false;
    t.equal(logger.useCallStack, false);

    logger.useCallStack = 0;
    t.equal(logger.useCallStack, false);

    logger.useCallStack = "";
    t.equal(logger.useCallStack, false);

    logger.useCallStack = null;
    t.equal(logger.useCallStack, false);

    logger.useCallStack = undefined;
    t.equal(logger.useCallStack, false);

    logger.useCallStack = "true";
    t.equal(logger.useCallStack, false);

    logger.useCallStack = true;
    t.equal(logger.useCallStack, true);
    t.end();
  });

  batch.test("should correctly switch on/off useCallStack", t => {
    const logger = new Logger("stack");
    logger.level = "debug";
    logger.useCallStack = true;
    t.equal(logger.useCallStack, true);

    logger.info("hello world");
    const callsite = callsites()[0];

    t.equal(events.length, 1);
    t.equal(events[0].data[0], "hello world");
    t.equal(events[0].fileName, callsite.getFileName());
    t.equal(events[0].lineNumber, callsite.getLineNumber() - 1);
    t.equal(events[0].columnNumber, 12);

    logger.useCallStack = false;
    logger.info("disabled");
    t.equal(logger.useCallStack, false);
    t.equal(events[1].data[0], "disabled");
    t.equal(events[1].fileName, undefined);
    t.equal(events[1].lineNumber, undefined);
    t.equal(events[1].columnNumber, undefined);
    t.end();
  });

  batch.test(
    "Once switch on/off useCallStack will apply all same category loggers",
    t => {
      const logger1 = new Logger("stack");
      logger1.level = "debug";
      logger1.useCallStack = true;
      const logger2 = new Logger("stack");
      logger2.level = "debug";

      logger1.info("hello world");
      const callsite = callsites()[0];

      t.equal(logger1.useCallStack, true);
      t.equal(events.length, 1);
      t.equal(events[0].data[0], "hello world");
      t.equal(events[0].fileName, callsite.getFileName());
      t.equal(events[0].lineNumber, callsite.getLineNumber() - 1);
      t.equal(events[0].columnNumber, 15); // col of the '.' in logger1.info(...)

      logger2.info("hello world");
      const callsite2 = callsites()[0];

      t.equal(logger2.useCallStack, true);
      t.equal(events[1].data[0], "hello world");
      t.equal(events[1].fileName, callsite2.getFileName());
      t.equal(events[1].lineNumber, callsite2.getLineNumber() - 1);
      t.equal(events[1].columnNumber, 15); // col of the '.' in logger1.info(...)

      logger1.useCallStack = false;
      logger2.info("hello world");
      t.equal(logger2.useCallStack, false);
      t.equal(events[2].data[0], "hello world");
      t.equal(events[2].fileName, undefined);
      t.equal(events[2].lineNumber, undefined);
      t.equal(events[2].columnNumber, undefined);

      t.end();
    }
  );

  batch.test("parseCallStack function coverage", t => {
    const logger = new Logger("stack");
    logger.useCallStack = true;

    let results;

    results = logger.parseCallStack(new Error());
    t.ok(results);
    t.equal(messages.length, 0, "should not have error");

    results = logger.parseCallStack("");
    t.notOk(results);
    t.equal(messages.length, 1, "should have error");

    t.end();
  });

  batch.test("should correctly change the parseCallStack function", t => {
    const logger = new Logger("stack");
    const parseFunction = function() {
      return {
        functionName: "test function name",
        fileName: "test file name",
        lineNumber: 15,
        columnNumber: 25,
        callStack: "test callstack"
      };
    };
    logger.level = "debug";
    logger.useCallStack = true;
    logger.setParseCallStackFunction(parseFunction);

    t.equal(logger.parseCallStack, parseFunction);

    logger.info("test parseCallStack");
    t.equal(events[0].functionName, "test function name");
    t.equal(events[0].fileName, "test file name");
    t.equal(events[0].lineNumber, 15);
    t.equal(events[0].columnNumber, 25);
    t.equal(events[0].callStack, "test callstack");

    t.end();
  });

  batch.test("creating/cloning of category", t => {
    const defaultLogger = new Logger("default");
    defaultLogger.level = "trace";
    defaultLogger.useCallStack = true;

    t.test("category should be cloned from parent/default if does not exist", assert => {
      const originalLength = categories.size;

      const logger = new Logger("cheese1");
      assert.equal(categories.size, originalLength + 1, "category should be cloned");
      assert.equal(logger.level, levels.TRACE, "should inherit level=TRACE from default-category");
      assert.equal(logger.useCallStack, true, "should inherit useCallStack=true from default-category");
      assert.end();
    });

    t.test("changing level should not impact default-category or useCallStack", assert => {
      const logger = new Logger("cheese2");
      logger.level = "debug";
      assert.equal(logger.level, levels.DEBUG, "should be changed to level=DEBUG");
      assert.equal(defaultLogger.level, levels.TRACE, "default-category should remain as level=TRACE");
      assert.equal(logger.useCallStack, true, "should remain as useCallStack=true");
      assert.equal(defaultLogger.useCallStack, true, "default-category should remain as useCallStack=true");
      assert.end();
    });

    t.test("changing useCallStack should not impact default-category or level", assert => {
      const logger = new Logger("cheese3");
      logger.useCallStack = false;
      assert.equal(logger.useCallStack, false, "should be changed to useCallStack=false");
      assert.equal(defaultLogger.useCallStack, true, "default-category should remain as useCallStack=true");
      assert.equal(logger.level, levels.TRACE, "should remain as level=TRACE");
      assert.equal(defaultLogger.level, levels.TRACE, "default-category should remain as level=TRACE");
      assert.end();
    });

    t.end();
  });

  batch.end();
});
