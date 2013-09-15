"use strict";
var should = require('should')
, fs = require('fs')
, sandbox = require('sandboxed-module')
, log4js = require('../lib/log4js');

describe('../lib/log4js', function() {
  describe('#getLogger', function() {
    it('should return a Logger', function() {
      log4js.getLogger().should.have.property('debug').be.a('function');
      log4js.getLogger().should.have.property('info').be.a('function');
      log4js.getLogger().should.have.property('error').be.a('function');
    });
  });

  describe('#configure', function() {
    it('should require an object or a filename', function() {
      [ 
        undefined, 
        null, 
        true,
        42,
        function() {}
      ].forEach(function(arg) {
        (function() { log4js.configure(arg); }).should.throw(
          "You must specify configuration as an object or a filename."
        );
      });
    });

    it('should complain if the file cannot be found', function() {
      (function() { log4js.configure("pants"); }).should.throw(
        "ENOENT, no such file or directory 'pants'"
      );
    });

    it('should pick up the configuration filename from env.LOG4JS_CONFIG', function() {
      process.env.LOG4JS_CONFIG = 'made-up-file';
      (function() { log4js.configure(); }).should.throw(
        "ENOENT, no such file or directory 'made-up-file'"
      );
      delete process.env.LOG4JS_CONFIG;
    });

    it('should complain if the config does not specify any appenders', function() {

      (function() { log4js.configure({}); }).should.throw(
        "You must specify at least one appender."
      );

      (function() { log4js.configure({ appenders: {} }); }).should.throw(
        "You must specify at least one appender."
      );

    });

    it(
      'should complain if the config does not specify an appender for the default category', 
      function() {
        
        (function() { 
          log4js.configure(
            {
              appenders: { 
                "console": { type: "console" } 
              }, 
              categories: {}
            }
          ); 
        }).should.throw(
          "You must specify an appender for the default category"
        );
        
        (function() { 
          log4js.configure({ 
            appenders: { 
              "console": { type: "console" } 
            },
            categories: {
              "cheese": { level: "DEBUG", appenders: [ "console" ] }
            }
          }); 
        }).should.throw(
          "You must specify an appender for the default category"
        );
        
      }
    );

    it('should complain if a category does not specify level or appenders', function() {
      (function() {
        log4js.configure(
          { 
            appenders: { "console": { type: "console" } },
            categories: {
              "default": { thing: "thing" }
            }
          }
        );
      }).should.throw(
        "You must specify a level for category 'default'."
      );

      (function() {
        log4js.configure(
          { 
            appenders: { "console": { type: "console" } },
            categories: {
              "default": { level: "DEBUG" }
            }
          }
        );
      }).should.throw(
        "You must specify an appender for category 'default'."
      );
    });

    it('should complain if a category specifies a level that does not exist', function() {
      (function() {
        log4js.configure(
          { 
            appenders: { "console": { type: "console" }},
            categories: {
              "default": { level: "PICKLES" }
            }
          }
        );
      }).should.throw(
        "Level 'PICKLES' is not valid for category 'default'. " + 
          "Acceptable values are: OFF, TRACE, DEBUG, INFO, WARN, ERROR, FATAL."
      );
    });

    it('should complain if a category specifies an appender that does not exist', function() {
      (function() {
        log4js.configure(
          { 
            appenders: { "console": { type: "console" }},
            categories: {
              "default": { level: "DEBUG", appenders: [ "cheese" ] }
            }
          }
        );
      }).should.throw(
        "Appender 'cheese' for category 'default' does not exist. Known appenders are: console."
      );
    });

    before(function(done) {
      fs.unlink("test.log", function (err) { done(); });
    });

    it('should set up the included appenders', function(done) {
      log4js.configure({
        appenders: {
          "file": { type: "file", filename: "test.log" }
        },
        categories: {
          default: { level: "DEBUG", appenders: [ "file" ] }
        }
      });
      log4js.getLogger('test').debug("cheese");

      setTimeout(function() {
        fs.readFile("test.log", "utf-8", function(err, contents) {
          contents.should.include("cheese");
          done(err);
        });
      }, 50);
    });

    after(function(done) {
      fs.unlink("test.log", function (err) { done(); });
    });

    it('should set up third-party appenders', function() {
      var events = [], log4js_sandbox = sandbox.require(
        '../lib/log4js',
        { 
          requires: {
            'cheese': function() {
              return function() {
                return function(evt) { events.push(evt); };
              };
            }
          }
        }
      );
      log4js_sandbox.configure({
        appenders: {
          "thing": { type: "cheese" }
        },
        categories: {
          default: { level: "DEBUG", appenders: [ "thing" ] }
        }
      });
      log4js_sandbox.getLogger().info("edam");

      events.should.have.length(1);
      events[0].data[0].should.eql("edam");

    });

    it('should only load third-party appenders once', function() {
      var moduleCalled = 0
      , log4js_sandbox = sandbox.require(
        '../lib/log4js',
        {
          requires: {
            'cheese': function() {
              moduleCalled += 1;
              return function() {
                return function() {};
              };
            }
          }
        }
      );
      log4js_sandbox.configure({
        appenders: {
          "thing1": { type: "cheese" },
          "thing2": { type: "cheese" }
        },
        categories: {
          default: { level: "DEBUG", appenders: [ "thing1", "thing2" ] }
        }
      });

      moduleCalled.should.eql(1);
    });

    it('should pass layouts and levels to appender modules', function() {
      var layouts
      , levels
      , log4js_sandbox = sandbox.require(
        '../lib/log4js',
        {
          requires: {
            'cheese': function(arg1, arg2) {
              layouts = arg1;
              levels = arg2;
              return function() { 
                return function() {};
              };
            }
          }
        }
      );
      log4js_sandbox.configure({
        appenders: {
          "thing": { type: "cheese" }
        },
        categories: {
          "default": { level: "debug", appenders: [ "thing" ] }
        }
      });

      layouts.should.have.property("basicLayout");
      levels.should.have.property("toLevel");
    });

    it('should pass config and appenderByName to appender makers', function() {
      var otherAppender = function() { /* I do nothing */ }
      , config
      , other
      , log4js_sandbox = sandbox.require(
        '../lib/log4js',
        { 
          requires: {
            'other': function() {
              return function() {
                return otherAppender;
              };
            },
            'cheese': function() {
              return function(arg1, arg2) {
                config = arg1;
                other = arg2("other");
                return function() {};
              };
            }
          }
        }
      );
      log4js_sandbox.configure({
        appenders: {
          "other": { type: "other" },
          "thing": { type: "cheese", something: "something" }
        },
        categories: {
          default: { level: "debug", appenders: [ "other", "thing" ] }
        }
      });

      other.should.equal(otherAppender);
      config.should.have.property("something", "something");

    });

    it('should complain about unknown appenders', function() {
      (function() {
        log4js.configure({
          appenders: {
            "thing": { type: "madeupappender" }
          },
          categories: {
            default: { level: "DEBUG", appenders: [ "thing" ] }
          }
        });
      }).should.throw(
        "Could not load appender of type 'madeupappender'."
      );
    });

    it('should read config from a file', function() {
      var events = [], log4js_sandbox = sandbox.require(
        '../lib/log4js',
        { 
          requires: { 
            'cheese': function() {
              return function() {
                return function(event) { events.push(event); };
              };
            }
          }
        }
      );

      log4js_sandbox.configure(__dirname + "/with-cheese.json");
      log4js_sandbox.getLogger().debug("gouda");

      events.should.have.length(1);
      events[0].data[0].should.eql("gouda");
    });

    it('should set up log levels for categories', function() {
      var events = []
      , noisyLogger
      , log4js_sandbox = sandbox.require(
        '../lib/log4js',
        { 
          requires: { 
            'cheese': function() {
              return function() {
                return function(event) { events.push(event); };
              };
            }
          }
        }
      );

      log4js_sandbox.configure(__dirname + "/with-cheese.json");
      noisyLogger = log4js_sandbox.getLogger("noisy");
      noisyLogger.debug("pow");
      noisyLogger.info("crash");
      noisyLogger.warn("bang");
      noisyLogger.error("boom");
      noisyLogger.fatal("aargh");

      events.should.have.length(2);
      events[0].data[0].should.eql("boom");
      events[1].data[0].should.eql("aargh");

    });

    it('should have a default log level for all categories', function() {
      var events = []
      , log4js_sandbox = sandbox.require(
        '../lib/log4js',
        { 
          requires: { 
            'cheese': function() {
              return function() {
                return function(event) { events.push(event); };
              };
            }
          }
        }
      );

      //with-cheese.json only specifies categories noisy and default
      //unspecified categories should use the default category config
      log4js_sandbox.configure(__dirname + "/with-cheese.json");
      log4js_sandbox.getLogger("surprise").trace("not seen");
      log4js_sandbox.getLogger("surprise").info("should be seen");
      
      events.should.have.length(1);
      events[0].data[0].should.eql("should be seen");
      
    });

  });

  describe('with no configuration', function() {
    var events = []
    , log4js_sandboxed = sandbox.require(
      '../lib/log4js',
      {
        requires: {
          './appenders/console': function() {
            return function() {
              return function(event) { events.push(event); };
            };
          }
        }
      }
    );

    log4js_sandboxed.getLogger("blah").debug("goes to console");
    log4js_sandboxed.getLogger("yawn").trace("does not go to console");
    log4js_sandboxed.getLogger().error("also goes to console");

    it('should log events of debug level and higher to console', function() {
      events.should.have.length(2);
      events[0].data[0].should.eql("goes to console");
      events[0].category.should.eql("blah");
      events[0].level.toString().should.eql("DEBUG");
      events[1].data[0].should.eql("also goes to console");
      events[1].category.should.eql("default");
      events[1].level.toString().should.eql("ERROR");
    });
  });
});
