# TCP Appender

The TCP appender sends log events to a master server over TCP sockets. It can be used as a simple way to centralise logging when you have multiple servers or processes. It uses the node.js core networking modules, and so does not require any extra dependencies. Remember to call `log4js.shutdown` when your application terminates, so that the sockets get closed cleanly. It's designed to work with the [tcp-server](tcp-server.md), but it doesn't necessarily have to, just make sure whatever is listening at the other end is expecting JSON objects as strings.

## Configuration

* `type` - `tcp`
* `port` - `integer` (optional, defaults to `5000`) - the port to send to
* `host` - `string` (optional, defaults to `localhost`) - the host/IP address to send to

## Example
```javascript
log4js.configure({
  appenders: {
    network: { type: 'tcp', host: 'log.server' }
  },
  categories: {
    default: { appenders: ['network'], level: 'error' }
  }
});
```
This will send all error messages to `log.server:5000`.
