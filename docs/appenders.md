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
* [gelf](gelf.md)
* [hipchat](hipchat.md)
* [logFaces-HTTP](logFaces-HTTP.md)
* [logFaces-UDP](logFaces-UDP.md)
* [loggly](loggly.md)
* [logLevelFilter](logLevelFilter.md)
* [logstashUDP](logstashUDP.md)
* [mailgun](mailgun.md)
* [multiFile](multiFile.md)
* [multiprocess](multiprocess.md)
* [recording](recording.md)
* [redis](redis.md)
* [slack](slack.md)
* [smtp](smtp.md)
* [stderr](stderr.md)
* [stdout](stdout.md)

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
