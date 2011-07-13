var vows = require('vows')
, assert = require('assert')
, sandbox = require('sandboxed-module');

vows.describe('log4js').addBatch({
    'getLogger': {
	topic: function() {
	    var log4js = require('../lib/log4js');
	    log4js.clearAppenders();
	    var logger = log4js.getLogger('tests');
	    logger.setLevel("DEBUG");
	    return logger;
	},

	'should take a category and return a logger': function(logger) {
	    assert.equal(logger.category, 'tests');
	    assert.equal(logger.level.toString(), "DEBUG");
	    assert.isFunction(logger.debug);
	    assert.isFunction(logger.info);
	    assert.isFunction(logger.warn);
	    assert.isFunction(logger.error);
	    assert.isFunction(logger.fatal);
	},

	'log events' : {
	    topic: function(logger) {
		var events = [];
		logger.addListener("log", function (logEvent) { events.push(logEvent); });
		logger.debug("Debug event");
		logger.trace("Trace event 1");
		logger.trace("Trace event 2");
		logger.warn("Warning event");
                logger.error("Aargh!", new Error("Pants are on fire!"));
                logger.error("Simulated CouchDB problem", { err: 127, cause: "incendiary underwear" });
		return events;
	    },

	    'should emit log events': function(events) {
		assert.equal(events[0].level.toString(), 'DEBUG');
		assert.equal(events[0].data[0], 'Debug event');
		assert.instanceOf(events[0].startTime, Date);
	    },

	    'should not emit events of a lower level': function(events) {
		assert.length(events, 4);
		assert.equal(events[1].level.toString(), 'WARN');
	    },

            'should include the error if passed in': function (events) {
                assert.instanceOf(events[2].data[1], Error);
                assert.equal(events[2].data[1].message, 'Pants are on fire!');
            }

	},

    },

    'fileAppender': {
	topic: function() {
	    var appender, logmessages = [], thing = "thing", fakeFS = {
		openSync: function() {
		    assert.equal(arguments[0], './tmp-tests.log');
		    assert.equal(arguments[1], 'a');
		    assert.equal(arguments[2], 0644);
		    return thing;
		},
		write: function() {
		    assert.equal(arguments[0], thing);
		    assert.isString(arguments[1]);
		    assert.isNull(arguments[2]);
		    assert.equal(arguments[3], "utf8");
		    logmessages.push(arguments[1]);
		},
                watchFile: function() {
                    throw new Error("watchFile should not be called if logSize is not defined");
                }
	    },
	    log4js = sandbox.require(
                '../lib/log4js',
                {
                    requires: {
                        'fs': fakeFS
                    }
                }
            );
	    log4js.clearAppenders();

	    appender = log4js.fileAppender('./tmp-tests.log', log4js.layouts.messagePassThroughLayout);
	    log4js.addAppender(appender, 'file-test');

	    var logger = log4js.getLogger('file-test');
	    logger.debug("this is a test");

	    return logmessages;
	},
	'should write log messages to file': function(logmessages) {
	    assert.length(logmessages, 1);
	    assert.equal(logmessages, "this is a test\n");
	}
    },

    'fileAppender - with rolling based on size and number of files to keep': {
        topic: function() {
            var watchCb,
            filesOpened = [],
            filesClosed = [],
            filesRenamed = [],
            newFilenames = [],
            existingFiles = ['tests.log'],
            log4js = sandbox.require(
                '../lib/log4js'
              , {
                  requires: {
                      'fs': {
                          watchFile: function(file, options, callback) {
                              assert.equal(file, 'tests.log');
                              assert.equal(options.persistent, false);
                              assert.equal(options.interval, 30000);
                              assert.isFunction(callback);
                              watchCb = callback;
                          },
                          openSync: function(file) {
                              assert.equal(file, 'tests.log');
                              filesOpened.push(file);
                              return file;
                          },
                          statSync: function(file) {
                              if (existingFiles.indexOf(file) < 0) {
                                  throw new Error("this file doesn't exist");
                              } else {
                                  return true;
                              }
                          },
                          renameSync: function(oldFile, newFile) {
                              filesRenamed.push(oldFile);
                              existingFiles.push(newFile);
                          },
                          closeSync: function(file) {
                              //it should always be closing tests.log
                              assert.equal(file, 'tests.log');
                              filesClosed.push(file);
                          }
                      }
                  }
              }
            );
            var appender = log4js.fileAppender('tests.log', log4js.messagePassThroughLayout, 1024, 2, 30);
            return [watchCb, filesOpened, filesClosed, filesRenamed, existingFiles];
        },

        'should close current log file, rename all old ones, open new one on rollover': function(args) {
            var watchCb = args[0], filesOpened = args[1], filesClosed = args[2], filesRenamed = args[3], existingFiles = args[4];
            assert.isFunction(watchCb);
            //tell the watchCb that the file is below the threshold
            watchCb({ size: 891 }, { size: 0 });
            //filesOpened should still be the first one.
            assert.length(filesOpened, 1);
            //tell the watchCb that the file is now over the threshold
            watchCb({ size: 1053 }, { size: 891 });
            //it should have closed the first log file.
            assert.length(filesClosed, 1);
            //it should have renamed the previous log file
            assert.length(filesRenamed, 1);
            //and we should have two files now
            assert.length(existingFiles, 2);
            assert.deepEqual(existingFiles, ['tests.log', 'tests.log.1']);
            //and opened a new log file.
            assert.length(filesOpened, 2);

            //now tell the watchCb that we've flipped over the threshold again
            watchCb({ size: 1025 }, { size: 123 });
            //it should have closed the old file
            assert.length(filesClosed, 2);
            //it should have renamed both the old log file, and the previous '.1' file
            assert.length(filesRenamed, 3);
            assert.deepEqual(filesRenamed, ['tests.log', 'tests.log.1', 'tests.log' ]);
            //it should have renamed 2 more file
            assert.length(existingFiles, 4);
            assert.deepEqual(existingFiles, ['tests.log', 'tests.log.1', 'tests.log.2', 'tests.log.1']);
            //and opened a new log file
            assert.length(filesOpened, 3);

            //tell the watchCb we've flipped again.
            watchCb({ size: 1024 }, { size: 234 });
            //close the old one again.
            assert.length(filesClosed, 3);
            //it should have renamed the old log file and the 2 backups, with the last one being overwritten.
            assert.length(filesRenamed, 5);
            assert.deepEqual(filesRenamed, ['tests.log', 'tests.log.1', 'tests.log', 'tests.log.1', 'tests.log' ]);
            //it should have renamed 2 more files
            assert.length(existingFiles, 6);
            assert.deepEqual(existingFiles, ['tests.log', 'tests.log.1', 'tests.log.2', 'tests.log.1', 'tests.log.2', 'tests.log.1']);
            //and opened a new log file
            assert.length(filesOpened, 4);
        }
    },

    'configure' : {
	topic: function() {
	    var messages = {}, fakeFS = {
		openSync: function(file) {
		    return file;
		},
		write: function(file, message) {
		    if (!messages.hasOwnProperty(file)) {
			messages[file] = [];
		    }
		    messages[file].push(message);
		},
		readFileSync: function(file, encoding) {
		    return require('fs').readFileSync(file, encoding);
		},
                watchFile: function(file) {
                    messages.watchedFile = file;
                }
	    },
	    log4js = sandbox.require(
                '../lib/log4js'
              , {
                  requires: {
                      'fs': fakeFS
                  }
              }
            );
	    return [ log4js, messages ];
	},
	'should load appender configuration from a json file': function(args) {
	    var log4js = args[0], messages = args[1];
	    delete messages['tmp-tests.log'];
	    log4js.clearAppenders();
	    //this config file defines one file appender (to ./tmp-tests.log)
	    //and sets the log level for "tests" to WARN
	    log4js.configure('test/log4js.json');
	    var logger = log4js.getLogger("tests");
	    logger.info('this should not be written to the file');
	    logger.warn('this should be written to the file');
	    assert.length(messages['tmp-tests.log'], 1);
	    assert.equal(messages['tmp-tests.log'][0], 'this should be written to the file\n');
	},
	'should handle logLevelFilter configuration': function(args) {
	    var log4js = args[0], messages = args[1];
	    delete messages['tmp-tests.log'];
	    delete messages['tmp-tests-warnings.log'];
	    log4js.clearAppenders();
	    log4js.configure('test/with-logLevelFilter.json');
	    var logger = log4js.getLogger("tests");
	    logger.info('main');
	    logger.error('both');
	    logger.warn('both');
	    logger.debug('main');

	    assert.length(messages['tmp-tests.log'], 4);
	    assert.length(messages['tmp-tests-warnings.log'], 2);
	    assert.deepEqual(messages['tmp-tests.log'], ['main\n','both\n','both\n','main\n']);
	    assert.deepEqual(messages['tmp-tests-warnings.log'], ['both\n','both\n']);
	},
        'should handle fileAppender with log rolling' : function(args) {
            var log4js = args[0], messages = args[1];
            delete messages['tmp-test.log'];
            log4js.configure('test/with-log-rolling.json');
            assert.equal(messages.watchedFile, 'tmp-test.log');
        },
        'should handle an object or a file name': function(args) {
	    var log4js = args[0],
	    messages = args[1],
	    config = {
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
	    delete messages['cheesy-wotsits.log'];
	    log4js.configure(config);
	    assert.equal(messages.watchedFile, 'cheesy-wotsits.log');
	}
    },

    'with no appenders defined' : {
        topic: function() {
            var logger
          , message
          , log4js = sandbox.require(
              '../lib/log4js'
            , {
                globals: {
                  console: {
                      log: function(msg) {
                          message = msg;
                      }
                  }
              }
            }
          );
	    logger = log4js.getLogger("some-logger");
            logger.debug("This is a test");
            return message;
        },
        'should default to the console appender': function(message) {
            assert.isTrue(/This is a test$/.test(message));
        }
    },

    'addAppender' : {
        topic: function() {
            var log4js = require('../lib/log4js');
            log4js.clearAppenders();
            return log4js;
        },
        'without a category': {
            'should register the function as a listener for all loggers': function (log4js) {
                var appenderEvent, appender = function(evt) { appenderEvent = evt; }, logger = log4js.getLogger("tests");
                log4js.addAppender(appender);
                logger.debug("This is a test");
                assert.equal(appenderEvent.data[0], "This is a test");
                assert.equal(appenderEvent.categoryName, "tests");
                assert.equal(appenderEvent.level.toString(), "DEBUG");
            },
            'should also register as an appender for loggers if an appender for that category is defined': function (log4js) {
                var otherEvent, appenderEvent, cheeseLogger;
                log4js.addAppender(function (evt) { appenderEvent = evt; });
                log4js.addAppender(function (evt) { otherEvent = evt; }, 'cheese');

                cheeseLogger = log4js.getLogger('cheese');
                cheeseLogger.debug('This is a test');
                assert.deepEqual(appenderEvent, otherEvent);
                assert.equal(otherEvent.data[0], 'This is a test');
                assert.equal(otherEvent.categoryName, 'cheese');

                otherEvent = undefined;
                appenderEvent = undefined;
                log4js.getLogger('pants').debug("this should not be propagated to otherEvent");
                assert.isUndefined(otherEvent);
                assert.equal(appenderEvent.data[0], "this should not be propagated to otherEvent");
            }
        },

        'with a category': {
            'should only register the function as a listener for that category': function(log4js) {
                var appenderEvent, appender = function(evt) { appenderEvent = evt; }, logger = log4js.getLogger("tests");
                log4js.addAppender(appender, 'tests');
                logger.debug('this is a category test');
                assert.equal(appenderEvent.data[0], 'this is a category test');

                appenderEvent = undefined;
                log4js.getLogger('some other category').debug('Cheese');
                assert.isUndefined(appenderEvent);
            }
        },

        'with multiple categories': {
            'should register the function as a listener for all the categories': function(log4js) {
                var appenderEvent, appender = function(evt) { appenderEvent = evt; }, logger = log4js.getLogger('tests');
                log4js.addAppender(appender, 'tests', 'biscuits');

                logger.debug('this is a test');
                assert.equal(appenderEvent.data[0], 'this is a test');
                appenderEvent = undefined;

                var otherLogger = log4js.getLogger('biscuits');
                otherLogger.debug("mmm... garibaldis");
                assert.equal(appenderEvent.data[0], "mmm... garibaldis");

                appenderEvent = undefined;

                log4js.getLogger("something else").debug("pants");
                assert.isUndefined(appenderEvent);
            },
            'should register the function when the list of categories is an array': function(log4js) {
                var appenderEvent, appender = function(evt) { appenderEvent = evt; };
                log4js.addAppender(appender, ['tests', 'pants']);

                log4js.getLogger('tests').debug('this is a test');
                assert.equal(appenderEvent.data[0], 'this is a test');

                appenderEvent = undefined;

                log4js.getLogger('pants').debug("big pants");
                assert.equal(appenderEvent.data[0], "big pants");

                appenderEvent = undefined;

                log4js.getLogger("something else").debug("pants");
                assert.isUndefined(appenderEvent);
            }
        }
    },

    'default setup': {
        topic: function() {
            var pathsChecked = [],
            message,
            logger,
            modulePath = require('path').normalize(__dirname + '/../lib/log4js.json'),
            fakeFS = {
                readFileSync: function (file, encoding) {
                    assert.equal(file, modulePath);
                    assert.equal(encoding, 'utf8');
                    return '{ "appenders" : [ { "type": "console", "layout": { "type": "messagePassThrough" }} ] }';
                },
                statSync: function (path) {
                    pathsChecked.push(path);
                    if (path === modulePath) {
                        return true;
                    } else {
                        throw new Error("no such file");
                    }
                }
            },
            fakeConsole = {
                log : function (msg) { message = msg; },
                info: this.log,
                warn: this.log,
                debug: this.log,
                error: this.log
            },
	    log4js = sandbox.require(
                '../lib/log4js',
                {
                    requires: {
                        'fs': fakeFS
                    },
                    globals: {
                        'console': fakeConsole
                    }
                }
            );

	    logger = log4js.getLogger('a-test');
            logger.debug("this is a test");

            return [ pathsChecked, message, modulePath ];
        },

        'should check current directory, require paths, and finally the module dir for log4js.json': function(args) {
            var pathsChecked = args[0];
              expectedPaths = ['log4js.json'].concat(
                  require.paths.map(function(item) {
                      return item + '/log4js.json';
                  }),
                  args[2]
              );
            assert.deepEqual(pathsChecked, expectedPaths);
        },

        'should configure log4js from first log4js.json found': function(args) {
            var message = args[1];
            assert.equal(message, 'this is a test');
        }
    },

    'logLevelFilter': {
        topic: function() {
            var log4js = require('../lib/log4js'), logEvents = [], logger;
            log4js.clearAppenders();
            log4js.addAppender(log4js.logLevelFilter('ERROR', function(evt) { logEvents.push(evt); }), "logLevelTest");
            logger = log4js.getLogger("logLevelTest");
            logger.debug('this should not trigger an event');
            logger.warn('neither should this');
            logger.error('this should, though');
            logger.fatal('so should this');
            return logEvents;
        },
        'should only pass log events greater than or equal to its own level' : function(logEvents) {
            assert.length(logEvents, 2);
            assert.equal(logEvents[0].data[0], 'this should, though');
            assert.equal(logEvents[1].data[0], 'so should this');
        }
    },

    'console' : {
        topic: function() {
            var fakeConsole = {}
          , logEvents = []
          , log4js;

            ['trace','debug','log','info','warn','error'].forEach(function(fn) {
                fakeConsole[fn] = function() {
                    throw new Error("this should not be called.");
                };
            });

            log4js = sandbox.require(
                '../lib/log4js'
              , {
                  globals: {
                      console: fakeConsole
                  }
              }
            );

            log4js.clearAppenders();
            log4js.addAppender(function(evt) {
                logEvents.push(evt);
            });

            fakeConsole.log("Some debug message someone put in a module");
            fakeConsole.debug("Some debug");
            fakeConsole.error("An error");
            fakeConsole.info("some info");
            fakeConsole.warn("a warning");

            fakeConsole.log("cheese (%s) and biscuits (%s)", "gouda", "garibaldis");
            fakeConsole.log({ lumpy: "tapioca" });
            fakeConsole.log("count %d", 123);
            fakeConsole.log("stringify %j", { lumpy: "tapioca" });

            return logEvents;
        },
        'should replace console.log methods with log4js ones': function(logEvents) {
            assert.equal(logEvents[0].data[0], "Some debug message someone put in a module");
            assert.equal(logEvents[0].level.toString(), "INFO");
            assert.equal(logEvents[1].data[0], "Some debug");
            assert.equal(logEvents[1].level.toString(), "DEBUG");
            assert.equal(logEvents[2].data[0], "An error");
            assert.equal(logEvents[2].level.toString(), "ERROR");
            assert.equal(logEvents[3].data[0], "some info");
            assert.equal(logEvents[3].level.toString(), "INFO");
            assert.equal(logEvents[4].data[0], "a warning");
            assert.equal(logEvents[4].level.toString(), "WARN");
        }
    },
    'configuration persistence' : {
	'should maintain appenders between requires': function () {
	    var logEvent, firstLog4js = require('../lib/log4js'), secondLog4js;
	    firstLog4js.clearAppenders();
	    firstLog4js.addAppender(function(evt) { logEvent = evt; });

	    secondLog4js = require('../lib/log4js');
	    secondLog4js.getLogger().info("This should go to the appender defined in firstLog4js");

	    assert.equal(logEvent.data[0], "This should go to the appender defined in firstLog4js");
	}
    }

}).export(module);
