// The connect/express logger was added to log4js by danbell. This allows connect/express servers to log using log4js.
// https://github.com/nomiddlename/log4js-node/wiki/Connect-Logger

// load modules
const log4js = require('log4js');
const express = require('express');
const app = express();

// config
log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: { type: 'file', filename: 'logs/log4jsconnect.log' }
  },
  categories: {
    default: { appenders: ['console'], level: 'debug' },
    log4jslog: { appenders: ['file'], level: 'debug' }
  }
});

// define logger
const logger = log4js.getLogger('log4jslog');

// set at which time msg is logged print like: only on error & above
// logger.setLevel('ERROR');

// express app
app.configure(() => {
  app.use(express.favicon(''));
	// app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO }));
	// app.use(log4js.connectLogger(logger, { level: 'auto', format: ':method :url :status' }));

	// ### AUTO LEVEL DETECTION
	// http responses 3xx, level = WARN
	// http responses 4xx & 5xx, level = ERROR
	// else.level = INFO
  app.use(log4js.connectLogger(logger, { level: 'auto' }));
});

// route
app.get('/', (req, res) => {
  res.send('hello world');
});

// start app
app.listen(5000);

console.log('server runing at localhost:5000');
console.log('Simulation of normal response: goto localhost:5000');
console.log('Simulation of error response: goto localhost:5000/xxx');
