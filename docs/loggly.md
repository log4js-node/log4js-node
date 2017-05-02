# Loggly Appender

Sends logging events to [Loggly](https://www.loggly.com), optionally adding tags. This appender uses [node-loggly](https://www.npmjs.com/package/loggly), and you will need to include that in your dependencies if you want to use this appender. Consult the docs for node-loggly, or loggly itself, if you want more information on the configuration options below.

## Configuration

* `type` - `loggly`
* `token` - `string` - your really long input token
* `subdomain` - `string` - your subdomain
* `tags` - `Array<string>` (optional) - tags to include in every log message

This appender will scan the msg from the logging event, and pull out any argument of the
shape `{ tags: [] }` so that it's possible to add additional tags in a normal logging call. See the example below.

## Example

```javascript
log4js.configure({
  appenders: {
    loggly: {
      type: 'loggly',
      token: 'somethinglong',
      subdomain: 'your.subdomain',
      tags: [ 'tag1' ]
    }
  },
  categories: {
    default: { appenders: ['loggly'], level: 'info' }
  }
});

const logger = log4js.getLogger();
logger.info({ tags: ['my-tag-1', 'my-tag-2'] }, 'Some message');
```

This will result in a log message being sent to loggly with the tags `tag1`, `my-tag-1`, `my-tag-2`.
