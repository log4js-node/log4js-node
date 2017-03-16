'use strict';

const layouts = require('../layouts');
const redis = require('redis');
const util = require('util');

let layout;

function redisAppender(config, layout = layouts.messagePassThroughLayout) {
  const redisClient = redis.createClient(config.port, config.host, { auth_pass: config.pass });
  redisClient.on('error', (err) => {
    if (err) {
      console.error('log4js.redisAppender - %s:%p Error: %s', config.host, config.port, util.inspect(err));
    }
  });
  return function (loggingEvent) {
    const message = layout(loggingEvent);
    redisClient.publish(config.channel, message, (err) => {
      if (err) {
        console.error('log4js.redisAppender - %s:%p Error: %s', config.host, config.port, util.inspect(err));
      }
    });
  };
}

function configure(config) {
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

  return redisAppender(config, layout);
}

module.exports.appender = redisAppender;
module.exports.configure = configure;
