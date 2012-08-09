var vows = require('vows')
, fs = require('fs')
, path = require('path')
, log4js = require('../lib/log4js')
, assert = require('assert');

log4js.clearAppenders();

function remove(filename) {
    try {
        fs.unlinkSync(filename);
    } catch (e) {
        //doesn't really matter if it failed
    }
}

vows.describe('log4js fileAppender').addBatch({
    'adding multiple fileAppenders': {
      topic: function () {
          var listenersCount = process.listeners('exit').length
            , logger = log4js.getLogger('default-settings')
            , count = 5, logfile;

          while (count--) {
              logfile = path.join(__dirname, '/fa-default-test' + count + '.log');
              log4js.addAppender(require('../lib/appenders/file').appender(logfile), 'default-settings');
          }

          return listenersCount;
      },

      'does not adds more than one `exit` listeners': function (initialCount) {
          assert.ok(process.listeners('exit').length <= initialCount + 1);
      }
    },

    'with default fileAppender settings': {
        topic: function() {
            var that = this
          , testFile = path.join(__dirname, '/fa-default-test.log')
          , logger = log4js.getLogger('default-settings');
            remove(testFile);
            //log4js.configure({ appenders:[ { type: "file", filename: testFile, category: 'default-settings' } ] });
            log4js.clearAppenders();
            log4js.addAppender(require('../lib/appenders/file').appender(testFile), 'default-settings');

            logger.info("This should be in the file.");

            setTimeout(function() {
                fs.readFile(testFile, "utf8", that.callback);
            }, 100);
        },
        'should write log messages to the file': function(err, fileContents) {
            assert.include(fileContents, "This should be in the file.\n");
        },
        'log messages should be in the basic layout format': function(err, fileContents) {
            assert.match(fileContents, /\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] default-settings - /);
        }
    },
    'with a max file size and no backups': {
        topic: function() {
            var testFile = path.join(__dirname, '/fa-maxFileSize-test.log')
          , logger = log4js.getLogger('max-file-size')
          , that = this;
            remove(testFile);
            remove(testFile + '.1');
            //log file of 100 bytes maximum, no backups
            log4js.clearAppenders();
            log4js.addAppender(require('../lib/appenders/file').appender(testFile, log4js.layouts.basicLayout, 100, 0), 'max-file-size');
            logger.info("This is the first log message.");
            logger.info("This is an intermediate log message.");
            logger.info("This is the second log message.");
            //wait for the file system to catch up
            setTimeout(function() {
                fs.readFile(testFile, "utf8", that.callback);
            }, 100);
        },
        'log file should only contain the second message': function(err, fileContents) {
            assert.include(fileContents, "This is the second log message.\n");
            assert.equal(fileContents.indexOf("This is the first log message."), -1);
        },
        'the number of files': {
            topic: function() {
                fs.readdir(__dirname, this.callback);
            },
            'starting with the test file name should be two': function(err, files) {
                //there will always be one backup if you've specified a max log size
                var logFiles = files.filter(function(file) { return file.indexOf('fa-maxFileSize-test.log') > -1; });
                assert.equal(logFiles.length, 2);
            }
        }
    },
    'with a max file size and 2 backups': {
        topic: function() {
            var testFile = path.join(__dirname, '/fa-maxFileSize-with-backups-test.log')
          , logger = log4js.getLogger('max-file-size-backups');
            remove(testFile);
            remove(testFile+'.1');
            remove(testFile+'.2');

            //log file of 50 bytes maximum, 2 backups
            log4js.clearAppenders();
            log4js.addAppender(require('../lib/appenders/file').appender(testFile, log4js.layouts.basicLayout, 50, 2), 'max-file-size-backups');
            logger.info("This is the first log message.");
            logger.info("This is the second log message.");
            logger.info("This is the third log message.");
            logger.info("This is the fourth log message.");
            var that = this;
            //give the system a chance to open the stream
            setTimeout(function() {
                fs.readdir(__dirname, that.callback);
            }, 200);
        },
        'the log files': {
            topic: function(files) {
                var logFiles = files.filter(function(file) { return file.indexOf('fa-maxFileSize-with-backups-test.log') > -1; });
                return logFiles;
            },
            'should be 3': function (files) {
                assert.equal(files.length, 3);
            },
            'should be named in sequence': function (files) {
                assert.deepEqual(files.sort(), ['fa-maxFileSize-with-backups-test.log', 'fa-maxFileSize-with-backups-test.log.1', 'fa-maxFileSize-with-backups-test.log.2']);
            },
            'and the contents of the first file': {
                topic: function(logFiles) {
                    fs.readFile(path.join(__dirname, logFiles[0]), "utf8", this.callback);
                },
                'should be empty because the last log message triggers rolling': function(contents) {
                    assert.isEmpty(contents);
                }
            },
            'and the contents of the second file': {
                topic: function(logFiles) {
                    fs.readFile(path.join(__dirname, logFiles[1]), "utf8", this.callback);
                },
                'should be the last log message': function(contents) {
                    assert.include(contents, 'This is the fourth log message.');
                }
            },
            'and the contents of the third file': {
                topic: function(logFiles) {
                    fs.readFile(path.join(__dirname, logFiles[2]), "utf8", this.callback);
                },
                'should be the third log message': function(contents) {
                    assert.include(contents, 'This is the third log message.');
                }
            }
        }
    }
}).addBatch({
    'configure' : {
        'with fileAppender': {
	    topic: function() {
	        var log4js = require('../lib/log4js')
              , logger;
	        //this config file defines one file appender (to ./tmp-tests.log)
	        //and sets the log level for "tests" to WARN
                log4js.configure('test/log4js.json');
                logger = log4js.getLogger('tests');
	        logger.info('this should not be written to the file');
	        logger.warn('this should be written to the file');

                fs.readFile('tmp-tests.log', 'utf8', this.callback);
	    },
	    'should load appender configuration from a json file': function(err, contents) {
	        assert.include(contents, 'this should be written to the file\n');
                assert.equal(contents.indexOf('this should not be written to the file'), -1);
	    }
        }
    }

}).export(module);
