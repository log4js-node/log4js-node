# Log4js - Appenders

Appenders serialise log events to some form of output. They can write to files, send emails, send data over the network. All appenders have a `type` which determines which appender gets used. For example:
```javascript
const log4js = require('log4js');
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    app: { type: 'file', filename: 'application.log' }
  },
  categories: {
    default: { appenders: [ 'out', 'app' ], level: 'debug' }
  }
});
```
This defines two appenders named 'out' and 'app'. 'out' uses the [stdout](stdout.md) appender which writes to standard out. 'app' uses the [file](file.md) appender, configured to write to 'application.log'.

## Core Appenders

The following appenders are included with log4js. Some require extra dependencies that are not included as part of log4js (the [smtp](smtp.md) appender needs [nodemailer](https://www.npmjs.org/packages/nodemailer) for example), and these will be noted in the docs for that appender. If you don't use those appenders, then you don't need the extra dependencies.

* [categoryFilter](categoryFilter.md)
* [console](console.md)
* [dateFile](dateFile.md)
* [file](file.md)
* [fileSync](fileSync.md)
* [logLevelFilter](logLevelFilter.md)
* [multiFile](multiFile.md)
* [multiprocess](multiprocess.md)
* [recording](recording.md)
* [stderr](stderr.md)
* [stdout](stdout.md)
* [tcp](tcp.md)
* [tcp-server](tcp-server.md)

## Optional Appenders

The following appenders are supported by log4js, but are no longer distributed with log4js core from version 3 onwards.

* [gelf](https://github.com/log4js-node/gelf)
* [hipchat](https://github.com/log4js-node/hipchat)
* [logFaces-HTTP](https://github.com/log4js-node/logFaces-HTTP)
* [logFaces-UDP](https://github.com/log4js-node/logFaces-UDP)
* [loggly](https://github.com/log4js-node/loggly)
* [logstashHTTP](https://github.com/log4js-node/logstashHTTP)
* [logstashUDP](https://github.com/log4js-node/logstashUDP)
* [mailgun](https://github.com/log4js-node/mailgun)
* [rabbitmq](https://github.com/log4js-node/rabbitmq)
* [redis](https://github.com/log4js-node/redis)
* [slack](https://github.com/log4js-node/slack)
* [smtp](https://github.com/log4js-node/smtp)

For example, if you were previously using the gelf appender (`type: 'gelf'`) then you should add `@log4js-node/gelf` to your dependencies and change the type to `type: '@log4js-node/gelf'`.

## Other Appenders

Log4js can load appenders from outside the core appenders. The `type` config value is used as a require path if no matching appender can be found. For example, the following configuration will attempt to load an appender from the module 'cheese/appender', passing the rest of the config for the appender to that module:
```javascript
log4js.configure({
  appenders: { gouda: { type: 'cheese/appender', flavour: 'tasty' } },
  categories: { default: { appenders: ['gouda'], level: 'debug' }}
});
```
Log4js checks the following places (in this order) for appenders based on the type value:
1. The core appenders: `require('./appenders/' + type)`
2. node_modules: `require(type)`
3. relative to the main file of your application: `require(path.dirname(require.main.filename) + '/' + type)`
4. relative to the process' current working directory: `require(process.cwd() + '/' + type)`

If you want to write your own appender, read the [documentation](writing-appenders.md) first.
