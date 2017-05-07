# Logstash UDP Appender

This appender sends log events to a [logstash](https://www.elastic.co/products/logstash) server via UDP. It uses the node.js core UDP support, and so requires no extra dependencies. Remember to call `log4js.shutdown` in your application if you want the UDP socket closed cleanly.

## Configuration

* `type` - `logstashUDP`
* `host` - `string` - hostname (or IP-address) of the logstash server
* `port` - `integer` - port of the logstash server
* `logType` - `string` (optional) - used for the `type` field in the logstash data
* `category` - `string` (optional) - used for the `type` field of the logstash data if `logType` is not defined
* `fields` - `object` (optional) - extra fields to log with each event
* `layout` - (optional, defaults to dummyLayout) - used for the `message` field of the logstash data (see [layouts](layouts.md))

## Example
```javascript
log4js.configure({
  appenders: {
    logstash: {
      type: 'logstashUDP',
      host: 'log.server',
      port: '12345',
      logType: 'application',
      fields: { biscuits: 'digestive', tea: 'tetley' }
    }
  },
  categories: {
    default: { appenders: ['logstash'], level: 'info' }
  }
});
const logger = log4js.getLogger();
logger.info("important log message", { cheese: 'gouda', biscuits: 'hobnob' });
```
This will result in a JSON message being sent to `log.server:12345` over UDP, with the following format:
```javascript
{
  '@version': '1',
  '@timestamp': '2014-04-22T23:03:14.111Z',
  'type': 'application',
  'message': 'important log message',
  'fields': {
    'level': 'INFO',
    'category': 'default',
    'biscuits': 'hobnob',
    'cheese': 'gouda',
    'tea': 'tetley'
  }
}
```
