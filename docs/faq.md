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
