# Synchronous File Appender

The sync file appender writes log events to a file, the only difference to the normal file appender is that all the writes are synchronous. This can make writing tests easier, or in situations where you need an absolute guarantee that a log message has been written to the file. Making synchronous I/O calls does mean you lose a lot of the benefits of using node.js though. It supports an optional maximum file size, and will keep a configurable number of backups. Note that the synchronous file appender, unlike the asynchronous version, does not support compressing the backup files.

## Configuration

* `type` - `"file"`
* `filename` - `string` - the path of the file where you want your logs written.
* `maxLogSize` - `integer` (optional) - the maximum size (in bytes) for the log file. If not specified, then no log rolling will happen.
* `backups` - `integer` (optional, default value = 5) - the number of old log files to keep during log rolling.
* `layout` - (optional, defaults to basic layout) - see [layouts](layouts.md)

Any other configuration parameters will be passed to the underlying node.js core stream implementation:
* `encoding` - `string` (default "utf-8")
* `mode`- `integer` (default 0644)
* `flags` - `string` (default 'a')

## Example

```javascript
log4js.configure({
  appenders: {
    everything: { type: 'fileSync', filename: 'all-the-logs.log' }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug' }
  }
});

const logger = log4js.getLogger();
logger.debug('I will be logged in all-the-logs.log');
```

This example will result in a single log file (`all-the-logs.log`) containing the log messages.

## Example with log rolling
```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log', maxLogSize: 10458760, backups: 3 }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug'}
  }
});
```
This will result in one current log file (`all-the-logs.log`). When that reaches 10Mb in size, it will be renamed and compressed to `all-the-logs.log.1.gz` and a new file opened called `all-the-logs.log`. When `all-the-logs.log` reaches 10Mb again, then `all-the-logs.log.1.gz` will be renamed to `all-the-logs.log.2.gz`, and so on.
