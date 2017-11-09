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
const axios = require('axios');

/**
 *
 * For HTTP (browsers or node.js) use the following configuration params:
 *   {
 *      "type": "logFaces-HTTP",       // must be present for instantiation
 *      "application": "LFS-TEST",        // name of the application (domain)
 *      "url": "http://lfs-server/logs",  // logFaces receiver servlet URL
 *   }
 */
function logFacesAppender(config) {
  const sender = axios.create({
    baseURL: config.url,
    timeout: config.timeout || 5000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
  });

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
    sender.post('', lfsEvent)
      .catch((error) => {
        if (error.response) {
          console.error(`log4js.logFaces-HTTP Appender error posting to ${config.url}: ${error.response.status} - ${error.response.data}`);
          return;
        }
        console.error(`log4js.logFaces-HTTP Appender error: ${error.message}`);
      });
  };
}

function configure(config) {
  return logFacesAppender(config);
}

function format(logData) {
  const data = Array.isArray(logData)
    ? logData
    : Array.prototype.slice.call(arguments);
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

module.exports.configure = configure;
