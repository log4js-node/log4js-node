var vows = require('vows')
, fs = require('fs')
, path = require('path')
, log4js = require('../lib/log4js')
, assert = require('assert')
, nano = require('nano')
, util = require('util');


log4js.clearAppenders();

vows.describe('log4js couchAppender').addBatch({

    'with default couchAppender settings': {
        topic: function() {
          var that = this
          ,logger = log4js.getLogger('default-settings')
          , db = nano("http://localhost:5984/logs")
          , feed = db.follow({since: "now", include_doc: true});

            log4js.clearAppenders();
            log4js.addAppender(require('../lib/appenders/couch').appender(), 'default-settings');
            
            feed.once('change', that.callback);
            feed.follow();
            logger.info("This should be in local couchdb.");

        },
        'should write log messages to the couchdb': function(change) {
            var db = nano("http://localhost:5984/logs");
            db.get(change.id, function(e, doc) {
              assert.include(doc.data, "This should be in local couchdb.");
            });
        }
    }
}).export(module);
