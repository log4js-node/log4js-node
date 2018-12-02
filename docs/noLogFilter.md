# Category Filter

The no log filter allows you to exclude the log events that an appender will record. 
The log events will be excluded depending on the regular expressions provided in the configuration.
This can be useful when you debug your application and you want to exclude some noisily logs that are irrelevant to your investigation. 
You can stop to log them through a regular expression. 

## Configuration

* `type` - `"noLogFilter"`
* `exclude` - `string | Array<string>` - the regular expression (or the regular expressions if you provide an array of values) will be used for evaluating the events to pass to the appender. The events, which will match the regular expression, will be excluded and so not logged. 
* `appender` - `string` - the name of an appender, defined in the same configuration, that you want to filter.

## Example

```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log' },
    filtered: { 
      type: 'noLogFilter', 
      exclude: 'not', 
      appender: 'everything' }
  },
  categories: {
    default: { appenders: [ 'filtered' ], level: 'debug' }
  }
});

const logger = log4js.getLogger();
logger.debug('I will be logged in all-the-logs.log');
logger.debug('I will be not logged in all-the-logs.log');
```

Note that:
* an array of strings can be specified in the configuration  
* a case insensitive match will be done
* empty strings will be not considered and so removed from the array of values

```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log' },
    filtered: { 
      type: 'noLogFilter', 
      exclude: ['NOT', '\\d', ''], 
      appender: 'everything' }
  },
  categories: {
    default: { appenders: [ 'filtered' ], level: 'debug' }
  }
});

const logger = log4js.getLogger();
logger.debug('I will be logged in all-the-logs.log');
logger.debug('I will be not logged in all-the-logs.log');
logger.debug('A 2nd message that will be excluded in all-the-logs.log');
```