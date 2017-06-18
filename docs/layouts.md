# Layouts

Layouts are functions used by appenders to format log events for output. They take a log event as an argument and return a string. Log4js comes with several appenders built-in, and provides ways to create your own if these are not suitable.

For most use cases you will not need to configure layouts - there are some appenders which do not need layouts defined (for example, [logFaces-UDP](logFaces-UDP.md)); all the appenders that use layouts will have a sensible default defined.

## Configuration

Most appender configuration will take a field called `layout`, which is an object - typically with a single field `type` which is the name of a layout defined below. Some layouts require extra configuration options, which should be included in the same object.

## Example
```javascript
log4js.configure({
  appenders: { out: { type: 'stdout', layout: { type: 'basic' } } },
  categories: { default: { appenders: ['out'], level: 'info' } }
});
```
This configuration replaces the [stdout](stdout.md) appender's default `coloured` layout with `basic` layout.

# Built-in Layouts

## Basic

* `type` - `basic`

Basic layout will output the timestamp, level, category, followed by the formatted log event data.

## Example
```javascript
log4js.configure({
  appenders: { 'out': { type: 'stdout', layout: { type: 'basic' } } },
  categories: { default: { appenders: ['out'], level: 'info' } }
});
const logger = log4js.getLogger('cheese');
logger.error('Cheese is too ripe!');
```
This will output:
```
[2017-03-30 07:57:00.113] [ERROR] cheese - Cheese is too ripe!
```

## Coloured

* `type` - `coloured` (or `colored`)

This layout is the same as `basic`, except that the timestamp, level and category will be coloured according to the log event's level (if your terminal/file supports it - if you see some weird characters in your output and no colour then you should probably switch to `basic`). The colours used are:
* `TRACE` - 'blue'
* `DEBUG` - 'cyan'
* `INFO` - 'green'
* `WARN` - 'yellow'
* `ERROR` - 'red'
* `FATAL` - 'magenta'

## Message Pass-Through
* `type` - `messagePassThrough`

This layout just formats the log event data, and does not output a timestamp, level or category. It is typically used in appenders that serialise the events using a specific format (e.g. [gelf](gelf.md)).

## Example
```javascript
log4js.configure({
  appenders: { out: { type: 'stdout', layout: { type: 'messagePassThrough' } } },
  categories: { default: { appenders: [ 'out' ], level: 'info' } }
});
const logger = log4js.getLogger('cheese');
const cheeseName = 'gouda';
logger.error('Cheese is too ripe! Cheese was: ', cheeseName);
```
This will output:
```
Cheese is too ripe! Cheese was: gouda
```

## Dummy

* `type` - `dummy`

This layout only outputs the first value in the log event's data. It was added for the [logstashUDP](logstashUDP.md) appender, and I'm not sure there's much use for it outside that.

## Example
```javascript
log4js.configure({
  appenders: { out: { type: 'stdout', layout: { type: 'dummy' } } },
  categories: { default: { appenders: [ 'out' ], level: 'info' } }
});
const logger = log4js.getLogger('cheese');
const cheeseName = 'gouda';
logger.error('Cheese is too ripe! Cheese was: ', cheeseName);
```
This will output:
```
Cheese is too ripe! Cheese was:
```

## Pattern
* `type` - `pattern`
* `pattern` - `string` - specifier for the output format, using placeholders as described below
* `tokens` - `object` (optional) - user-defined tokens to be used in the pattern

## Pattern format
The pattern string can contain any characters, but sequences beginning with `%` will be replaced with values taken from the log event, and other environmental values.
Format for specifiers is `%[padding].[truncation][field]{[format]}` - padding and truncation are optional, and format only applies to a few tokens (notably, date).
e.g. %5.10p - left pad the log level by 5 characters, up to a max of 10

Fields can be any of:
*  `%r` time in toLocaleTimeString format
*  `%p` log level
*  `%c` log category
*  `%h` hostname
*  `%m` log data
*  `%d` date, formatted - default is `ISO8601`, format options are: `ISO8601`, `ISO8601_WITH_TZ_OFFSET`, `ABSOLUTE`, `DATE`, or any string compatible with the [date-format](https://www.npmjs.com/package/date-format) library. e.g. `%d{DATE}`, `%d{yyyy/MM/dd-hh.mm.ss}`
*  `%%` % - for when you want a literal `%` in your output
*  `%n` newline
*  `%z` process id (from `process.pid`)
*  `%x{<tokenname>}` add dynamic tokens to your log. Tokens are specified in the tokens parameter.
*  `%X{<tokenname>}` add values from the Logger context. Tokens are keys into the context values.
*  `%[` start a coloured block (colour will be taken from the log level, similar to `colouredLayout`)
*  `%]` end a coloured block

## Tokens
User-defined tokens can be either a string or a function. Functions will be passed the log event, and should return a string. For example, you could define a custom token that outputs the log event's context value for 'user' like so:
```javascript
log4js.configure({
  appenders: {
    out: { type: 'stdout', layout: {
      type: 'pattern',
      pattern: '%d %p %c %x{user} %m%n',
      tokens: {
        user: function(logEvent) {
          return AuthLibrary.currentUser();
        }
      }
    }}
  },
  categories: { default: { appenders: ['out'], level: 'info' } }
});
const logger = log4js.getLogger();
logger.info('doing something.');
```
This would output:
```
2017-06-01 08:32:56.283 INFO default charlie doing something.
```

You can also use the Logger context to store tokens (sometimes called Nested Diagnostic Context, or Mapped Diagnostic Context) and use them in your layouts.
```javascript
log4js.configure({
  appenders: {
    out: { type: 'stdout', layout: {
      type: 'pattern',
      pattern: '%d %p %c %X{user} %m%n'
    }}
  },
  categories: { default: { appenders: ['out'], level: 'info' } }
});
const logger = log4js.getLogger();
logger.addContext('user', 'charlie');
logger.info('doing something.');
```
This would output:
```
2017-06-01 08:32:56.283 INFO default charlie doing something.
```
Note that you can also add functions to the Logger Context, and they will be passed the logEvent as well.

# Adding your own layouts

You can add your own layouts by calling `log4js.addLayout(type, fn)` before calling `log4js.configure`. `type` is the label you want to use to refer to your layout in appender configuration. `fn` is a function that takes a single object argument, which will contain the configuration for the layout instance, and returns a layout function. A layout function takes a log event argument and returns a string (usually, although you could return anything as long as the appender knows what to do with it).

## Custom Layout Example
This example can also be found in examples/custom-layout.js.
```javascript
const log4js = require('log4js');

log4js.addLayout('json', function(config) {
  return function(logEvent) { return JSON.stringify(logEvent) + config.separator; }
});

log4js.configure({
  appenders: {
    out: { type: 'stdout', layout: { type: 'json', separator: ',' } }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' }
  }
});

const logger = log4js.getLogger('json-test');
logger.info('this is just a test');
logger.error('of a custom appender');
logger.warn('that outputs json');
log4js.shutdown(() => {});
```
This example outputs the following:
```javascript
{"startTime":"2017-06-05T22:23:08.479Z","categoryName":"json-test","data":["this is just a test"],"level":{"level":20000,"levelStr":"INFO"},"context":{}},
{"startTime":"2017-06-05T22:23:08.483Z","categoryName":"json-test","data":["of a custom appender"],"level":{"level":40000,"levelStr":"ERROR"},"context":{}},
{"startTime":"2017-06-05T22:23:08.483Z","categoryName":"json-test","data":["that outputs json"],"level":{"level":30000,"levelStr":"WARN"},"context":{}},
```
