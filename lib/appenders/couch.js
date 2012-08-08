var nano = require("nano"),
    util = require("util"),
    async = require("async");

var C = {//backup of console.log; in case of infinity loops after console replacement
  log: function() {
    process.stdout.write(util.format.apply(this, arguments) + '\n');
  },
  error: function() {
    process.stderr.write(util.format.apply(this, arguments) + '\n');
  }
};

function createAppender(opts) {
  var db, endpoint;
  
  opts = opts || {};
  opts.host = opts.host || "localhost";
  opts.secured = (typeof opts.secure == "undefined") ? false : opts.secured;
  opts.port = 5984;
  opts.protocol = opts.secured ? "https" : "http";
  opts.db = opts.db || "logs";
  endpoint = [opts.protocol, "://", opts.host, ":", opts.port, "/", opts.db].join("");
  db = nano(endpoint);
  
  return function(loggingEvent) {
    var logs, m, d;

    d = new Date(loggingEvent.startTime);
    m = {
      date: [d.getFullYear(), d.getMonth()+1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()],
      category: loggingEvent.categoryName
    };
    logs = loggingEvent.data.map(function(item, i) {
      return {
        date: m.date,
        category: m.category,
        data: item
      };
    });
    db.bulk({docs: logs}, function(e) {
      if(e) C.error(e);
    });
  };
}

function configure(config, options) {
  var opt = options.couch ? options.couch : config;
  return createAppender(opt);
}

exports.appender = createAppender;
exports.configure = configure;