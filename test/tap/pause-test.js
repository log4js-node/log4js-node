const tap = require("tap");
const log4js = require("../../lib/log4js");

tap.test("Drain event test", batch => {

  batch.test("Should emit pause event and resume when logging in a file with high frequency", t => {
    // Generate logger with 5MB of highWaterMark config
    log4js.configure({
      appenders: {
        file: { type: "file", filename: "logs/drain.log", highWaterMark: 5 * 1024 * 1024 }
      },
      categories: {
        default: { appenders: ["file"], level: "debug" }
      }
    });

    let onPause = false;
    let onResume = false;

    process.on("pause", value => {
      if (value) {
        onPause = true;
      } else {
        onResume = true;
      }
    });

    const logger = log4js.getLogger();
    while (onPause === false && onResume === false) {
      if (onPause === false)
        logger.info("This is a test for emitting drain event");
    }
    t.end();
  });

  batch.end();
});
