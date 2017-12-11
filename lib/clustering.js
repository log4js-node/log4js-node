const debug = require('debug')('log4js:clustering');

let cluster;
try {
  cluster = require('cluster'); // eslint-disable-line global-require
} catch (e) {
  debug('Clustering support disabled because require(cluster) threw an error: ', e);
}

module.exports = (config) => {
  const disabled = config.disableClustering || !cluster;
  const pm2 = config.pm2;
  const pm2InstanceVar = config.pm2InstanceVar || 'NODE_APP_INSTANCE';
  const listeners = [];

  debug(`clustering disabled ? ${disabled}`);
  debug(`cluster.isMaster ? ${cluster && cluster.isMaster}`);
  debug(`pm2 enabled ? ${pm2}`);
  debug(`pm2InstanceVar = ${pm2InstanceVar}`);
  debug(`process.env[${pm2InstanceVar}] = ${process.env[pm2InstanceVar]}`);

  const isPM2Master = () => pm2 && process.env[pm2InstanceVar] === '0';
  const isMaster = () => disabled || cluster.isMaster || isPM2Master();
  const isWorker = () => !isMaster();

  // in a multi-process node environment, worker loggers will use
  // process.send
  const receiver = (worker, message) => {
    // prior to node v6, the worker parameter was not passed (args were message, handle)
    debug('cluster message received from worker ', worker, ': ', message);
    if (worker.topic && worker.data) {
      message = worker;
      worker = undefined;
    }
    if (message && message.topic && message.topic === 'log4js:message') {
      debug('received message: ', message.data);
      const logEvent = LoggingEvent.deserialise(message.data);
      listeners.forEach(l => l(logEvent));
    }
  };

  // just in case configure is called after shutdown
  pm2 && process.removeListener('message', receiver);
  cluster.removeListener('message', receiver);
  if (config.disableClustering) {
    debug('Not listening for cluster messages, because clustering disabled.');
  } else if (isPM2Master()) {
    // PM2 cluster support
    // PM2 runs everything as workers - install pm2-intercom for this to work.
    // we only want one of the app instances to write logs
    debug('listening for PM2 broadcast messages');
    process.on('message', receiver);
  } else if (cluster.isMaster) {
    debug('listening for cluster messages');
    cluster.on('message', receiver);
  } else {
    debug('not listening for messages, because we are not a master process');
  }


  return {
    onlyOnMaster: (fn) => {
      if (isMaster()) {
        fn();
      }
    },
    onlyOnWorker: (fn) => {
      if (isWorker()) {
        fn();
      }
    },
    isMaster: isMaster,
    isWorker: isWorker,
    send: (msg) => {

    },
    onMessage: (listener) => {
      listeners.push(listener);
    }
  };
};
