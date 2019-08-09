const { test } = require("tap");

test("Stacktraces from errors in different VM context", t => {
  const log4js = require("../../lib/log4js");
  const recorder = require("../../lib/appenders/recording");
  const layout = require("../../lib/layouts").basicLayout;
  const vm = require("vm");

  log4js.configure({
    appenders: { vcr: { type: "recording" } },
    categories: { default: { appenders: ["vcr"], level: "debug" } }
  });

  const logger = log4js.getLogger();

  try {
    // Access not defined variable.
    vm.runInNewContext("myVar();", {}, "myfile.js");
  } catch (e) {
    // Expect to have a stack trace printed.
    logger.error(e);
  }

  const events = recorder.replay();
  // recording appender events do not go through layouts, so let's do it
  const output = layout(events[0]);
  t.match(output, "stacktraces-test.js");
  t.end();
});
