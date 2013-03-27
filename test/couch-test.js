var path = require('path')
, log4js = require('../lib/log4js')
, assert = require('assert')
, nano = require('nano')
, util = require('util');


var logger = log4js.getLogger('default-settings')
, db = nano("http://localhost:5984/logs")
, feed = db.follow({since: "now", include_doc: true});

  log4js.clearAppenders();
  log4js.addAppender(require('../lib/appenders/couch').appender(), 'default-settings');
  
  feed.once('change', function(change) {
    var db = nano("http://localhost:5984/logs");
    db.get(change.id, function(e, doc) {
      console.log(doc);
    });
  });
  feed.follow();
  logger.info("This should be in local couchdb.");
