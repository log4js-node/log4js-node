# logFaces Appender (HTTP)

The logFaces appenders send JSON formatted log events to [logFaces](http://www.moonlit-software.com) receivers. This appender uses HTTP to send the events (there is another logFaces appender that uses [UDP](logFaces-UDP.md)). You will need to include [axios](https://www.npmjs.com/package/axios) in your dependencies to use this appender.

## Configuration

* `type` - `logFaces-HTTP`
* `url` - `string` - logFaces receiver servlet URL
* `application` - `string` (optional, defaults to empty string) - used to identify your application's logs
* `timeout` - `integer` (optional, defaults to 5000ms) - the timeout for the HTTP request.

This appender will also pick up Logger context values from the events, and add them as `p_` values in the logFaces event. See the example below for more details.

# Example (default config)

```javascript
log4js.configure({
  appenders: {
    logfaces: { type: 'logFaces-HTTP', url: 'http://lfs-server/logs' }
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
This example will result in two log events being sent to `lfs-server`. Both events will have a `p_requestId` property with a value of `123`.
