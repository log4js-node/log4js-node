//Note that loggly appender needs node-loggly to work.
//If you haven't got node-loggly installed, you'll get cryptic
//"cannot find module" errors when using the loggly appender
var log4js = require('../lib/log4js')
, log
, logmailer
, i = 0;
log4js.configure({
  "appenders": [
    {
      type: "console",
      category: "test"
    },
    {
      "type": "loggly",
      "token": "12345678901234567890",
      "subdomain": "your-subdomain",
      "tags": ["test"],
      "category": "test"
    }
  ]
});

var logger = log4js.getLogger("test");
logger.info("Test log message");
logger.debug("Test log message");