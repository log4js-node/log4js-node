const { test } = require("tap");
const debug = require("debug");
const sandbox = require("@log4js-node/sandboxed-module");

test("default settings", batch => {
  const originalListener = process.listeners("warning")[process.listeners("warning").length - 1];
  const warningListener = error => {
    if (error.name === "DeprecationWarning") {
      if (error.code.startsWith("log4js-node-DEP0001") || error.code.startsWith("log4js-node-DEP0002")) {
        return;
      }
    }
    originalListener(error);
  };
  process.off("warning", originalListener);
  process.on("warning", warningListener);

  const debugWasEnabled = debug.enabled("log4js:appenders");
  const debugLogs = [];
  const originalWrite = process.stderr.write;
  process.stderr.write = (string, encoding, fd) => {
    debugLogs.push(string);
    if (debugWasEnabled) {
      originalWrite.apply(process.stderr, [string, encoding, fd]);
    }
  };
  const originalNamespace = debug.disable();
  debug.enable(`${originalNamespace}, log4js:appenders`);

  batch.teardown(async () => {
    // next event loop so that past warnings will not be printed
    setImmediate(() => {
      process.off("warning", warningListener);
      process.on("warning", originalListener);
    });
    process.stderr.write = originalWrite;
    debug.enable(originalNamespace);
  });

  const output = [];
  const log4js = sandbox.require("../../lib/log4js", {
    requires: {
      "./appenders/stdout": {
        name: "stdout",
        appender() { // deprecated
          return function(evt) {
            output.push(evt);
          };
        },
        shutdown() { // deprecated
        },
        configure() {
          return this.appender();
        }
      },
      debug
    }
  });

  let logger;

  batch.test("should call configure() on getLogger() if not configured", t => {
    const DEP0001 = debugLogs.filter((e) => e.indexOf("log4js-node-DEP0001") > -1).length;
    const DEP0002 = debugLogs.filter((e) => e.indexOf("log4js-node-DEP0002") > -1).length;
    logger = log4js.getLogger("default-settings");
    t.equal(
      debugLogs.filter((e) => e.indexOf("log4js-node-DEP0001") > -1).length,
      DEP0001 + 1,
      "deprecation log4js-node-DEP0001 emitted"
    );
    t.equal(
      debugLogs.filter((e) => e.indexOf("log4js-node-DEP0002") > -1).length,
      DEP0002 + 1, 
      "deprecation log4js-node-DEP0002 emitted"
    );
    t.end();
  });

  batch.test("nothing should be logged until level is set or configure() is called", t => {
    const originalLevel = logger.level;
    t.equal(
      originalLevel.levelStr,
      "OFF",
      "default logger.level should be OFF"
    );

    logger.info("This should not be logged yet.");
    t.equal(output.length, 0, "nothing should be logged");

    t.test("after level is set", assert => {
      logger.level = "debug";
      logger.info("This should be logged.");
      assert.equal(output.length, 1, "should log the message if level is set");
      assert.equal(output[output.length - 1].data[0], "This should be logged.");
      logger.level = originalLevel;
      assert.end();
    });

    t.test("after configure() is called", assert => {
      const DEP0001 = debugLogs.filter((e) => e.indexOf("log4js-node-DEP0001") > -1).length;
      const DEP0002 = debugLogs.filter((e) => e.indexOf("log4js-node-DEP0002") > -1).length;
      log4js.configure({
        appenders: { stdout: { type: "stdout" } },
        categories: { default: { appenders: ["stdout"], level: "debug" } }
      });
      assert.equal(
        debugLogs.filter((e) => e.indexOf("log4js-node-DEP0001") > -1).length, 
        DEP0001 + 1, 
        "deprecation log4js-node-DEP0001 emitted"
      );
      assert.equal(
        debugLogs.filter((e) => e.indexOf("log4js-node-DEP0002") > -1).length,
        DEP0002 + 1,
        "deprecation log4js-node-DEP0002 emitted"
      );

      logger.info("This should go to stdout.");
      assert.equal(output.length, 2, "should log the message after configure() is called");
      assert.equal(output[output.length - 1].data[0], "This should go to stdout.");
      assert.end();
    });

    t.end();
  });

  batch.end();
});
