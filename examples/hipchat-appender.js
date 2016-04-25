
/**
 * !!! The hipchat-appender requires `hipchat-notifier` from npm
 *   - e.g. list as a dependency in your application's package.json
 */

var log4js = require('../lib/log4js');

log4js.configure({
  "appenders": [
    {
      "type" : "hipchat",
      "hipchat_token": "< User token with Notification Privileges >",
      "hipchat_room": "< Room ID or Name >",
      // optionl
      "hipchat_from": "[ additional from label ]",
      "hipchat_notify": "[ notify boolean to bug people ]"
    }
  ]
});

var logger = log4js.getLogger("hipchat");
logger.warn("Test Warn message");//yello
logger.info("Test Info message");//green
logger.debug("Test Debug Message");//hipchat client has limited color scheme
logger.trace("Test Trace Message");//so debug and trace are the same color: purple
logger.fatal("Test Fatal Message");//hipchat client has limited color scheme
logger.error("Test Error Message");// fatal and error are same color: red
logger.all("Test All message");//grey
//logger.debug("Test log message");
