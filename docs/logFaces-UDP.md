# logFaces Appender (UDP)

The logFaces appenders send JSON formatted log events to [logFaces](http://www.moonlit-software.com) receivers. This appender uses UDP to send the events (there is another logFaces appender that uses [HTTP](logFaces-HTTP.md)). It uses the node.js core UDP support, so you do not need to include any other dependencies.

## Configuration

* `type` - `logFaces-UDP`
* `remoteHost` - `string` (optional, defaults to '127.0.0.1')- hostname or IP address of the logFaces receiver
* `port` - `integer` (optional, defaults to 55201) - port the logFaces receiver is listening on
* `application` - `string` (optional, defaults to empty string) - used to identify your application's logs

This appender will also pick up Logger context values from the events, and add them as `p_` values in the logFaces event. See the example below for more details.

# Example (default config)

```javascript
log4js.configure({
  appenders: {
    logfaces: { type: 'logFaces-UDP' }
  },
  categories: {
    default: { appenders: [ 'logfaces' ], level: 'info' }
  }
});

const logger = log4js.getLogger();
logger.addContext('requestId', '123');
logger.info('some interesting log message');
logger.error('something has gone wrong');
```
This example will result in two log events being sent via UDP to `127.0.0.1:55201`. Both events will have a `p_requestId` property with a value of `123`.
