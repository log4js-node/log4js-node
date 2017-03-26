'use strict';

const dgram = require('dgram');
const util = require('util');

function sendLog(udp, host, port, logObject) {
  const buffer = new Buffer(JSON.stringify(logObject));

  /* eslint no-unused-vars:0 */
  udp.send(buffer, 0, buffer.length, port, host, (err, bytes) => {
    if (err) {
      console.error('log4js.logstashUDP - %s:%p Error: %s', host, port, util.inspect(err));
    }
  });
}


function logstashUDP(config, layout) {
  const udp = dgram.createSocket('udp4');
  const type = config.logType ? config.logType : config.category;

  if (!config.fields) {
    config.fields = {};
  }

  function log(loggingEvent) {
    /*
     https://gist.github.com/jordansissel/2996677
     {
     'message'    => 'hello world',
     '@version'   => '1',
     '@timestamp' => '2014-04-22T23:03:14.111Z',
     'type'       => 'stdin',
     'host'       => 'hello.local'
     }
     @timestamp is the ISO8601 high-precision timestamp for the event.
     @version is the version number of this json schema
     Every other field is valid and fine.
     */
    /* eslint no-prototype-builtins:1,no-restricted-syntax:[1, "ForInStatement"] */
    if (loggingEvent.data.length > 1) {
      const secondEvData = loggingEvent.data[1];
      Object.keys(secondEvData).forEach((key) => {
        config.fields[key] = secondEvData[key];
      });
    }
    config.fields.level = loggingEvent.level.levelStr;
    config.fields.category = loggingEvent.categoryName;

    const logObject = {
      '@version': '1',
      '@timestamp': (new Date(loggingEvent.startTime)).toISOString(),
      type: type,
      message: layout(loggingEvent),
      fields: config.fields
    };

    const keys = Object.keys(config.fields);
    for (let i = 0, length = keys.length; i < length; i += 1) {
      logObject[keys[i]] = config.fields[keys[i]];
    }
    sendLog(udp, config.host, config.port, logObject);
  }

  log.shutdown = function (cb) {
    udp.close(cb);
  };

  return log;
}

function configure(config, layouts) {
  let layout = layouts.dummyLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

  return logstashUDP(config, layout);
}

module.exports.configure = configure;
