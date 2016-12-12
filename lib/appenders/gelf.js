'use strict';

const zlib = require('zlib');
const layouts = require('../layouts');
const levels = require('../levels');
const dgram = require('dgram');
const util = require('util');
const OS = require('os');
const debug = require('debug')('log4js:gelf');

/* eslint no-unused-vars:0 */
const LOG_EMERG = 0;    // system is unusable(unused)
const LOG_ALERT = 1;    // action must be taken immediately(unused)
const LOG_CRIT = 2;     // critical conditions
const LOG_ERROR = 3;    // error conditions
const LOG_WARNING = 4;  // warning conditions
const LOG_NOTICE = 5;   // normal, but significant, condition(unused)
const LOG_INFO = 6;     // informational message
const LOG_DEBUG = 7;    // debug-level message

const levelMapping = {};
levelMapping[levels.ALL] = LOG_DEBUG;
levelMapping[levels.TRACE] = LOG_DEBUG;
levelMapping[levels.DEBUG] = LOG_DEBUG;
levelMapping[levels.INFO] = LOG_INFO;
levelMapping[levels.WARN] = LOG_WARNING;
levelMapping[levels.ERROR] = LOG_ERROR;
levelMapping[levels.FATAL] = LOG_CRIT;

let client;

/**
 * GELF appender that supports sending UDP packets to a GELF compatible server such as Graylog
 *
 * @param layout a function that takes a logevent and returns a string (defaults to none).
 * @param host - host to which to send logs (default:localhost)
 * @param port - port at which to send logs to (default:12201)
 * @param hostname - hostname of the current host (default:OS hostname)
 * @param facility - facility to log to (default:nodejs-server)
 */
/* eslint no-underscore-dangle:0 */
function gelfAppender(layout, host, port, hostname, facility) {
  let config;
  let customFields;
  if (typeof host === 'object') {
    config = host;
    host = config.host;
    port = config.port;
    hostname = config.hostname;
    facility = config.facility;
    customFields = config.customFields;
  }

  host = host || 'localhost';
  port = port || 12201;
  hostname = hostname || OS.hostname();
  layout = layout || layouts.messagePassThroughLayout;

  const defaultCustomFields = customFields || {};

  if (facility) {
    defaultCustomFields._facility = facility;
  }

  client = dgram.createSocket('udp4');

  process.on('exit', () => {
    if (client) client.close();
  });

  /**
   * Add custom fields (start with underscore )
   * - if the first object passed to the logger contains 'GELF' field,
   *   copy the underscore fields to the message
   * @param loggingEvent
   * @param msg
   */
  function addCustomFields(loggingEvent, msg) {
    /* append defaultCustomFields firsts */
    Object.keys(defaultCustomFields).forEach((key) => {
      // skip _id field for graylog2, skip keys not starts with UNDERSCORE
      if (key.match(/^_/) && key !== '_id') {
        msg[key] = defaultCustomFields[key];
      }
    });

    /* append custom fields per message */
    const data = loggingEvent.data;
    if (!Array.isArray(data) || data.length === 0) return;
    const firstData = data[0];

    if (!firstData.GELF) return; // identify with GELF field defined
    // Remove the GELF key, some gelf supported logging systems drop the message with it
    delete firstData.GELF;
    Object.keys(firstData).forEach((key) => {
      // skip _id field for graylog2, skip keys not starts with UNDERSCORE
      if (key.match(/^_/) || key !== '_id') {
        msg[key] = firstData[key];
      }
    });

    /* the custom field object should be removed, so it will not be looged by the later appenders */
    loggingEvent.data.shift();
  }

  function preparePacket(loggingEvent) {
    const msg = {};
    addCustomFields(loggingEvent, msg);
    msg.short_message = layout(loggingEvent);

    msg.version = '1.1';
    msg.timestamp = msg.timestamp || new Date().getTime() / 1000; // log should use millisecond
    msg.host = hostname;
    msg.level = levelMapping[loggingEvent.level || levels.DEBUG];
    return msg;
  }

  function sendPacket(packet) {
    client.send(packet, 0, packet.length, port, host, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  return (loggingEvent) => {
    const message = preparePacket(loggingEvent);
    zlib.gzip(new Buffer(JSON.stringify(message)), (err, packet) => {
      if (err) {
        console.error(err.stack);
      } else {
        if (packet.length > 8192) { // eslint-disable-line
          debug(`Message packet length (${packet.length}) is larger than 8k. Not sending`);
        } else {
          sendPacket(packet);
        }
      }
    });
  };
}

function configure(config) {
  let layout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return gelfAppender(layout, config);
}

function shutdown(cb) {
  if (client) {
    client.close(cb);
    client = null;
  }
}

module.exports.appender = gelfAppender;
module.exports.configure = configure;
module.exports.shutdown = shutdown;
