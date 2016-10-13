"use strict";

var hipchat = require('hipchat-notifier');
// var layouts = require('../layouts');

/**
  @invoke as

  log4js.configure({
    "appenders": [
      {
        "type" : "hipchat",
        "hipchat_token": "< User token with Notification Privileges >",
        "hipchat_room": "< Room ID or Name >",
        // optionl
        "hipchat_from": "[ additional from label ]",
        "hipchat_notify": "[ notify boolean to bug people ]",
        "hipchat_host" : "api.hipchat.com"
      }
    ]
  });

  var logger = log4js.getLogger("hipchat");
  logger.warn("Test Warn message");

  @invoke
 */
module.exports = function(layouts, levels) {
  function hipchatNotifierResponseCallback(err, response, body){
    if(err) {
      throw err;
    }
  }

  var notifierLevel = {};
  notifierLevel[levels.TRACE] = "info";
  notifierLevel[levels.DEBUG] = "info";
  notifierLevel[levels.WARN]  = "warning";
  notifierLevel[levels.ERROR] = "failure";
  notifierLevel[levels.FATAL] = "failure";

  function hipchatAppender(config, appenderByName) {

  	var notifier = hipchat.make(config.hipchat_room, config.hipchat_token);
    notifier.setRoom(config.hipchat_room);
    notifier.setFrom(config.hipchat_from || '');
    notifier.setNotify(config.hipchat_notify || false);

    if (config.hipchat_host) {
      notifier.setHost(config.hipchat_host);
    }

    var layout = layouts.layout(config.layout);

    // @lint W074 This function's cyclomatic complexity is too high. (10)
    return function(loggingEvent) {

      var notifierFn = notifierLevel[loggingEvent.level] || "success";

      // @TODO, re-work in timezoneOffset ?
      var layoutMessage = layout(loggingEvent);

      // dispatch hipchat api request, do not return anything
      //  [overide hipchatNotifierResponseCallback]
      notifier[notifierFn](layoutMessage, config.hipchat_response_callback ||
        hipchatNotifierResponseCallback);
    };
  }

  return function hipchatConfigure(config) {
  	var layout;

  	if (!config.layout) {
  		config.layout = layouts.messagePassThroughLayout;
  	}

  	return hipchatAppender(config, layout);
  };

};
