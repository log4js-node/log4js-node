var log4js = require('./lib/log4js')
, log
, i = 0;
log4js.configure({
  "appenders": [
      {
          "type": "file",
          "filename": "tmp-test.log",
          "maxLogSize": 1024,
          "backups": 3,
          "pollInterval": 0.1,
          "category": "test"
      },
      {
          type: "console"
        , category: "console"
      }
  ]
});
log = log4js.getLogger("test");

function doTheLogging(x) {
    log.info("Logging something %d", x);
}

for ( ; i < 100000; i++) {
    doTheLogging(i);
}