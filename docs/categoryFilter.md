# Category Filter

This is not strictly an appender - it wraps around another appender and stops log events from specific categories from being written to that appender. This could be useful when debugging your application, but you have one component that logs noisily, or is irrelevant to your investigation.

## Configuration

* `type` - `"categoryFilter"`
* `exclude` - `string | Array<string>` - the category (or categories if you provide an array of values) that will be excluded from the appender.
* `appender` - `string` - the name of the appender to filter.

## Example

```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log' },
    'no-noise': { type: 'categoryFilter', exclude: 'noisy.component', appender: 'everything' }
  },
  categories: {
    default: { appenders: [ 'no-noise' ], level: 'debug' }
  }
});

const logger = log4js.getLogger();
const noisyLogger = log4js.getLogger('noisy.component');
logger.debug('I will be logged in all-the-logs.log');
noisyLogger.debug('I will not be logged.');
```

Note that you can achieve the same outcome without using the category filter, like this:
```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log' }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug' },
    'noisy.component': { appenders: ['everything'], level: 'off' }
  }
});

const logger = log4js.getLogger();
const noisyLogger = log4js.getLogger('noisy.component');
logger.debug('I will be logged in all-the-logs.log');
noisyLogger.debug('I will not be logged.');
```
Category filter becomes useful when you have many categories you want to exclude, passing them as an array.
