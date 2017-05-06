# Log Level Filter

The log level filter allows you to restrict the log events that an appender will record based on the level of those events. This is useful when you want most logs to go to a file, but errors to be sent as emails, for example. The filter works by wrapping around another appender and controlling which events get sent to it.

## Configuration

* `type` - `logLevelFilter`
* `appender` - `string` - the name of an appender, defined in the same configuration, that you want to filter
* `level` - `string` - the minimum level of event to allow through the filter
* `maxLevel` - `string` (optional, defaults to `FATAL`) - the maximum level of event to allow through the filter

If an event's level is greater than or equal to `level` and less than or equal to `maxLevel` then it will be sent to the appender.

## Example

```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log' },
    emergencies: { type: 'file', filename: 'panic-now.log' },
    just-errors: { type: 'logLevelFilter', appender: ['emergencies'], level: 'error' }
  },
  categories: {
    default: { appenders: ['just-errors', 'everything' ], level: 'debug' }
  }
});
```
Log events of `debug`, `info`, `error`, and `fatal` will go to `all-the-logs.log`. Events of `error` and `fatal` will also go to `panic-now.log`.
