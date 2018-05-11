# logstash Appender (HTTP)

The logstash appenders send NDJSON formatted log events to [logstash](https://www.elastic.co/products/logstash) receivers. This appender uses HTTP to send the events (there is another logstash appender that uses [UDP](https://github.com/log4js-node/logstashUDP)). You will need to include [axios](https://www.npmjs.com/package/axios) in your dependencies to use this appender.

## Configuration

* `type` - `logstashHTTP`
* `url` - `string` - logFaces receiver servlet URL
* `application` - `string` (optional) - used to identify your application's logs
* `logChannel` - `string` (optional) - also used to identify your application's logs [but in a more specific way]
* `logType` - `string` (optional) - used for the `type` field in the logstash data
* `timeout` - `integer` (optional, defaults to 5000ms) - the timeout for the HTTP request.

This appender will also pick up Logger context values from the events, and add them as `p_` values in the logFaces event. See the example below for more details.

# Example (default config)

```javascript
log4js.configure({
  appenders: {
    logstash: { type: 'logstashHTTP', url: 'http://localhost:9200/_bulk', application: 'logstash-log4js', logType: 'application', logChannel: 'node' }
  },
  categories: {
    default: { appenders: [ 'logstash' ], level: 'info' }
  }
});

const logger = log4js.getLogger();
logger.addContext('requestId', '123');
logger.info('some interesting log message');
logger.error('something has gone wrong');
```
This example will result in two log events being sent to your `localhost:9200`. Both events will have a `context.requestId` property with a value of `123`.
