# Connect / Express Logger

The connect/express logger was added to log4js by [danbell](https://github.com/danbell). This allows connect/express servers to log using log4js. See `example-connect-logger.js`.

```javascript
var log4js = require('log4js');
var express = require('express');

log4js.configure({
 appenders: {
   console: { type: 'console' },
   file: { type: 'file', filename: 'cheese.log' }
 },
 categories: {
   cheese: { appenders: ['file'], level: 'info' },
   default: { appenders: ['console'], level: 'info' }
 }
});

var logger = log4js.getLogger('cheese');
var app = express();
app.use(log4js.connectLogger(logger, { level: 'info' }));
app.get('/', function(req,res) {
  res.send('hello world');
});
app.listen(5000);
```

The log4js.connectLogger supports the passing of an options object that can be used to set the following:
- log level
- log format string or function (the same as the connect/express logger)
- nolog expressions (represented as a string, regexp, or array)
- status code rulesets

For example:

```javascript
app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO, format: ':method :url' }));
```

or:

```javascript
app.use(log4js.connectLogger(logger, {
  level: 'auto',
  // include the Express request ID in the logs
  format: (req, res, format) => format(`:remote-addr - ${req.id} - ":method :url HTTP/:http-version" :status :content-length ":referrer" ":user-agent"`)
}));
```

When you request of POST, you want to log the request body parameter like JSON.
The log format function is very useful.
Please use log format function instead “tokens” property for use express's request or response.


```javascript
app.use(log4js.connectLogger(logger, {
  level: 'info',
  format: (req, res, format) => format(`:remote-addr :method :url ${JSON.stringify(req.body)}`)
}));
```

Added automatic level detection to connect-logger, depends on http status response, compatible with express 3.x and 4.x.

* http responses 3xx, level = WARN
* http responses 4xx & 5xx, level = ERROR
* else, level = INFO

```javascript
app.use(log4js.connectLogger(logger, { level: 'auto' }));
```

The levels of returned status codes can be configured via status code rulesets.

```javascript
app.use(log4js.connectLogger(logger, { level: 'auto', statusRules: [
  { from: 200, to: 299, level: 'debug' },
  { codes: [303, 304],  level: 'info' }
]}));
```

The log4js.connectLogger also supports a nolog option where you can specify a string, regexp, or array to omit certain log messages. Example of 1.2 below.

```javascript
app.use(log4js.connectLogger(logger, { level: 'auto', format: ':method :url', nolog: '\\.gif|\\.jpg$' }));
```

The log4js.connectLogger can add a response of express to context if `context` flag is set to `true`.
Application can use it in layouts or appenders.

In application:

```javascript
app.use(log4js.connectLogger(logger, { context: true }));
```

In layout:

```javascript
log4js.addLayout('customLayout', () => {
  return (loggingEvent) => {
    const res = loggingEvent.context.res;
    return util.format(...loggingEvent.data, res ? `status: ${res.statusCode}` : '');
  };
});
```

## Example nolog values

| nolog value | Will Not Log | Will Log |
|-------------|--------------|----------|
| `"\\.gif"`  | http://example.com/hoge.gif http://example.com/hoge.gif?fuga | http://example.com/hoge.agif |
| `"\\.gif\|\\.jpg$"` | http://example.com/hoge.gif http://example.com/hoge.gif?fuga http://example.com/hoge.jpg?fuga | http://example.com/hoge.agif http://example.com/hoge.ajpg http://example.com/hoge.jpg?hoge |
| `"\\.(gif\|jpe?g\|png)$"` | http://example.com/hoge.gif http://example.com/hoge.jpeg | http://example.com/hoge.gif?uid=2 http://example.com/hoge.jpg?pid=3 |
| `/\.(gif\|jpe?g\|png)$/` | as above | as above |
| `["\\.jpg$", "\\.png", "\\.gif"]` | same as `"\\.jpg\|\\.png\|\\.gif"` | same as `"\\.jpg\|\\.png\|\\.gif"` |
