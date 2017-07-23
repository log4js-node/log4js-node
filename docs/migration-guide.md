# Migrating from log4js versions older than 2.x

## Configuration
If you try to use your v1 configuration with v2 code, you'll most likely get an error that says something like 'must have property "appenders" of type object'. The format of the configuration object has changed (see the [api](api.md) docs for details). The main changes are a need for you to name your appenders, and you also have to define the default category. For example, if your v1 config looked like this:
```javascript
{ appenders: [
  { type: 'console' },
  {
    type: 'dateFile',
    filename: 'logs/task',
    pattern:"-dd.log",
    alwaysIncludePattern: true,
    category: 'task'
  }
] }
```
Then your v2 config should be something like this:
```javascript
{
  appenders: {
    out: { type: 'console' },
    tasks: {
      type: 'dateFile',
      filename: 'logs/task',
      pattern: '-dd.log',
      alwaysIncludePattern: true
    }
  },
  categories: {
    default: { appenders: [ 'out' ], level: 'info' },
    task: { appenders: [ 'task' ], level: 'info' }
  }
}}
```

The functions to define the configuration programmatically have been remove (`addAppender`, `loadAppender`, etc). All configuration should now be done through the single `configure` function, passing in a filename or object.

## Console replacement
V1 used to allow you to replace the node.js console functions with versions that would log to a log4js appender. This used to cause some weird errors, so I decided it was better to remove it from the log4js core functionality. If you still want to do this, you can replicate the behaviour with code similar to this:
```javascript
log4js.configure(...); // set up your categories and appenders
const logger = log4js.getLogger('console'); // any category will work
console.log = logger.info.bind(logger); // do the same for others - console.debug, etc.
```

## Config Reloading
Previous versions of log4js used to watch for changes in the configuration file and reload when it changed. It didn't always work well, sometimes leaving file handles or sockets open. This feature was removed in version 2.x. As a replacement, I'd suggest using a library like [watchr](https://www.npmjs.com/package/watchr) to notify you of file changes. Then you can call `log4js.shutdown` followed by `log4js.configure` again.

## Appenders
If you have written your own custom appenders, they will not work without modification in v2. See the guide to [writing appenders](writing-appenders.md) for details on how appenders work in 2.x. Note that if you want to write your appender to work with both 1.x and 2.x, then you can tell what version you're running in by examining the number of arguments passed to the `configure` function of your appender: 2 arguments means v1, 4 arguments means v2.

All the core appenders have been upgraded to work with v2, except for the clustered appender which has been removed. The core log4js code handles cluster mode transparently.

The `logFaces` appender was split into two versions to make testing easier and the code simpler; one has HTTP support, the other UDP.

## Exit listeners
Some appenders used to define their own `exit` listeners, and it was never clear whose responsibility it was to clean up resources. Now log4js does not define any `exit` listeners. Instead your application should register an `exit` listener, and call `log4js.shutdown` to be sure that all log messages get written before your application terminates.

## New Features
* MDC contexts - you can now add key-value pairs to a logger (for grouping all log messages from a particular user, for example). Support for these values exists in the [pattern layout](layouts.md), the [logFaces appenders](logFaces-UDP.md), and the [multi-file appender](multiFile.md).
* Automatic cluster support - log4js now handles clusters transparently
* Custom levels - you can define your own log levels in the configuration object, including the colours
* Improved performance - several changes have been made to improve performance, especially for the file appenders.
