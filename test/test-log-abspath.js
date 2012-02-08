var vows = require('vows')
, assert = require('assert')
, sandbox = require('sandboxed-module');

vows.describe('log4js-abspath').addBatch({
    'configuration is passed as object with options.cwd': {
        topic: function() {
            var appenderConfig
          , log4js = sandbox.require(
              '../lib/log4js'
            , { requires:
                { './appenders/file':
                  {
                      name: "file"
                    , appender: function() {}
                    , configure: function(configuration) {
                          appenderConfig = configuration;
                          return function() {};
                      }
                  }
                }
              }
          )
          , config = {
                "appenders": [
                    {
                        "type" : "file",
                        "filename" : "cheesy-wotsits.log",
                        "maxLogSize" : 1024,
                        "backups" : 3,
                        "pollInterval" : 15
                    }
                ]
            };
            log4js.configure(config, {
                cwd: '/absolute/path/to'
            });
            return appenderConfig;
        },
        'should be an absolute path': function(configuration) {
            assert.equal(configuration.filename, '/absolute/path/to/cheesy-wotsits.log');
        }
    },

    'configuration passed as filename with options.cwd': {
        topic: function() {
            var appenderConfig
          , configFilename
          , log4js = sandbox.require(
                '../lib/log4js'
              , { requires:
                  { 'fs':
                    {
                        statSync: function() {
                            return { mtime: Date.now() };
                        },
                        readFileSync: function(filename) {
                            configFilename = filename;
                            return JSON.stringify({
                                appenders: [
                                    { type: "file"
                                    , filename: "whatever.log"
                                    }
                                ]
                            });
                        },
                        readdirSync: function() {
                            return ['file'];
                        }
                    }
                , './appenders/file':
                    {
                      name: "file"
                    , appender: function() {}
                    , configure: function(configuration) {
                          appenderConfig = configuration;
                          return function() {};
                      }
                    }
                  }
                }
          );
            log4js.configure("/path/to/cheese.json", {
                cwd: '/absolute/path/to'
            });
            return [ configFilename, appenderConfig ];
        },
        'should read the config from a file': function(args) {
            assert.equal(args[0], '/path/to/cheese.json');
        },
        'should be an absolute path': function(args) {
            assert.equal(args[1].filename, "/absolute/path/to/whatever.log");
        }
    },
}).export(module);