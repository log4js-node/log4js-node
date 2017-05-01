# GELF appender

The GELF appender supports sending log messages over UDP to a [GELF](http://docs.graylog.org/en/2.2/pages/gelf.html) compatible server such as [Graylog](https://www.graylog.org). It uses node's core UDP support and does not require any other dependencies. If you use this appender, remember to call `log4js.shutdown` when your application terminates, so that all messages will have been sent to the server and the UDP socket can be closed. The appender supports passing custom fields to the server in both the config, and in individual log messages (see examples below).

## Configuration

* `type` - `gelf`
* `host` - `string` (defaults to `localhost`) - the gelf server hostname
* `port` - `integer` (defaults to `12201`) - the port the gelf server is listening on
* `hostname` - `string` (defaults to `OS.hostname()`) - the hostname used to identify the origin of the log messages.
* `facility` - `string` (optional)
* `customFields` - `object` (optional) - fields to be added to each log message; custom fields must start with an underscore.

## Example (default config)
```javascript
log4js.configure({
  appenders: {
    gelf: { type: 'gelf' }
  },
  categories: {
    default: { appenders: ['gelf'], level: 'info' }
  }
});
```
This will send log messages to a server at `localhost:12201`.

## Example (custom fields in config)
```javascript
log4js.configure({
  appenders: {
    gelf: { type: 'gelf', host: 'gelf.server', customFields: { '_something': 'yep' } }
  },
  categories: {
    default: { appenders: ['gelf'], level: 'info' }
  }
});
```
This will result in all log messages having the custom field `_something` set to 'yep'.

# Example (custom fields in log message)
```javascript
log4js.configure({
  appenders: {
    gelf: { type: 'gelf', customFields: { '_thing': 'isathing' } }
  },
  categories: {
    default: { appenders: ['gelf'], level: 'info' }
  }
});
const logger = log4js.getLogger();
logger.error({ GELF: true, _thing2: 'alsoathing' }, 'oh no, something went wrong');
```
This will result in a log message with the custom fields `_thing` and `_thing2`. Note that log message custom fields will override config custom fields.
