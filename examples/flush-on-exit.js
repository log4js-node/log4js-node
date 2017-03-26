/**
 * run this, then "ab -c 10 -n 100 localhost:4444/" to test (in
 * another shell)
 */
const log4js = require('../lib/log4js');

log4js.configure({
  appenders: {
    cheese: { type: 'file', filename: 'cheese.log' }
  },
  categories: {
    default: { appenders: ['cheese'], level: 'debug' }
  }
});

const logger = log4js.getLogger('cheese');
const http = require('http');

http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  const rd = Math.random() * 50;
  logger.info(`hello ${rd}`);
  response.write('hello ');
  if (Math.floor(rd) === 30) {
    log4js.shutdown(() => { process.exit(1); });
  }
  response.end();
}).listen(4444);
