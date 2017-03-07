'use strict';

let layouts = require('../layouts');
let redis = require('redis');
let util = require('util');

function redisAppender(host, port, pass, channel, layout) {
  layout = layout || layouts.messagePassThroughLayout;
  const redisClient = redis.createClient(port, host, { auth_pass: pass });
  redisClient.on('error', function (err) {
    if (err) {
      console.error('log4js.redisAppender - %s:%p Error: %s', host, port, util.inspect(err));
    }
  });
  return function (loggingEvent) {
    const message = layout(loggingEvent);
    redisClient.publish(channel, message, function (err) {
      if (err) {
        console.error('log4js.redisAppender - %s:%p Error: %s', host, port, util.inspect(err));
      }
    });
  };
}

function configure(config) {
  const layout, host, port, pass, channel;
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
