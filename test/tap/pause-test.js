const tap = require("tap");
const log4js = require("../../lib/log4js");

tap.test("Drain event test", batch => {

  batch.test("Should emit pause event and resume when logging in a file with high frequency", t => {
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
      } else {
        resumed = true;
      }
    });

    const logger = log4js.getLogger();
    while (!paused && !resumed) {
      if (!paused) {
        logger.info("This is a test for emitting drain event");
      }
    }
    t.end();
  });


  batch.test("Should emit pause event and resume when logging in a date file with high frequency", (t) => {
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
      } else {
        resumed = true;
      }
    });

    const logger = log4js.getLogger();
    while (!paused && !resumed) {
      if (!paused)
        logger.info("This is a test for emitting drain event in date file logger");
    }
    t.end();

  });

  batch.end();
});
