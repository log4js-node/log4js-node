'use strict';

const layouts = require('../layouts');
const redis = require('redis');
const util = require('util');

function redisAppender(host, port, pass, channel, layout) {
  layout = layout || layouts.messagePassThroughLayout;
  const redisClient = redis.createClient(port, host, { auth_pass: pass });
  redisClient.on('error', (error) => {
    if (err) {
      console.error('log4js.redisAppender - %s:%p Error: %s', host, port, util.inspect(err));
    }
  });
  return function (loggingEvent) {
    const message = layout(loggingEvent);
    redisClient.publish(channel, message, (error) => {
      if (err) {
        console.error('log4js.redisAppender - %s:%p Error: %s', host, port, util.inspect(err));
      }
    });
  };
}

function configure(config) {
  const layout = config.layout ? layouts.layout(config.layout.type, config.layout) : null;
  const host = config.host ? config.host : '127.0.0.1';
  const port = config.port ? config.port : 6379;
  const pass = config.pass ? config.pass : '';
  const channel = config.channel ? config.channel : 'log';
  return redisAppender(host, port, pass, channel, layout);
}

exports.appender = redisAppender;
exports.configure = configure;
