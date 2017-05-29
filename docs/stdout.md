# Standard Output Appender

This appender writes all log events to the standard output stream. It is the default appender for log4js.

# Configuration

* `type` - `stdout`
* `layout` - `object` (optional, defaults to colouredLayout) - see [layouts](layouts.md)

# Example
```javascript
log4js.configure({
  appenders: { 'out': { type: 'stdout' } },
  categories: { default: { appenders: ['out'], level: 'info' } }
});
```
