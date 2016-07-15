/**
 * logFaces appender sends JSON formatted log events to logFaces server UDP receivers.
 * Events contain the following properties:
 *  - application name (taken from configuration)
 *  - host name (taken from underlying os)
 *  - time stamp
 *  - level
 *  - logger name (e.g. category)
 *  - thread name (current process id)
 *  - message text
 */

'use strict';
const dgram = require('dgram');
const layouts = require('../layouts');
const os = require('os');
const util = require('util');

function logFacesAppender(config, layout) {
  const lfsSock = dgram.createSocket('udp4');
  let localhost = '';

  if (os && os.hostname()) localhost = os.hostname().toString();

  let pid;

  if (process && process.pid) pid = process.pid;

  return function log(loggingEvent) {
    const lfsEvent = {
      a: config.application || '',                      // application name
      h: localhost,                                     // this host name
      t: loggingEvent.startTime.getTime(),              // time stamp
      p: loggingEvent.level.levelStr,                   // level (priority)
      g: loggingEvent.categoryName,                     // logger name
      r: pid,                                           // thread (process id)
      m: layout(loggingEvent)                           // message text
    };

    const buffer = new Buffer(JSON.stringify(lfsEvent));
    const lfsHost = config.remoteHost || '127.0.0.1';
    const lfsPort = config.port || 55201;

    /* eslint no-unused-vars:0 */
    lfsSock.send(buffer, 0, buffer.length, lfsPort, lfsHost, (err, bytes) => {
      if (err) {
        console.error('log4js.logFacesAppender send to %s:%d failed, error: %s',
          config.host, config.port, util.inspect(err));
      }
    });
  };
}

function configure(config) {
  let layout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  } else {
    layout = layouts.layout('pattern', { type: 'pattern', pattern: '%m' });
  }

  return logFacesAppender(config, layout);
}

module.exports.appender = logFacesAppender;
module.exports.configure = configure;
