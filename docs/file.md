# File Appender

The file appender writes log events to a file. It supports an optional maximum file size, and will keep a configurable number of backups. When using the file appender, you should also call `log4js.shutdown` when your application terminates, to ensure that any remaining asynchronous writes have finished. Although the file appender uses the [streamroller](https://github.com/nomiddlename/streamroller) library, this is included as a dependency of log4js so you do not need to include it yourself.

## Configuration

* `type` - `"file"`
* `filename` - `string` - the path of the file where you want your logs written.
* `maxLogSize` - `integer` (optional) - the maximum size (in bytes) for the log file. If not specified, then no log rolling will happen.
* `backups` - `integer` (optional, default value = 5) - the number of old log files to keep during log rolling.
* `layout` - (optional, defaults to basic layout) - see [layouts](layouts.md)

Any other configuration parameters will be passed to the underlying [streamroller](https://github.com/nomiddlename/streamroller) implementation (see also node.js core file streams):
* `encoding` - `string` (default "utf-8")
* `mode`- `integer` (default 0o644 - [node.js file modes](https://nodejs.org/dist/latest-v12.x/docs/api/fs.html#fs_file_modes))
* `flags` - `string` (default 'a')
* `compress` - `boolean` (default false) - compress the backup files during rolling (backup files will have `.gz` extension)
* `keepFileExt` - `boolean` (default false) - preserve the file extension when rotating log files (`file.log` becomes `file.1.log` instead of `file.log.1`)

Note that, from version 4.x of log4js onwards, the file appender can take any of the options for the [dateFile appender](dateFile.md) as well. So you could roll files by both date and size.

## Example

```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log' }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug' }
  }
});

const logger = log4js.getLogger();
logger.debug('I will be logged in all-the-logs.log');
```

This example will result in a single log file (`all-the-logs.log`) containing the log messages.

## Example with log rolling (and compressed backups)
```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log', maxLogSize: 10485760, backups: 3, compress: true }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug'}
  }
});
```
This will result in one current log file (`all-the-logs.log`). When that reaches 10Mb in size, it will be renamed and compressed to `all-the-logs.log.1.gz` and a new file opened called `all-the-logs.log`. When `all-the-logs.log` reaches 10Mb again, then `all-the-logs.log.1.gz` will be renamed to `all-the-logs.log.2.gz`, and so on.

## Memory usage

If your application logs a large volume of messages, and find memory usage increasing due to buffering log messages before being written to a file, then you can listen for "log4js:pause" events emitted by the file appenders. Your application should stop logging when it receives one of these events with a value of `true` and resume when it receives an event with a value of `false`. 
```javascript
log4js.configure({
  appenders: {
    output: { type: 'file', filename: 'out.log' }
  },
  categories: { default: { appenders: ['output'], level: 'debug'}}
});

let paused = false;
process.on("log4js:pause", (value) => paused = value);

const logger = log4js.getLogger();
while (!paused) {
  logger.info("I'm logging, but I will stop once we start buffering");
}
```
