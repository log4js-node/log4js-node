const net = require('net');

module.exports = (config, clustering) => {
  // dummy shutdown if we're not master
  let shutdown = (cb) => { cb(); };

  clustering.onlyOnMaster(() => {
    const server = net.createServer((socket) => {
      socket.setEncoding('utf8');
      socket.on('data', clustering.send);
      socket.on('end', clustering.send);
    });

    server.listen(config.port || 5000, config.host || 'localhost', () => {
      server.unref();
    });

    shutdown = (cb) => {
      server.close(cb);
    };
  });

  return shutdown;
};
