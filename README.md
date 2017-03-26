# log4js-node [![Build Status](https://secure.travis-ci.org/nomiddlename/log4js-node.png?branch=master)](http://travis-ci.org/nomiddlename/log4js-node)

[![NPM](https://nodei.co/npm/log4js.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/log4js/)
[![codecov](https://codecov.io/gh/nomiddlename/log4js-node/branch/master/graph/badge.svg)](https://codecov.io/gh/nomiddlename/log4js-node)


This is a conversion of the [log4js](https://github.com/stritti/log4js)
framework to work with [node](http://nodejs.org). I've mainly stripped out the browser-specific code and tidied up some of the javascript. Although it's got a similar name to the Java library [log4j](https://logging.apache.org/log4j/2.x/), thinking that it will behave the same way will only bring you sorrow and confusion.

Out of the box it supports the following features:

* coloured console logging to stdout or stderr
* file appender, with configurable log rolling based on file size or date
* SMTP appender
* GELF appender
* Loggly appender
* Logstash UDP appender
* logFaces (UDP and HTTP) appender
* multiprocess appender (useful when you've got worker processes)
* a logger for connect/express servers
* configurable log message layout/patterns
* different log levels for different log categories (make some parts of your app log as DEBUG, others only ERRORS, etc.)

## installation

```bash
npm install log4js
```

## usage

Minimalist version:
```javascript
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.debug("Some debug messages");
```
By default, log4js outputs to stdout with the coloured layout (thanks to [masylum](http://github.com/masylum)), so for the above you would see:
```bash
[2010-01-17 11:43:37.987] [DEBUG] [default] - Some debug messages
```
See example.js for a full example, but here's a snippet (also in fromreadme.js):
```javascript
const log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'error' } }
});

const logger = log4js.getLogger('cheese');
logger.setLevel('ERROR');

logger.trace('Entering cheese testing');
logger.debug('Got cheese.');
logger.info('Cheese is Gouda.');
logger.warn('Cheese is quite smelly.');
logger.error('Cheese is too ripe!');
logger.fatal('Cheese was breeding ground for listeria.');
```
Output:
```bash
[2010-01-17 11:43:37.987] [ERROR] cheese - Cheese is too ripe!
[2010-01-17 11:43:37.990] [FATAL] cheese - Cheese was breeding ground for listeria.
```    

## configuration

You can configure the appenders and log levels manually (as above), or provide a
configuration file (`log4js.configure('path/to/file.json')`), or a configuration object. The
configuration file location may also be specified via the environment variable
LOG4JS_CONFIG (`export LOG4JS_CONFIG=path/to/file.json`).
An example file can be found in `test/vows/log4js.json`. An example config file with log rolling is in `test/vows/with-log-rolling.json`.
You can configure log4js to check for configuration file changes at regular intervals, and if changed, reload. This allows changes to logging levels to occur without restarting the application.

To turn it on and specify a period:

```javascript
log4js.configure('file.json', { reloadSecs: 300 });
```
For FileAppender you can also pass the path to the log directory as an option where all your log files would be stored.

```javascript
log4js.configure('my_log4js_configuration.json', { cwd: '/absolute/path/to/log/dir' });
```
If you have already defined an absolute path for one of the FileAppenders in the configuration file, you could add a "absolute": true to the particular FileAppender to override the cwd option passed. Here is an example configuration file:

#### my_log4js_configuration.json ####
```json
{
  "appenders": [
    {
      "type": "file",
      "filename": "relative/path/to/log_file.log",
      "maxLogSize": 20480,
      "backups": 3,
      "category": "relative-logger"
    },
    {
      "type": "file",
      "absolute": true,
      "filename": "/absolute/path/to/log_file.log",
      "maxLogSize": 20480,
      "backups": 10,
      "category": "absolute-logger"          
    }
  ]
}
```    
Documentation for most of the core appenders can be found on the [wiki](https://github.com/nomiddlename/log4js-node/wiki/Appenders), otherwise take a look at the tests and the examples.

## Documentation
See the [wiki](https://github.com/nomiddlename/log4js-node/wiki). Improve the [wiki](https://github.com/nomiddlename/log4js-node/wiki), please.

There's also [an example application](https://github.com/nomiddlename/log4js-example).

## Contributing
Contributions welcome, but take a look at the [rules](https://github.com/nomiddlename/log4js-node/wiki/Contributing) first.

## License

The original log4js was distributed under the Apache 2.0 License, and so is this. I've tried to
keep the original copyright and author credits in place, except in sections that I have rewritten
extensively.
