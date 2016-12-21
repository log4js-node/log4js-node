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
/* eslint global-require:0 */

'use strict';

const util = require('util');

const context = {};

function datagram(config) {
  const sock = require('dgram').createSocket('udp4');
  const host = config.remoteHost || '127.0.0.1';
  const port = config.port || 55201;

  return function (event) {
    const buff = new Buffer(JSON.stringify(event));
    sock.send(buff, 0, buff.length, port, host, (err) => {
      if (err) {
        console.error('log4js.logFacesAppender failed to %s:%d, error: %s',
          host, port, err);
      }
    });
  };
}

function servlet(config) {
  const axios = require('axios').create();
  axios.defaults.baseURL = config.url;
  axios.defaults.timeout = config.timeout || 5000;
  axios.defaults.headers = { 'Content-Type': 'application/json' };
  axios.defaults.withCredentials = true;

  return function (lfsEvent) {
    axios.post('', lfsEvent)
      .then((response) => {
        if (response.status !== 200) {
          console.error('log4js.logFacesAppender post to %s failed: %d',
            config.url, response.status);
        }
      })
      .catch((response) => {
        console.error('log4js.logFacesAppender post to %s excepted: %s',
          config.url, response.status);
      });
  };
}

/**
 * For UDP (node.js) use the following configuration params:
 *   {
*      "type": "logFacesAppender",       // must be present for instantiation
*      "application": "LFS-TEST",        // name of the application (domain)
*      "remoteHost": "127.0.0.1",        // logFaces server address (hostname)
*      "port": 55201                     // UDP receiver listening port
*   }
 *
 * For HTTP (browsers or node.js) use the following configuration params:
 *   {
*      "type": "logFacesAppender",       // must be present for instantiation
*      "application": "LFS-TEST",        // name of the application (domain)
*      "url": "http://lfs-server/logs",  // logFaces receiver servlet URL
*   }
 */
function logFacesAppender(config) {
  let send = config.send;
  if (send === undefined) {
    send = (config.url === undefined) ? datagram(config) : servlet(config);
  }

  return function log(event) {
    // convert to logFaces compact json format
    const lfsEvent = {
      a: config.application || '',   // application name
      t: event.startTime.getTime(),  // time stamp
      p: event.level.levelStr,       // level (priority)
      g: event.categoryName,         // logger name
      m: format(event.data)          // message text
    };

    // add context variables if exist
    Object.keys(context).forEach((key) => {
      lfsEvent[`p_${key}`] = context[key];
    });

    // send to server
    send(lfsEvent);
  };
}

function configure(config) {
  return logFacesAppender(config);
}

function setContext(key, value) {
  context[key] = value;
}

function format(logData) {
  const data = Array.isArray(logData) ?
               logData : Array.prototype.slice.call(arguments);
  return util.format.apply(util, wrapErrorsWithInspect(data));
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

module.exports.appender = logFacesAppender;
module.exports.configure = configure;
module.exports.setContext = setContext;
