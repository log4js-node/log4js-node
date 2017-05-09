# Slack Appender

Sends log events to a [slack](https://slack.com) channel. To use this appender you will need to include [slack-node](https://www.npmjs.com/package/slack-node) in your application's dependencies.

## Configuration

* `type` - `slack`
* `token` - `string` - your Slack API token (see the slack and slack-node docs)
* `channel_id` - `string` - the channel to send log messages
* `icon_url` - `string` (optional) - the icon to use for the message
* `username` - `string` - the username to display with the message
* `layout` - `object` (optional, defaults to `basicLayout`) - the layout to use for the message (see [layouts](layouts.md)).

## Example

```javascript
log4js.configure({
  appenders: {
    alerts: {
      type: 'slack',
      token: 'abc123def',
      channel_id: 'prod-alerts',
      username: 'our_application'
    }
  },
  categories: {
    default: { appenders: ['alerts'], level: 'error' }
  }
});
```
This configuration will send all error (and above) messages to the `prod-alerts` slack channel, with the username `our_application`.
