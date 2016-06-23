"use strict";
var zlib = require('zlib');
var layouts = require('../layouts');
var levels = require('../levels');
var dgram = require('dgram');
var util = require('util');
var debug = require('../debug')('GELF Appender');

var LOG_EMERG=0;    // system is unusable
var LOG_ALERT=1;    // action must be taken immediately
var LOG_CRIT=2;     // critical conditions
var LOG_ERR=3;      // error conditions
var LOG_ERROR=3;    // because people WILL typo
var LOG_WARNING=4;  // warning conditions
var LOG_NOTICE=5;   // normal, but significant, condition
var LOG_INFO=6;     // informational message
var LOG_DEBUG=7;    // debug-level message

var levelMapping = {};
levelMapping[levels.ALL] = LOG_DEBUG;
levelMapping[levels.TRACE] = LOG_DEBUG;
levelMapping[levels.DEBUG] = LOG_DEBUG;
levelMapping[levels.INFO] = LOG_INFO;
levelMapping[levels.WARN] = LOG_WARNING;
levelMapping[levels.ERROR] = LOG_ERR;
levelMapping[levels.FATAL] = LOG_CRIT;

var client;

/**
 * GELF appender that supports sending UDP packets to a GELF compatible server such as Graylog
 *
 * @param layout a function that takes a logevent and returns a string (defaults to none).
 * @param host - host to which to send logs (default:localhost)
 * @param port - port at which to send logs to (default:12201)
 * @param hostname - hostname of the current host (default:os hostname)
 * @param facility - facility to log to (default:nodejs-server)
 */
 /* jshint maxstatements:21 */
function gelfAppender (layout, host, port, hostname, facility) {
  var config, customFields;
  if (typeof(host) === 'object') {
    config = host;
    host = config.host;
    port = config.port;
    hostname = config.hostname;
    facility = config.facility;
    customFields = config.customFields;
  }

  host = host || 'localhost';
  port = port || 12201;
  hostname = hostname || require('os').hostname();
  layout = layout || layouts.messagePassThroughLayout;

  var defaultCustomFields = customFields || {};

  if(facility) {
    defaultCustomFields._facility = facility;
  }

  client = dgram.createSocket("udp4");

  process.on('exit', function() {
    if (client) client.close();
  });

  /**
   * Add custom fields (start with underscore )
   * - if the first object passed to the logger contains 'GELF' field,
   *   copy the underscore fields to the message
   * @param loggingEvent
   * @param msg
   */
  function addCustomFields(loggingEvent, msg){

    /* append defaultCustomFields firsts */
    Object.keys(defaultCustomFields).forEach(function(key) {
      // skip _id field for graylog2, skip keys not starts with UNDERSCORE
      if (key.match(/^_/) && key !== "_id") {
        msg[key] = defaultCustomFields[key];
      }
    });

    /* append custom fields per message */
    var data = loggingEvent.data;
    if (!Array.isArray(data) || data.length === 0) return;
    var firstData = data[0];

    if (!firstData.GELF) return; // identify with GELF field defined
    // Remove the GELF key, some gelf supported logging systems drop the message with it
    delete firstData.GELF;
    Object.keys(firstData).forEach(function(key) {
      // skip _id field for graylog2, skip keys not starts with UNDERSCORE
      if (key.match(/^_/) || key !== "_id") {
        msg[key] = firstData[key];
      }
    });

    /* the custom field object should be removed, so it will not be looged by the later appenders */
    loggingEvent.data.shift();
  }

  function preparePacket(loggingEvent) {
    var msg = {};
    addCustomFields(loggingEvent, msg);
    // the issue: some loggers (eg 'connect-logger') only could pass in the log level and either formatted string or
    // data object returned by the formatting function. In the later case (when the data object is returned) we could
    // be using that data object to send data we need using GELF. BUT, gelf will not accept the packets with no
    // short_messages in them, and the only way to put MEANINGFUL data in the short message (eg HTTP <method> <url>)
    // is to write it in the [short_message] custom field returned by the 'connect-logger'. Example of the data
    // returned by custom formatting function from 'connect-logger':
    // { res: { statusCode: 304, body: '' },
    //   req:
    //   { url: '/api/call/something',
    //     headers:
    //     { host: 'localhost:5000',
    //       connection: 'keep-alive',
    //       accept: 'application/json',
    //       'save-data': 'on',
    //       'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
    //       referer: 'http://localhost:5000/explorer/',
    //       'accept-encoding': 'gzip, deflate, sdch',
    //       'accept-language': 'en-US,en;q=0.8,ru;q=0.6',
    //       'if-none-match': 'W/"1c1-aKbQ1O4ELxIEyWtW2pYWnQ"' },
    //     method: 'GET',
    //     httpVersion: '1.1',
    //     body: '{}' },
    //   responseTime: 3562,
    //   short_message: 'HTTP GET /api/call/something',
    //   GELF: true
    // }
    // NOTE: short_message is added to the custom object to it is expected to be sent to the GELF server.
    // And we can't use layout(loggingEvent) to create an appropriate short_message cause the `data` has already been
    // removed from the loggingEvent by `addCustomFields` function
    if (!msg.short_message)
      msg.short_message = layout(loggingEvent);

    msg.version="1.1";
    msg.timestamp = msg.timestamp || new Date().getTime() / 1000; // log should use millisecond
    msg.host = hostname;
    msg.level = levelMapping[loggingEvent.level || levels.DEBUG];
    return msg;
  }

  function sendPacket(packet) {
    try {
      client.send(packet, 0, packet.length, port, host);
    } catch(e) {}
  }

  return function(loggingEvent) {
    var message = preparePacket(loggingEvent);
    zlib.gzip(new Buffer(JSON.stringify(message)), function(err, packet) {
      if (err) {
        console.error(err.stack);
      } else {
        if (packet.length > 8192) {
          debug("Message packet length (" + packet.length + ") is larger than 8k. Not sending");
        } else {
          sendPacket(packet);
        }
      }
    });
  };
}

function configure(config) {
  var layout;
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

exports.appender = gelfAppender;
exports.configure = configure;
exports.shutdown = shutdown;
