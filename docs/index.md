# log4js-node

This is a conversion of the [log4js](https://github.com/stritti/log4js)
framework to work with [node](http://nodejs.org). I started out just stripping out the browser-specific code and tidying up some of the javascript to work better in node. It grew from there. Although it's got a similar name to the Java library [log4j](https://logging.apache.org/log4j/2.x/), thinking that it will behave the same way will only bring you sorrow and confusion.

## Features

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

## Installation

```bash
npm install log4js
```

## Usage

Minimalist version:
```javascript
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug'; // default level is OFF - which means no logs at all.
logger.debug("Some debug messages");
```

## License

The original log4js was distributed under the Apache 2.0 License, and so is this. I've tried to
keep the original copyright and author credits in place, except in sections that I have rewritten
extensively.
