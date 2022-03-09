const tap = require("tap");
const fs = require("fs");
const log4js = require("../../lib/log4js");

const removeFiles = async filenames => {
  if (!Array.isArray(filenames))
    filenames = [filenames];
  const promises = filenames.map(filename => fs.promises.unlink(filename));
  await Promise.allSettled(promises);
};

tap.test("Drain event test", batch => {

  batch.test("Should emit pause event and resume when logging in a file with high frequency", t => {
    t.teardown(async () => {
      process.off("log4js:pause", process.listeners("log4js:pause")[process.listeners("log4js:pause").length - 1]);
      await removeFiles("logs/drain.log");
    });
    // Generate logger with 5k of highWaterMark config
    log4js.configure({
      appenders: {
        file: { type: "file", filename: "logs/drain.log", highWaterMark: 5 * 1024  }
      },
      categories: {
        default: { appenders: ["file"], level: "debug" }
      }
    });

    let paused = false;
    let resumed = false;

    process.on("log4js:pause", value => {
      if (value) {
        paused = true;
        t.ok(value, "log4js:pause, true");
      } else {
        resumed = true;
        t.ok(!value, "log4js:pause, false");
        t.end();
      }
    });

    const logger = log4js.getLogger();
    while (!paused && !resumed) {
      if (!paused) {
        logger.info("This is a test for emitting drain event");
      }
    }
  });


  batch.test("Should emit pause event and resume when logging in a date file with high frequency", (t) => {
    t.teardown(async () => {
      process.off("log4js:pause", process.listeners("log4js:pause")[process.listeners("log4js:pause").length - 1]);
      await removeFiles("logs/date-file-drain.log");
    });
    // Generate date file logger with 5kb of highWaterMark config
    log4js.configure({
      appenders: {
        file: { type: "dateFile", filename: "logs/date-file-drain.log", highWaterMark: 5 * 1024 }
      },
      categories: {
        default: { appenders: ["file"], level: "debug" }
      }
    });

    let paused = false;
    let resumed = false;

    process.on("log4js:pause", value => {
      if (value) {
        paused = true;
        t.ok(value, "log4js:pause, true");
      } else {
        resumed = true;
        t.ok(!value, "log4js:pause, false");
        t.end();
      }
    });

    const logger = log4js.getLogger();
    while (!paused && !resumed) {
      if (!paused)
        logger.info("This is a test for emitting drain event in date file logger");
    }
  });

  batch.teardown(async () => {
    try {
      const files = fs.readdirSync("logs");
      await removeFiles(files.map(filename => `logs/${filename}`));
      fs.rmdirSync("logs");
    } catch (e) {
      // doesn't matter
    }
  });

  batch.end();
});
