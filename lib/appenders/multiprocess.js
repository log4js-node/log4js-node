'use strict';

const levels = require('../levels');
const net = require('net');

const END_MSG = '__LOG4JS__';

/**
 * Creates a server, listening on config.loggerPort, config.loggerHost.
 * Output goes to config.actualAppender (config.appender is used to
 * set up that appender).
 */
function logServer(config) {
  /**
   * Takes a utf-8 string, returns an object with
   * the correct log properties.
   */
  function deserializeLoggingEvent(clientSocket, msg) {
    let loggingEvent;
    try {
      loggingEvent = JSON.parse(msg);
      loggingEvent.startTime = new Date(loggingEvent.startTime);
      loggingEvent.level = levels.toLevel(loggingEvent.level.levelStr);
    } catch (e) {
      // JSON.parse failed, just log the contents probably a naughty.
      loggingEvent = {
        startTime: new Date(),
        categoryName: 'log4js',
        level: levels.ERROR,
        data: ['Unable to parse log:', msg]
      };
    }

    loggingEvent.remoteAddress = clientSocket.remoteAddress;
    loggingEvent.remotePort = clientSocket.remotePort;

    return loggingEvent;
  }

  const actualAppender = config.actualAppender;

  /* eslint prefer-arrow-callback:0 */
  const server = net.createServer(function serverCreated(clientSocket) {
    clientSocket.setEncoding('utf8');
    let logMessage = '';

    function logTheMessage(msg) {
      if (logMessage.length > 0) {
        actualAppender(deserializeLoggingEvent(clientSocket, msg));
      }
    }

    function chunkReceived(chunk) {
      let event;
      logMessage += chunk || '';
      if (logMessage.indexOf(END_MSG) > -1) {
        event = logMessage.substring(0, logMessage.indexOf(END_MSG));
        logTheMessage(event);
        logMessage = logMessage.substring(event.length + END_MSG.length) || '';
        // check for more, maybe it was a big chunk
        chunkReceived();
      }
    }

    clientSocket.on('data', chunkReceived);
    clientSocket.on('end', chunkReceived);
  });

  server.listen(config.loggerPort || 5000, config.loggerHost || 'localhost', function () {
    // allow the process to exit, if this is the only socket active
    server.unref();
  });

  function app(event) {
    return actualAppender(event);
  }

  app.shutdown = function (cb) {
    server.close(cb);
  };

  return app;
}

function workerAppender(config) {
  let canWrite = false;
  const buffer = [];
  let socket;

  function write(loggingEvent) {
    // JSON.stringify(new Error('test')) returns {}, which is not really useful for us.
    // The following allows us to serialize errors correctly.
    // Validate that we really are in this case
    if (loggingEvent && loggingEvent.stack && JSON.stringify(loggingEvent) === '{}') {
      loggingEvent = { stack: loggingEvent.stack };
    }
    socket.write(JSON.stringify(loggingEvent), 'utf8');
    socket.write(END_MSG, 'utf8');
  }

  function emptyBuffer() {
    let evt;

    /* eslint no-cond-assign:0 */
    while ((evt = buffer.shift())) {
      write(evt);
    }
  }

  function createSocket() {
    socket = net.createConnection(config.loggerPort || 5000, config.loggerHost || 'localhost');
    socket.on('connect', () => {
      emptyBuffer();
      canWrite = true;
    });
    socket.on('timeout', socket.end.bind(socket));
    // don't bother listening for 'error', 'close' gets called after that anyway
    socket.on('close', createSocket);
  }

  createSocket();

  function log(loggingEvent) {
    if (canWrite) {
      write(loggingEvent);
    } else {
      buffer.push(loggingEvent);
    }
  }
  log.shutdown = function (cb) {
    socket.removeAllListeners('close');
    socket.close(cb);
  };
  return log;
}

function createAppender(config) {
  if (config.mode === 'master') {
    return logServer(config);
  }

  return workerAppender(config);
}

function configure(config, layouts, findAppender) {
  if (config.appender && config.mode === 'master') {
    config.actualAppender = findAppender(config.appender);
  }
  return createAppender(config);
}

module.exports.configure = configure;
