# Date Rolling File Appender

This is a file appender that rolls log files based on a configurable time, rather than the file size. When using the date file appender, you should also call `log4js.shutdown` when your application terminates, to ensure that any remaining asynchronous writes have finished. Although the date file appender uses the [streamroller](https://github.com/nomiddlename/streamroller) library, this is included as a dependency of log4js so you do not need to include it yourself.

## Configuration

* `type` - `"dateFile"`
* `filename` - `string` - the path of the file where you want your logs written.
* `pattern` - `string` (optional, defaults to `.yyyy-MM-dd`) - the pattern to use to determine when to roll the logs.
* `layout` - (optional, defaults to basic layout) - see [layouts](layouts.md)

Any other configuration parameters will be passed to the underlying [streamroller](https://github.com/nomiddlename/streamroller) implementation (see also node.js core file streams):
* `encoding` - `string` (default "utf-8")
* `mode`- `integer` (default 0o644 - [node.js file modes](https://nodejs.org/dist/latest-v12.x/docs/api/fs.html#fs_file_modes))
* `flags` - `string` (default 'a')
* `compress` - `boolean` (default false) - compress the backup files during rolling (backup files will have `.gz` extension)
* `alwaysIncludePattern` - `boolean` (default false) - include the pattern in the name of the current log file as well as the backups.
* `daysToKeep` - `integer` (default 0) - if this value is greater than zero, then files older than that many days will be deleted during log rolling.
* `keepFileExt` - `boolean` (default false) - preserve the file extension when rotating log files (`file.log` becomes `file.2017-05-30.log` instead of `file.log.2017-05-30`).

The `pattern` is used to determine when the current log file should be renamed and a new log file created. For example, with a filename of 'cheese.log', and the default pattern of `.yyyy-MM-dd` - on startup this will result in a file called `cheese.log` being created and written to until the next write after midnight. When this happens, `cheese.log` will be renamed to `cheese.log.2017-04-30` and a new `cheese.log` file created. The appender uses the [date-format](https://github.com/nomiddlename/date-format) library to parse the `pattern`, and any of the valid formats can be used. Also note that there is no timer controlling the log rolling - changes in the pattern are determined on every log write. If no writes occur, then no log rolling will happen. If your application logs infrequently this could result in no log file being written for a particular time period.

Note that, from version 4.x of log4js onwards, the file appender can take any of the options for the [file appender](file.md) as well. So you could roll files by both date and size.


## Example (default daily log rolling)

```javascript
log4js.configure({
  appenders: {
    everything: { type: 'dateFile', filename: 'all-the-logs.log' }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug' }
  }
});
```

This example will result in files being rolled every day. The initial file will be `all-the-logs.log`, with the daily backups being `all-the-logs.log.2017-04-30`, etc.

## Example with hourly log rolling (and compressed backups)
```javascript
log4js.configure({
  appenders: {
    everything: { type: 'dateFile', filename: 'all-the-logs.log', pattern: '.yyyy-MM-dd-hh', compress: true }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug'}
  }
});
```
This will result in one current log file (`all-the-logs.log`). Every hour this file will be compressed and renamed to `all-the-logs.log.2017-04-30-08.gz` (for example) and a new `all-the-logs.log` created.

## Memory usage

If your application logs a large volume of messages, and find memory usage increasing due to buffering log messages before being written to a file, then you can listen for "log4js:pause" events emitted by the file appenders. Your application should stop logging when it receives one of these events with a value of `true` and resume when it receives an event with a value of `false`.
```javascript
log4js.configure({
  appenders: {
    output: { type: 'dateFile', filename: 'out.log' }
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
