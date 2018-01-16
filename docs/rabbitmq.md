# Rabbitmq Appender

Push log events to a [Rabbitmq](https://www.rabbitmq.com/) MQ. You will need to include the [amqplib](https://www.npmjs.com/package/amqplib) package in your application's dependencies to use this appender.

## Configuration

* `type` - `rabbitmq`
* `host` - `string` (optional, defaults to `127.0.0.1`) - the location of the rabbitmq server
* `port` - `integer` (optional, defaults to `5672`) - the port the rabbitmq server is listening on
* `username` - `string` (optional, defaults to `guest`) - username to use when authenticating connection to rabbitmq
* `password` - `string` (optional, defaults to `guest`) - password to use when authenticating connection to rabbitmq
* `routing_key` - `string` (optional, defaults to `logstash`) - rabbitmq message's routing_key
* `durable` - `string` (optional, defaults to false) - will that RabbitMQ lose our queue.
* `exchange` - `string` - rabbitmq send message's exchange
* `mq_type` - `string` - rabbitmq message's mq_type
* `layout` - `object` (optional, defaults to `messagePassThroughLayout`) - the layout to use for log events (see [layouts](layouts.md)).

The appender will use the Rabbitmq Routing model command to send the log event messages to the channel.

## Example

```javascript
log4js.configure({
  appenders: {
    mq: {
      type: 'rabbitmq',
      host: '127.0.0.1',
      port: 5672,
      username: 'guest',
      password: 'guest',
      routing_key: 'logstash',
      exchange: 'exchange_logs',
      mq_type: 'direct',
      durable: true
    }
  },
  categories: { default: { appenders: ['mq'], level: 'info' } }
});
```

This configuration will push log messages to the rabbitmq on `127.0.0.1:5672`.
