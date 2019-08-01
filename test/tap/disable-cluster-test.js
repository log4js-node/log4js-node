const { test } = require("tap");
const cluster = require("cluster");
const log4js = require("../../lib/log4js");
const recorder = require("../../lib/appenders/recording");

cluster.removeAllListeners();

log4js.configure({
  appenders: {
    vcr: { type: "recording" }
  },
  categories: { default: { appenders: ["vcr"], level: "debug" } },
  disableClustering: true
});

if (cluster.isMaster) {
  cluster.fork();

  const masterLogger = log4js.getLogger("master");
  const masterPid = process.pid;
  masterLogger.info("this is master");

  cluster.on("exit", () => {
    const logEvents = recorder.replay();

    test("cluster master", batch => {
      batch.test("only master events should be logged", t => {
        t.equal(logEvents.length, 1);
        t.equal(logEvents[0].categoryName, "master");
        t.equal(logEvents[0].pid, masterPid);
        t.equal(logEvents[0].data[0], "this is master");
        t.end();
      });

      batch.end();
    });
  });
} else {
  const workerLogger = log4js.getLogger("worker");
  workerLogger.info("this is worker", new Error("oh dear"));

  const workerEvents = recorder.replay();
  test("cluster worker", batch => {
    batch.test("should send events to its own appender", t => {
      t.equal(workerEvents.length, 1);
      t.equal(workerEvents[0].categoryName, "worker");
      t.equal(workerEvents[0].data[0], "this is worker");
      t.type(workerEvents[0].data[1], "Error");
      t.contains(workerEvents[0].data[1].stack, "Error: oh dear");
      t.end();
    });
    batch.end();
  });
  // test sending a cluster-style log message
  process.send({ topic: "log4js:message", data: { cheese: "gouda" } });
  cluster.worker.disconnect();
}
