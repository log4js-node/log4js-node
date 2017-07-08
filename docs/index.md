# log4js-node

This is a conversion of the [log4js](https://github.com/stritti/log4js)
framework to work with [node](http://nodejs.org). I started out just stripping out the browser-specific code and tidying up some of the javascript to work better in node. It grew from there. Although it's got a similar name to the Java library [log4j](https://logging.apache.org/log4j/2.x/), thinking that it will behave the same way will only bring you sorrow and confusion.

## Features

* coloured console logging to [stdout](stdout.md) or [stderr](stderr.md)
* [file appender](file.md), with configurable log rolling based on file size or [date](dateFile.md)
* [SMTP appender](smtp.md)
* [GELF appender](gelf.md)
* [Loggly appender](loggly.md)
* [Logstash UDP appender](logstashUDP.md)
* logFaces ([UDP](logFaces-UDP.md) and [HTTP](logFaces-HTTP.md)) appender
* [multiprocess appender](multiprocess.md) (useful when you've got multiple servers but want to centralise logging)
* a [logger for connect/express](connect-logger.md) servers
* configurable log message [layout/patterns](layouts.md)
* different log levels for different log categories (make some parts of your app log as DEBUG, others only ERRORS, etc.)
* built-in support for logging with node core's `cluster` module

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

## Note for library makers

If you're writing a library and would like to include support for log4js, without introducing a dependency headache for your users, take a look at [log4js-api](https://github.com/log4js-node/log4js-api).

## License

The original log4js was distributed under the Apache 2.0 License, and so is this. I've tried to
keep the original copyright and author credits in place, except in sections that I have rewritten
extensively.
