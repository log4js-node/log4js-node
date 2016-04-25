"use strict";
var HipChatClient = require('hipchat-client');
var layouts = require('../layouts');

exports.name = 'hipchat';
exports.appender  = hipchatAppender;
exports.configure = hipchatConfigure;

//hipchat has more limited colors
var colours = {
  ALL: "grey",
  TRACE: "purple",
  DEBUG: "purple",
  INFO: "green",
  WARN: "yellow",
  ERROR: "red",
  FATAL: "red",
  OFF: "grey"
};

function hipchatAppender(config, layout) {

	var notifier = hipchat.make(config.hipchat_room, config.hipchat_token);

  layout = layout || layouts.messagePassThroughLayout;

  return function(loggingEvent) {

    var data = {
      room_id: _config.room_id,
      from: _config.from,
      message: layout(loggingEvent, _config.timezoneOffset),
      format: _config.format,
      color: colours[loggingEvent.level.toString()],
      notify: _config.notify
    };

    client.api.rooms.message(data, function(err, res) {
      if (err) {
        throw err;
      }
    });
  }
}

function hipchatConfigure(config) {
	var layout;
	if (config.layout) {
		layout = layouts.layout(config.layout.type, config.layout);
	}
	return hipchatAppender(config, layout);
}
