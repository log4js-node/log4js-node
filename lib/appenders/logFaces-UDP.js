/**
 * logFaces appender sends JSON formatted log events to logFaces receivers.
 * There are two types of receivers supported - raw UDP sockets (for server side apps),
 * and HTTP (for client side apps). Depending on the usage, this appender
 * requires either of the two:
 *
 * For UDP require 'dgram', see 'https://nodejs.org/api/dgram.html'
 * For HTTP require 'axios', see 'https://www.npmjs.com/package/axios'
 *
 * Make sure your project have relevant dependancy installed before using this appender.
 */

'use strict';

const util = require('util');
const dgram = require('dgram');

function datagram(config) {
  const sock = dgram.createSocket('udp4');
  const host = config.remoteHost || '127.0.0.1';
  const port = config.port || 55201;

  return function (event) {
    const buff = Buffer.from(JSON.stringify(event));
    sock.send(buff, 0, buff.length, port, host, (err) => {
      if (err) {
        console.error(`log4js.logFacesUDPAppender error sending to ${host}:${port}, error: `, err);
      }
    });
  };
}

/**
 * For UDP (node.js) use the following configuration params:
 *   {
 *      "type": "logFaces-UDP",       // must be present for instantiation
 *      "application": "LFS-TEST",        // name of the application (domain)
 *      "remoteHost": "127.0.0.1",        // logFaces server address (hostname)
 *      "port": 55201                     // UDP receiver listening port
 *   }
 *
 */
function logFacesUDPAppender(config) {
  const send = datagram(config);

  return function log(event) {
    // convert to logFaces compact json format
    const lfsEvent = {
      a: config.application || '', // application name
      t: event.startTime.getTime(), // time stamp
      p: event.level.levelStr, // level (priority)
      g: event.categoryName, // logger name
      m: format(event.data) // message text
    };

    // add context variables if exist
    Object.keys(event.context).forEach((key) => {
      lfsEvent[`p_${key}`] = event.context[key];
    });

    // send to server
    send(lfsEvent);
  };
}

function configure(config) {
  return logFacesUDPAppender(config);
}

function wrapErrorsWithInspect(items) {
  return items.map((item) => {
    if ((item instanceof Error) && item.stack) {
      return {
        inspect: function () {
          return `${util.format(item)}\n${item.stack}`;
        }
      };
    }

    return item;
  });
}

function format(logData) {
  const data = Array.isArray(logData)
    ? logData
    : Array.prototype.slice.call(arguments);
  return util.format.apply(util, wrapErrorsWithInspect(data));
}

module.exports.configure = configure;
