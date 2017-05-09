# Recording Appender

This appender stores the log events in memory. It is mainly useful for testing (see the tests for the category filter, for instance).

## Configuration

* `type` - `recording`

There is no other configuration for this appender.

## Usage

The array that stores log events is shared across all recording appender instances, and is accessible from the recording module. `require('<LOG4JS LIB DIR>/appenders/recording')` returns a module with the following functions exported:

* `replay` - returns `Array<LogEvent>` - get all the events recorded.
* `playback` - synonym for `replay`
* `reset` - clears the array of events recorded.
* `erase` - synonyms for `reset`

## Example

```javascript
const recording = require('../lib/appenders/recording');
const log4js = require('../lib/log4js');
log4js.configure({
  appenders: { vcr: { type: 'recording' } },
  categories: { default: { appenders: ['vcr'], level: 'info' } }
});

const logger = log4js.getLogger();
logger.info("some log event");

const events = recording.replay(); // events is an array of LogEvent objects.
recording.erase(); // clear the appender's array.
```
