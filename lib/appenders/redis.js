'use strict';

var layouts = require('../layouts');
var redis = require('redis');
var util = require('util');

function redisAppender(host, port, pass, channel, layout) {
  layout = layout || layouts.messagePassThroughLayout;
  var redisClient = redis.createClient(port, host, {auth_pass: pass});
  redisClient.on('error', function (err) {
    if (err) {
      console.error(
        'log4js.redisAppender - %s:%p Error: %s', host, port, util.inspect(err)
      );
    }
  });
  return function (loggingEvent) {
  var message = layout(loggingEvent);
    redisClient.publish(channel, message, function (err) {
      if (err) {
        console.error(
          'log4js.redisAppender - %s:%p Error: %s', host, port, util.inspect(err)
        );
      }
    });
  };
}

function configure(config) {
  var layout, host, port, pass, channel;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  host = config.host ? config.host : '127.0.0.1';
	port = config.port ? config.port : 6379;
	pass = config.pass ? config.pass : '';
	channel = config.channel ? config.channel : 'log';
	return redisAppender(host, port, pass, channel, layout);
}

exports.appender = redisAppender;
exports.configure = configure;
