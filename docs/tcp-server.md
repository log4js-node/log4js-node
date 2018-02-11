# TCP Server Appender

Strictly speaking, this is not an appender - but it is configured as one. The TCP server listens for log messages on a port, taking JSON-encoded log events and then forwarding them to the other appenders. It can be used as a simple way to centralise logging when you have multiple servers or processes. It uses the node.js core networking modules, and so does not require any extra dependencies. Remember to call `log4js.shutdown` when your application terminates, so that the sockets get closed cleanly. It is designed to work with the [tcp appender](tcp.md), but could work with anything that sends correctly formatted JSON log events.

## Configuration

* `type` - `tcp-server`
* `port` - `integer` (optional, defaults to `5000`) - the port to listen on
* `host` - `string` (optional, defaults to `localhost`) - the host/IP address to listen on

## Example (master)
```javascript
log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'all-the-logs.log' },
    server: { type: 'tcp-server', host: '0.0.0.0' }
  },
  categories: {
    default: { appenders: ['file'], level: 'info' }
  }
});
```
This creates a log server listening on port 5000, on all IP addresses the host has assigned to it. Note that the appender is not included in the appenders listed for the categories. All events received on the socket will be forwarded to the other appenders, as if they had originated on the same server.
