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

"use strict";
var dgram = require('dgram'), 
    layouts = require('../layouts'),
    os = require('os'),
    process = require('process'),
    util = require('util');

function logFacesAppender (config, layout) {
  var lfsSock = dgram.createSocket('udp4');
  
  return function log(loggingEvent) {
    var logObject = {
      a: config.application,               // application name
      h: os.hostname().toString(),         // this host name 
      t: loggingEvent.startTime.getTime(), // time stamp 
      p: loggingEvent.level.levelStr,      // level (priority)
      g: loggingEvent.categoryName,        // logger name
      r: process.pid,                      // thread (process id)   
      m: layout(loggingEvent)              // message text
    };
      
    var buffer = new Buffer(JSON.stringify(logObject));
     console.log(this.filename);
    lfsSock.send(buffer, 0, buffer.length, config.port, config.remoteHost, function(err, bytes) {
       if(err) {
         console.error("log4js.logFacesAppender send to %s:%d failed, error: %s", 
                        config.host, config.port, util.inspect(err));
       }
    });
  };
}

function configure(config) {
	var layout;
	if (config.layout) {
		layout = layouts.layout(config.layout.type, config.layout);
	}   
   
   return logFacesAppender(config, layout);
}

exports.appender = logFacesAppender;
exports.configure = configure;