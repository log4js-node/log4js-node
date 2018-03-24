# Clustering / Multi-process Logging

If you're running log4js in an application that uses [node's core cluster](https://nodejs.org/dist/latest-v8.x/docs/api/cluster.html) then log4js will transparently handle making sure the processes don't try to log at the same time. All logging is done on the master process, with the worker processes sending their log messages to the master via `process.send`. This ensures that you don't get multiple processes trying to write to the same file (or rotate the log files) at the same time.

This can cause problems in some rare circumstances, if you're experiencing weird logging problems, then use the `disableClustering: true` option in your log4js configuration to have every process behave as if it were the master process. Be careful if you're logging to files.

## I'm using PM2, but I'm not getting any logs!
To get log4js working with [PM2](http://pm2.keymetrics.io), you'll need to install the [pm2-intercom](https://www.npmjs.com/package/pm2-intercom) module.
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

## I'm using Passenger, but I'm not getting any logs!

[Passenger](https://www.phusionpassenger.com/library/) replaces the node.js core cluster module with a non-functional stub, so you won't see any output using log4js. To fix this, add `disableClustering: true` to your configuration. Again, be careful if you're logging to files.

## I'm not using clustering/pm2/passenger but I do have multiple processes that I'd like to all log to the same place

Ok, you probably want to look at the [tcp-server](tcp-server.md) and [tcp appender](tcp.md) documentation.
