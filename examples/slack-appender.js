//Note that hipchat appender needs hipchat-client to work.
//If you haven't got hipchat-client installed, you'll get cryptic
//"cannot find module" errors when using the hipchat appender
var log4js = require('../lib/log4js');

log4js.configure({
  "appenders": [
    {
      "type" : "slack",
      "token": 'TOKEN',
      "channel_id": "#CHANNEL",
      "username": "USERNAME",
      "format": "text",
      "category" : "slack",
      "icon_url" : "ICON_URL"
    }
  ]
});

var logger = log4js.getLogger("slack");
logger.warn("Test Warn message");
logger.info("Test Info message");
logger.debug("Test Debug Message");
logger.trace("Test Trace Message");
logger.fatal("Test Fatal Message");
logger.error("Test Error Message");
