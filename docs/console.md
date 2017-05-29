# Console Appender

This appender uses node's console object to write log events. It can also be used in the browser, if you're using browserify or something similar. Be aware that writing a high volume of output to the console can make your application use a lot of memory. If you experience this problem, try switching to the [stdout](stdout.md) appender.

# Configuration

* `type` - `console`
* `layout` - `object` (optional, defaults to colouredLayout) - see [layouts](layouts.md)

Note that all log events are output using `console.log` regardless of the event's level (so `ERROR` events will not be logged using `console.error`).

# Example
```javascript
log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: [ 'console' ], level: 'info' } }
});
```
