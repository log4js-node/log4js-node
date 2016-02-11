"use strict";
var HipChatClient = require('hipchat-client');
var layouts = require('../layouts');
var layout;

var hipchat, config;

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

function hipchatAppender(_config, _layout) {

    config = _config;
    layout = _layout || layouts.basicLayout;

    return function (loggingEvent) {

        var data = {
            room_id: config.room_id,
            from: config.from,
            message: layout(loggingEvent, config.timezoneOffset),
            format: config.format,
            color: colours[loggingEvent.level.toString()],
            notify: config.notify
        };

        hipchat.api.rooms.message(data, function (err, res) {
            if (err) { throw err; }
            console.log(res);
        });
    };
}

function configure(_config) {
    config = _config;

    if (_config.layout) {
        layout = layouts.layout(_config.layout.type, _config.layout);
    }

    hipchat = new HipChatClient(_config.api_key);

    return hipchatAppender(_config, layout);
}

exports.appender = hipchatAppender;
exports.configure = configure;
