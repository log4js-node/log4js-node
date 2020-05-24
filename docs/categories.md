# Categories
Categories are groups of log events. The category for log events is defined when you get a _Logger_ from log4js (`log4js.getLogger('somecategory')`). Log events with the same _category_ will go to the same _appenders_.

## Default configuration
When defining your appenders through a configuration, at least one category must be defined.

```javascript
const log4js = require('log4js');
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    app: { type: 'file', filename: 'application.log' }
  },
  categories: {
    default: { appenders: [ 'out' ], level: 'trace' },
    app: { appenders: ['app'], level: 'trace' }
  }
});

const logger = log4js.getLogger();
logger.trace('This will use the default category and go to stdout');
const logToFile = log4js.getLogger('app');
logToFile.trace('This will go to a file');
```

## Categories inheritance
Log4js supports a hierarchy for categories, using dots to separate layers - for example, log events in the category 'myapp.submodule' will use the level for 'myapp' if none is defined for 'myapp.submodule', and also any appenders defined for 'myapp'. 
This behaviour can be disabled by setting inherit=false on the sub-category. 

```javascript
const log4js = require('log4js');
log4js.configure({
  appenders: {
    console: { type: 'console' },
    app: { type: 'file', filename: 'application.log' }
  },
  categories: {
    default: { appenders: [ 'console' ], level: 'trace' },
    catA: { appenders: ['console'], level: 'error' },
    'catA.catB': { appenders: ['app'], level: 'trace' },
  }
});

const loggerA = log4js.getLogger('catA');
loggerA.error('This will be written to console with log level ERROR');
loggerA.trace('This will not be written');
const loggerAB = log4js.getLogger('catA.catB');
loggerAB.error('This will be written with log level ERROR to console and to a file');
loggerAB.trace('This will be written with log level TRACE to console and to a file');
```
Two categories are defined:
- Log events with category 'catA' will go to appender 'console' only.
- Log events with category 'catA.catB' will go to appenders 'console' and 'app'. 

Appenders will see and log an event only if the category level is less than or equal to the event's level.
