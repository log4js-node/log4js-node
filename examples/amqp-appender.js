//Note that amqp appender needs node-amqp to work.
var log4js = require('../lib/log4js')
  , log
  , amqpLogger
  , i = 0;
log4js.configure({
  "appenders": [
    {
      type: "console",
      category: "test"
    },
    {
      "connection": {
        "url": "amqp://guest:guest@localhost:5672"
      },
      "exchange": {
        "name": "logExchange"
      },
      "category": "amqp"
    }
  ]
});
log = log4js.getLogger("test");
amqpLogger = log4js.getLogger("amqp");

function doTheLogging(x) {
  log.info("Logging something %d", x);
  amqpLogger.info("Logging something %d", x);
}

for (; i < 500; i++) {
  doTheLogging(i);
}
