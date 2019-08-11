const { test } = require("tap");
const proxyquire = require("proxyquire");

test("clustering is disabled if cluster is not present", t => {
  const log4js = proxyquire("../../lib/log4js", { cluster: null });
  const recorder = require("../../lib/appenders/recording");
  log4js.configure({
    appenders: { vcr: { type: "recording" } },
    categories: { default: { appenders: ["vcr"], level: "debug" } }
  });
  log4js.getLogger().info("it should still work");
  const events = recorder.replay();
  t.equal(events[0].data[0], "it should still work");
  t.end();
});
