# log4js-node [![Build Status](https://secure.travis-ci.org/nomiddlename/log4js-node.png?branch=master)](http://travis-ci.org/nomiddlename/log4js-node)

[![NPM](https://nodei.co/npm/log4js.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/log4js/)
[![codecov](https://codecov.io/gh/nomiddlename/log4js-node/branch/master/graph/badge.svg)](https://codecov.io/gh/nomiddlename/log4js-node)

This is a conversion of the [log4js](https://github.com/stritti/log4js)
framework to work with [node](http://nodejs.org). I started out just stripping out the browser-specific code and tidying up some of the javascript to work better in node. It grew from there. Although it's got a similar name to the Java library [log4j](https://logging.apache.org/log4j/2.x/), thinking that it will behave the same way will only bring you sorrow and confusion.

The full documentation is available [here](https://nomiddlename.github.io/log4js-node/).

There have been a few changes between log4js 1.x and 2.x (and 0.x too). You should probably read this [migration guide](https://nomiddlename.github.io/log4js-node/migration-guide.html) if things aren't working.

Out of the box it supports the following features:

* coloured console logging to stdout or stderr
* file appender, with configurable log rolling based on file size or date
* SMTP appender
* GELF appender
* Loggly appender
* Logstash UDP appender
* logFaces (UDP and HTTP) appender
* multiprocess appender (useful when you've got multiple servers)
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
logger.level = 'debug';
logger.debug("Some debug messages");
```
By default, log4js will not output any logs (so that it can safely be used in libraries). The `level` for the `default` category is set to `OFF`. To enable logs, set the level (as in the example). This will then output to stdout with the coloured layout (thanks to [masylum](http://github.com/masylum)), so for the above you would see:
```bash
[2010-01-17 11:43:37.987] [DEBUG] [default] - Some debug messages
```
See example.js for a full example, but here's a snippet (also in `examples/fromreadme.js`):
```javascript
const log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'error' } }
});

const logger = log4js.getLogger('cheese');
logger.trace('Entering cheese testing');
logger.debug('Got cheese.');
logger.info('Cheese is Gouda.');
logger.warn('Cheese is quite smelly.');
logger.error('Cheese is too ripe!');
logger.fatal('Cheese was breeding ground for listeria.');
```
Output (in `cheese.log`):
```bash
[2010-01-17 11:43:37.987] [ERROR] cheese - Cheese is too ripe!
[2010-01-17 11:43:37.990] [FATAL] cheese - Cheese was breeding ground for listeria.
```    

## Note for library makers

If you're writing a library and would like to include support for log4js, without introducing a dependency headache for your users, take a look at [log4js-api](https://github.com/log4js-node/log4js-api).

## Documentation
Available [here](https://nomiddlename.github.io/log4js-node/).

There's also [an example application](https://github.com/nomiddlename/log4js-example).

## Contributing
Contributions welcome, but take a look at the [rules](https://github.com/nomiddlename/log4js-node/wiki/Contributing) first.

## License

The original log4js was distributed under the Apache 2.0 License, and so is this. I've tried to
keep the original copyright and author credits in place, except in sections that I have rewritten
extensively.
