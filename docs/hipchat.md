# Hipchat Appender

The hipchat appender will send every log message it receives to a [hipchat](http://www.hipchat.com) server, over HTTP. It uses the [hipchat-notifier](https://www.npmjs.com/package/hipchat-notifier) library, and you will need to include that in your dependencies if you want to use this appender. If you're not sure what some of the configuration options below mean, then check the documentation for hipchat-notifier, and the hipchat docs themselves.

## Configuration

* `type` - `hipchat`
* `hipchat_token` - `string` - User token with notification privileges
* `hipchat_room` - `string` - Room ID or name
* `hipchat_from` - `string` (optional, defaults to empty string) - a label to say where the message is from
* `hipchat_notify` - `boolean` (optional, defaults to `false`) - make hipchat annoy people
* `hipchat_host` - `string` (optional, defaults to `api.hipchat.com`) - set this if you have your own hipchat server
* `hipchat_response_callback` - `function` (optional, defaults to only throwing errors) - implement this function if you want intercept the responses from hipchat
* `layout` - (optional, defaults to `messagePassThroughLayout`)  - see [layouts](layouts.md)

## Example (default config)

```javascript
log4js.configure({
  appenders: {
    squawk: { type: 'hipchat', hipchat_token: 'abc123', hipchat_room: 'ops' }
  },
  categories: {
    default: { appenders: ['squawk'], level: 'error'}
  }
});
```
This will result in all error (and above) messages being sent to the hipchat room "ops".

# Example (use all the options!)

```javascript
log4js.configure({
  appenders: {
    squawk: {
      type: 'hipchat',
      hipchat_token: 'abc123',
      hipchat_room: 'things_are_on_fire',
      hipchat_from: 'Hal9000',
      hipchat_notify: true,
      hipchat_host: 'hipchat.yourorganisation.com',
      hipchat_response_callback: function(err, response) {
        console.log("I got a response from hipchat: ", response);
      }
    }
  },
  categories: {
    default: { appenders: ['squawk'], level: 'info' }
  }
});
```
