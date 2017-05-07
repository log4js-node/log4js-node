# Mailgun Appender

This appender uses the [mailgun](https://www.mailgun.com) service to send log messages as emails. It requires the [mailgun-js](https://www.npmjs.com/package/mailgun-js) package to be added to your dependencies.

## Configuration

* `type` - `mailgun`
* `apiKey` - `string` - your mailgun API key
* `domain` - `string` - your domain
* `from` - `string`
* `to` - `string`
* `subject` - `string`
* `layout` - `object` (optional, defaults to basicLayout) - see [layouts](layouts.md)

The body of the email will be the result of applying the layout to the log event. Refer to the mailgun docs for how to obtain your API key.

## Example

```javascript
log4js.configure({
  appenders: {
    type: 'mailgun',
    apiKey: '123456abc',
    domain: 'some.company',
    from: 'logging@some.service',
    to: 'important.bosses@some.company',
    subject: 'Error: Developers Need To Be Fired'
  }
});
```
