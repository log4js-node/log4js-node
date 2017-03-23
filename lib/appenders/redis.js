'use strict';

const redis = require('redis');
const util = require('util');

function redisAppender(config, layout) {
  const host = config.host || '127.0.0.1';
  const port = config.port || 6379;
  const auth = config.pass ? { auth_pass: config.pass } : {};
  const redisClient = redis.createClient(port, host, auth);

  redisClient.on('error', (err) => {
    if (err) {
      console.error(`log4js.redisAppender - ${host}:${port} Error: ${util.inspect(err)}`);
    }
  });

  return function (loggingEvent) {
    const message = layout(loggingEvent);
    redisClient.publish(config.channel, message, (err) => {
      if (err) {
        console.error(`log4js.redisAppender - ${host}:${port} Error: ${util.inspect(err)}`);
      }
    });
  };
}

function configure(config, layouts) {
  let layout = layouts.messagePassThroughLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

  return redisAppender(config, layout);
}

module.exports.configure = configure;
