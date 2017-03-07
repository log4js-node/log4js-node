'use strict';

const layouts = require('../layouts');
const redis = require('redis');
const util = require('util');

function redisAppender(host = '127.0.0.1', port = 6379, pass = '', channel = 'log', layout = layouts.messagePassThroughLayout) {
  const redisClient = redis.createClient(port, host, { auth_pass: pass });
  redisClient.on('error', (err) => {
    if (err) {
      console.error('log4js.redisAppender - %s:%p Error: %s', host, port, util.inspect(err));
    }
  });
  return function (loggingEvent) {
    const message = layout(loggingEvent);
    redisClient.publish(channel, message, (err) => {
      if (err) {
        console.error('log4js.redisAppender - %s:%p Error: %s', host, port, util.inspect(err));
      }
    });
  };
}

function configure(config) {
  return redisAppender(config.host, config.port, config.pass, config.channel, layouts.layout(config.layout.type, config.layout));
}

exports.appender = redisAppender;
exports.configure = configure;
