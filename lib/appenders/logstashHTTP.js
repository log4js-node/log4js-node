/**
 * This appender is deprecated, please apply any bugfixes or changes
 * to https://github.com/log4js-node/logstash-http
 * logstashHTTP appender sends JSON formatted log events to logstashHTTP receivers.
 *
 * HTTP require 'axios', see 'https://www.npmjs.com/package/axios'
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
 *      "type": "logstashHTTP",       // must be present for instantiation
 *      "application": "logstash-test",        // name of the application
 *      "logType": "application",        // type of the application
 *      "logChannel": "test",        // channel of the application
 *      "url": "http://lfs-server/_bulk",  // logstash receiver servlet URL
 *   }
 */
function logstashHTTPAppender(config) {
  const sender = axios.create({
    baseURL: config.url,
    timeout: config.timeout || 5000,
    headers: { 'Content-Type': 'application/x-ndjson' },
    withCredentials: true,
  });

  const appender = function log(event) {
    const logstashEvent = [
      {
        index: {
          _index: config.application,
          _type: config.logType,
        },
      },
      {
        message: format(event.data), // eslint-disable-line
        context: event.context,
        level: event.level.level / 100,
        level_name: event.level.levelStr,
        channel: config.logChannel,
        datetime: (new Date(event.startTime)).toISOString(),
        extra: {},
      },
    ];
    const logstashJSON = `${JSON.stringify(logstashEvent[0])}\n${JSON.stringify(logstashEvent[1])}\n`;

    // send to server
    sender.post('', logstashJSON)
      .catch((error) => {
        if (error.response) {
          console.error(`log4js.logstashHTTP Appender error posting to ${config.url}: ${error.response.status} - ${error.response.data}`);
          return;
        }
        console.error(`log4js.logstashHTTP Appender error: ${error.message}`);
      });
  };

  appender.deprecated = '@log4js-node/logstash-http';

  return appender;
}

function configure(config) {
  return logstashHTTPAppender(config);
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
