const _ = require('lodash');
const debug = require('debug')('log4js:udp');
const os = require('os');
const dgram = require('dgram');
const util = require('util');

function sendLog(udp, host, port, logObject, logError) {
  debug('Log being sent over UDP');
  let buffer;
  try {
    buffer = Buffer.from(JSON.stringify(logObject));
  } catch (e) {
    debug('Could not serialise log event to JSON', e, logObject);
    logObject.message.data = ['Event could not be serialised to JSON: ' + e.message];
    buffer = Buffer.from(JSON.stringify(logObject));
  }

  udp.send(buffer, 0, buffer.length, port, host, err => {
    if (err) {
      logError(`log4js.udp - ${host}:${port} Error: ${util.inspect(err)}.`);
    }
  });
}

const defaultVersion = 1;
const defaultExtraDataProvider = loggingEvent => {
  if (loggingEvent.data.length > 1) {
    const secondEvData = loggingEvent.data[1];
    if (_.isPlainObject(secondEvData)) {
      return {fields: secondEvData};
    }
  }
  return {};
};

function udp(config, layout, logError) {
  const udp = dgram.createSocket('udp4');
  const extraDataProvider = _.isFunction(config.extraDataProvider)
    ? config.extraDataProvider
    : defaultExtraDataProvider;

  function log(loggingEvent) {
    const oriLogObject = {
      '@version': defaultVersion,
      '@timestamp': (new Date(loggingEvent.startTime)).toISOString(),
      'host': os.hostname(),
      'level': loggingEvent.level.levelStr.toUpperCase(),
      'category': loggingEvent.categoryName,
      'message': layout(loggingEvent)
    };
    const extraLogObject = extraDataProvider(loggingEvent) || {};
    const logObject = _.assign(oriLogObject, extraLogObject);

    sendLog(udp, config.host, config.port, logObject, logError);
  }

  log.shutdown = cb => udp.close(cb);

  debug('Appender has been set.');
  return log;
}

function configure(config, layouts, logError = console.error) {
  let layout = layouts.dummyLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return udp(config, layout, logError);
}

module.exports.configure = configure;
