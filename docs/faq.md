# Frequently Asked Questions

## I want errors to go to a special file, but still want everything written to another file - how do I do that?

You'll need to use the [logLevelFilter](logLevelFilter.md). Here's an example configuration:
```javascript
log4js.configure({
  appenders: {
    everything: { type: 'file', filename: 'all-the-logs.log' },
    emergencies: {  type: 'file', filename: 'oh-no-not-again.log' },
    'just-errors': { type: 'logLevelFilter', appender: 'emergencies', level: 'error' }
  },
  categories: {
    default: { appenders: ['just-errors', 'everything'], level: 'debug' }
  }
});

const logger = log4js.getLogger();
logger.debug('This goes to all-the-logs.log');
logger.info('As does this.');
logger.error('This goes to all-the-logs.log and oh-no-not-again.log');

```

## I want to reload the configuration when I change my config file - how do I do that?

Previous versions of log4js used to watch for changes in the configuration file and reload when it changed. It didn't always work well, sometimes leaving file handles or sockets open. This feature was removed in version 2.x. As a replacement, I'd suggest using a library like [watchr](https://www.npmjs.com/package/watchr) to notify you of file changes. Then you can call `log4js.shutdown` followed by `log4js.configure` again.

## What happened to `replaceConsole` - it doesn't work any more?

I removed `replaceConsole` - it caused a few weird errors, and I wasn't entirely comfortable with messing around with a core part of node. If you still want to do this, then code like this should do the trick:
```javascript
log4js.configure(...); // set up your categories and appenders
const logger = log4js.getLogger('console');
console.log = logger.info.bind(logger); // do the same for others - console.debug, etc.
```

## I'm using PM2, but I'm not getting any logs!
To get log4js working with PM2, you'll need to install the [pm2-intercom](https://www.npmjs.com/package/pm2-intercom) module.
```bash
pm2 install pm2-intercom
```
Then add the value `pm2: true` to your log4js configuration. If you're also using `node-config`, then you'll probably have renamed your `NODE_APP_INSTANCE` environment variable. If so, you'll also need to add `pm2InstanceVar: '<NEW_APP_INSTANCE_ID>'` where `<NEW_APP_INSTANCE_ID>` should be replaced with the new name you gave the instance environment variable.
```javascript
log4js.configure({
  appenders: { out: { type: 'stdout'}},
  categories: { default: { appenders: ['out'], level: 'info'}},
  pm2: true,
  pm2InstanceVar: 'INSTANCE_ID'
});
```

## FFS, why did you mess with the PM2 stuff? It was working fine for me!
You can turn off the clustering support, with the `disableClustering: true` option in your config. This will make log4js behave more like it did before version 2.x. Each worker process will log its own output, instead of sending it all to the master process. Be careful if you're logging to files though, this could result in weird behaviour.

## NPM complains about nodemailer being deprecated, what should I do?

Nodemailer version 4.0.1 (the not-deprecated version) requires a node version >= 6, but log4js supports node versions >= 4. So until I stop supporting node versions less than 6 I can't update the dependency. It's only an optional dependency anyway, so you're free to install nodemailer@4.0.1 if you want - as far as I know it should work, the API looks the same to me. If you know that the smtp appender definitely doesn't work with nodemailer v4, then please create an issue with some details about the problem.
