var vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    log4js = require('../lib/log4js');

function removeFile(filename) {
    return function() {
        fs.unlink(path.join(__dirname, filename), function(err) {
            if (err) {
                console.log("Could not delete ", filename, err);
            }
        });
    };
}

vows.describe('../lib/appenders/dateFile').addBatch({
    'appender': {
        'adding multiple dateFileAppenders': {
            topic: function () {
                var listenersCount = process.listeners('exit').length,
                    dateFileAppender = require('../lib/appenders/dateFile'),
                    count = 5,
                    logfile;

                while (count--) {
                    logfile = path.join(__dirname, 'datefa-default-test' + count + '.log');
                    log4js.addAppender(dateFileAppender.appender(logfile));
                }

                return listenersCount;
            },
            teardown: function() {
                removeFile('datefa-default-test0.log')();
                removeFile('datefa-default-test1.log')();
                removeFile('datefa-default-test2.log')();
                removeFile('datefa-default-test3.log')();
                removeFile('datefa-default-test4.log')();
            },

            'should only add one `exit` listener': function (initialCount) {
                assert.equal(process.listeners('exit').length, initialCount + 1);
            }
        },

        'with default settings': {
            topic: function() {
                var that = this,
                    testFile = path.join(__dirname, 'date-appender-default.log'),
                    appender = require('../lib/appenders/dateFile').appender(testFile),
                    logger = log4js.getLogger('default-settings');
                log4js.clearAppenders();
                log4js.addAppender(appender, 'default-settings');

                logger.info("This should be in the file.");

                setTimeout(function() {
                    fs.readFile(testFile, "utf8", that.callback);
                }, 100);

            },
            teardown: removeFile('date-appender-default.log'),

            'should write to the file': function(contents) {
                assert.include(contents, 'This should be in the file');
            },

            'should use the basic layout': function(contents) {
                assert.match(contents, /\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] default-settings - /);
            }
        }

    }
}).addBatch({
    'configure': {
        'with dateFileAppender': {
	    topic: function() {
	        var log4js = require('../lib/log4js')
                  , logger;
	        //this config file defines one file appender (to ./date-file-test.log)
	        //and sets the log level for "tests" to WARN
                log4js.configure('test/with-dateFile.json');
                logger = log4js.getLogger('tests');
	        logger.info('this should not be written to the file');
	        logger.warn('this should be written to the file');

                fs.readFile(path.join(__dirname, 'date-file-test.log'), 'utf8', this.callback);
	    },
            teardown: removeFile('date-file-test.log'),

	    'should load appender configuration from a json file': function(err, contents) {
	        assert.include(contents, 'this should be written to the file\n');
                assert.equal(contents.indexOf('this should not be written to the file'), -1);
	    }
        }

    }
}).exportTo(module);
