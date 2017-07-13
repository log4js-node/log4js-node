# MultiFile Appender

The multiFile appender can be used to dynamically write logs to multiple files, based on a property of the logging event. Use this as a way to write separate log files for each category when the number of categories is unknown, for instance. It creates [file](file.md) appenders under the hood, so all the options that apply to that appender (apart from filename) can be used with this one, allowing the log files to be rotated and capped at a certain size.

## Configuration

* `type` - `"multiFile"`
* `base` - `string` - the base part of the generated log filename
* `property` - `string` - the value to use to split files (see below).
* `extension` - `string` - the suffix for the generated log filename.

All other properties will be passed to the created [file](file.md) appenders. For the property value, `categoryName` is probably the most useful - although you could use `pid` or `level`. If the property is not found then the appender will look for the value in the context map. If that fails, then the logger will not output the logging event, without an error. This is to allow for dynamic properties which may not exist for all log messages.

## Example (split on category)

```javascript
log4js.configure({
  appenders: {
    multi: { type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log' }
  },
  categories: {
    default: { appenders: [ 'multi' ], level: 'debug' }
  }
});

const logger = log4js.getLogger();
logger.debug('I will be logged in logs/default.log');
const otherLogger = log4js.getLogger('cheese');
logger.info('Cheese is cheddar - this will be logged in logs/cheese.log');
```

This example will result in two log files (`logs/default.log` and `logs/cheese.log`) containing the log messages.

## Example with log rolling (and compressed backups)
```javascript
log4js.configure({
  appenders: {
    everything: {
      type: 'multiFile', base: 'logs/', property: 'userID', extension: '.log',
      maxLogSize: 10485760, backups: 3, compress: true
    }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug'}
  }
});

const userLogger = log4js.getLogger('user');
userLogger.addContext('userID', user.getID());
userLogger.info('this user just logged in');
```
This will result in one log file (`logs/u12345.log`), capped at 10Mb in size, with three backups kept when rolling the file. If more users were logged, each user would get their own files, and their own backups.
