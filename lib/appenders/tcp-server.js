const debug = require('debug')('log4js:tcp-server');
const net = require('net');
const clustering = require('../clustering');
const LoggingEvent = require('../LoggingEvent');

const send = (data) => {
  if (data) {
    const event = LoggingEvent.deserialise(data);
    clustering.send(event);
  }
};

exports.configure = (config) => {
  debug('configure called with ', config);
  // dummy shutdown if we're not master
  let shutdown = (cb) => { cb(); };

  clustering.onlyOnMaster(() => {
    const server = net.createServer((socket) => {
      socket.setEncoding('utf8');
      socket.on('data', send);
      socket.on('end', send);
    });

    server.listen(config.port || 5000, config.host || 'localhost', () => {
      debug(`listening on ${config.host || 'localhost'}:${config.port || 5000}`);
      server.unref();
    });

    shutdown = (cb) => {
      debug('shutdown called.');
      server.close(cb);
    };
  });

  return {
    shutdown
  };
};
