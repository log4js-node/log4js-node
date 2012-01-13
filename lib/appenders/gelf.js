var compress = require('compress-buffer').compress;
var layouts = require('../layouts');
var levels = require('../levels');
var dgram = require('dgram');
var util = require('util');

/**
 * GELF appender that supports sending UDP packets to a GELF compatible server such as Graylog
 *
 * @param layout a function that takes a logevent and returns a string (defaults to none).
 * @param host - host to which to send logs (default:localhost)
 * @param port - port at which to send logs to (default:12201)
 * @param hostname - hostname of the current host (default:os hostname)
 * @param facility - facility to log to (default:nodejs-server)
 */
function gelfAppender (layout, host, port, hostname, facility, externalClient) {

    var logEventBuffer = [];

    LOG_EMERG=0;    // system is unusable
    LOG_ALERT=1;    // action must be taken immediately
    LOG_CRIT=2;     // critical conditions
    LOG_ERR=3;      // error conditions
    LOG_ERROR=3;    // because people WILL typo
    LOG_WARNING=4;  // warning conditions
    LOG_NOTICE=5;   // normal, but significant, condition
    LOG_INFO=6;     // informational message
    LOG_DEBUG=7;    // debug-level message

    var levelMapping = {};
    levelMapping[levels.ALL] = LOG_DEBUG;
    levelMapping[levels.TRACE] = LOG_DEBUG;
    levelMapping[levels.DEBUG] = LOG_DEBUG;
    levelMapping[levels.INFO] = LOG_INFO;
    levelMapping[levels.WARN] = LOG_WARNING;
    levelMapping[levels.ERROR] = LOG_ERR;
    levelMapping[levels.FATAL] = LOG_CRIT;

    host = host || 'localhost';
    port = port || 12201;
    hostname = hostname || require('os').hostname();
    facility = facility || 'nodejs-server';
    layout = layout || layouts.patternLayout('%m');

    var client = externalClient || dgram.createSocket("udp4");

    process.on('exit', function() {
        if (client) client.close();
    });

    function preparePacket(loggingEvent) {
        var msg = {};
        msg.full_message = layout(loggingEvent);
        msg.short_message = msg.full_message;

        msg.version="1.0";
        msg.timestamp = msg.timestamp || new Date().getTime() / 1000 >> 0;
        msg.host = hostname;
        msg.level = levelMapping[loggingEvent.level || levels.DEBUG];
        msg.facility = facility;
        return msg;
    }

    function flushBuffer() {
        while (logEventBuffer.length > 0) {
            var message = preparePacket(logEventBuffer.shift());
            var packet = compress(new Buffer(JSON.stringify(message)));
            if (packet.length > 8192) {
                util.debug("Message packet length (" + packet.length + ") is larger than 8k. Not sending");
            } else {
                sendPacket(packet);
            }
        }
    }

    function sendPacket(packet) {
        try {
            client.send(packet, 0, packet.length, port, host);
        } catch(e) {}
    }

    return function(loggingEvent) {
        logEventBuffer.push(loggingEvent);
        flushBuffer();
    };
}

function configure(config) {
    var layout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }
    return gelfAppender(layout, config.host, config.port, config.hostname, config.facility, config.client);
}

exports.name = "gelf";
exports.appender = gelfAppender;
exports.configure = configure;
