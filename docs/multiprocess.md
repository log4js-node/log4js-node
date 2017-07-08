# Multiprocess Appender

The multiprocess appender sends log events to a master server over TCP sockets. It can be used as a simple way to centralise logging when you have multiple servers or processes. It uses the node.js core networking modules, and so does not require any extra dependencies. Remember to call `log4js.shutdown` when your application terminates, so that the sockets get closed cleanly.

Note that if you're just using node core's `cluster` module then you don't need to use this appender - log4js will handle logging within the cluster transparently.

## Configuration

* `type` - `multiprocess`
* `mode` - `master|worker` - controls whether the appender listens for log events sent over the network, or is responsible for serialising events and sending them to a server.
* `appender` - `string` (only needed if `mode` == `master`)- the name of the appender to send the log events to
* `loggerPort` - `integer` (optional, defaults to `5000`) - the port to listen on, or send to
* `loggerHost` - `string` (optional, defaults to `localhost`) - the host/IP address to listen on, or send to

## Example (master)
```javascript
log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'all-the-logs.log' },
    server: { type: 'multiprocess', mode: 'master', appender: 'file', loggerHost: '0.0.0.0' }
  },
  categories: {
    default: { appenders: ['file'], level: 'info' }
  }
});
```
This creates a log server listening on port 5000, on all IP addresses the host has assigned to it. Note that the appender is not included in the appenders listed for the categories. Also note that the multiprocess master appender will send every event it receives to the underlying appender, regardless of level settings.

## Example (worker)
```javascript
log4js.configure({
  appenders: {
    network: { type: 'multiprocess', mode: 'worker', loggerHost: 'log.server' }
  },
  categories: {
    default: { appenders: ['network'], level: 'error' }
  }
});
```
This will send all error messages to `log.server:5000`.
