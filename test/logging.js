var vows = require('vows'), 
assert = require('assert');

vows.describe('log4js').addBatch({
    'getLogger': {
	topic: function() {
	    var log4js = require('../lib/log4js')();
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
		return events;
	    },

	    'should emit log events': function(events) {
		assert.equal(events[0].level.toString(), 'DEBUG');
		assert.equal(events[0].message, 'Debug event');
		assert.instanceOf(events[0].startTime, Date);
	    },

	    'should not emit events of a lower level': function(events) {
		assert.length(events, 2);
		assert.equal(events[1].level.toString(), 'WARN');
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
		}
	    },
	    log4js = require('../lib/log4js')(fakeFS);
	    log4js.clearAppenders();
	    
	    appender = log4js.fileAppender('./tmp-tests.log', log4js.messagePassThroughLayout);
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
		}
	    },
	    log4js = require('../lib/log4js')(fakeFS);
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
	}
    }
	    
}).export(module);
