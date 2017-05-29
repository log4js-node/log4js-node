# Standard Error Appender

This appender writes all log events to the standard error stream.

# Configuration

* `type` - `stderr`
* `layout` - `object` (optional, defaults to colouredLayout) - see [layouts](layouts.md)

# Example

```javascript
log4js.configure({
  appenders: { err: { type: 'stderr' } },
  categories: { default: { appenders: ['err'], level: 'ERROR' } }
});
```
