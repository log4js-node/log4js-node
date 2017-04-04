
"use strict";


var layouts = require('log4js').layouts;
var net = require('net')
, util = require('util');
var url=require('url');

var socket;
var log_queue = [];
var connection_state = 0;
var disable_logging = false;

/**
 * Description Appender
 * @method tcpAppender
 * @param {} config
 * @param {} layout
 * @return FunctionExpression
 */
function tcpAppender (config, layout) {

  var path = config.path || 'tcp://127.0.0.1:9838'
  
  var parsedUrl = url.parse(path);
 

  var host = parsedUrl.hostname;
  var port = parsedUrl.port;

  disable_logging = config.disable_logging || false;

  socket = new net.Socket();
  


  var backoff = require('backoff');

  var ebackoff = backoff.exponential({
      randomisationFactor: 0,
      initialDelay: 1000*1, // 1 sec
      maxDelay: 1000*1*60,//10 mins
      factor: 3 //1 sec, 30 sec, 1 min (60), (2min) 120 
  });

  ebackoff.failAfter(10);
  socket_listeners(host, port,ebackoff);
  socket.connect(port,host);

    

  var type = config.logType ? config.logType : config.category;
  
  layout = layout || layouts.dummylayout;


  if(!config.fields) {
    config.fields = {};
  }


  return function log(loggingEvent) {

    var logObject = layout(loggingEvent);
      //console.log(logObject);
      sendLog(socket,logObject);
    
    }
}


function log(msg){
  if(!disable_logging)
    console.log(msg);
}

function socket_listeners(host, port, ebackoff)
{

    socket.on('error', function(err){
      //log('slog4js: ' + err.message);
      //if (errcallback){
        //errcallback(err);
      //}
    });

    ebackoff.on('backoff', function(number, delay) {
       log('slog4js: Retrying attempt... ' + number + ' after  ' + delay/1000 + ' s');
    });

    ebackoff.on('ready', function(number, delay) {
        socket.connect(port,host);
    });

    ebackoff.on('fail', function() {
       connection_state = -1; // will not connect 
       log('slog4js: Exceeded all attempts to connect');
    });

   socket.on('close', function(){
      log('slog4js: socket closed');
      connection_state = 0; //connecting
      ebackoff.backoff();
    });


    socket.on('connect', function() {
      ebackoff.reset();
      log('slog4js: socket connected');
      connection_state = 1;  //connected
      flush();

      //callback(null,true);
    });

}



function flush()
{
//empty queue:
    while(log_queue.length>0 && connection_state == 1)
    {

      var msg = log_queue.pop();
      post_message(msg);
    } 
}
function post_message(logObject){
   try{
        socket.write(JSON.stringify(logObject) + '\n', function(err){
              if(err)  
                log("slog4js: ERROR ==========> Writing to socket threw error: " + err.message);
        });
    }
    catch(err){
        //at times this is duplicate as underlying layer calls error callback and then throws error.
        //("ERROR ==========> Error thrown by native socket: " + err.message);
    }
}

/**
 * Description log function
 * @method sendLog
 * @param {} socket
 * @param {} logObject
 * @return 
 */
function sendLog(socket, logObject) {

   if(connection_state == - 1)
      return;
        //log("slog4js: ERROR ==========> ignoring message as failed to connect to socket");
    

    if(connection_state == 1)
      post_message(logObject);

    if(connection_state == 0)
      log_queue.push(logObject);
    

}

/**
 * Description configure
 * @method configure
 * @param {} config
 * @return CallExpression
 */
function configure(config) {
  var layout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return tcpAppender(config, layout);
}


exports.appender = tcpAppender;
exports.configure = configure;

