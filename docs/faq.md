# Frequently Asked Questions

## I want errors to go to a special file, but still want everything written to another file - how do I do that?

You'll need to use the [logLevelFilter](logLevelFilter.md). Here's an example configuration:
```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log' },
    emergencies: {  type: 'file', filename: 'oh-no-not-again.log' },
    'just-errors': { type: 'logLevelFilter', appender: 'emergencies', minLevel: 'error' }
  },
  categories: {
    default: { appenders: ['just-errors', 'everything'], level: 'debug' }
  }
});

const logger = log4js.getLogger();
logger.debug('This goes to all-the-logs.log');
logger.info('As does this.');
logger.error('This goes to all-the-logs.log and oh-no-not-again.log');

```

## I want to reload the configuration when I change my config file - how do I do that?

Previous versions of log4js used to watch for changes in the configuration file and reload when it changed. It didn't always work well, sometimes leaving file handles or sockets open. This feature was removed in version 2.x. As a replacement, I'd suggest using a library like [watchr](https://www.npmjs.com/package/watchr) to notify you of file changes. Then you can call `log4js.shutdown` followed by `log4js.configure` again.

## What happened to `replaceConsole` - it doesn't work any more?

I removed `replaceConsole` - it caused a few weird errors, and I wasn't entirely comfortable with messing around with a core part of node. If you still want to do this, then code like this should do the trick:
```javascript
log4js.configure(...); // set up your categories and appenders
const logger = log4js.getLogger('console');
console.log = logger.info.bind(logger); // do the same for others - console.debug, etc.
```
