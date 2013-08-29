"use strict";
/*jshint expr:true */
var should = require('should') 
, async = require('async')
, path = require('path')
, fs = require('fs')
, sandbox = require('sandboxed-module');

function remove(filename, cb) {
  fs.unlink(path.join(__dirname, filename), function(err) {
    cb();
  });
}

describe('../lib/appenders/dateFile', function() {
  describe('adding multiple dateFileAppenders', function() {
    var files = [], initialListeners;

    before(function() {
      var dateFileAppender = require('../lib/appenders/dateFile'),
      count = 5,
      logfile;

      initialListeners = process.listeners('exit').length;
      
      while (count--) {
        logfile = path.join(__dirname, 'datefa-default-test' + count + '.log');
        dateFileAppender.configure({
          filename: logfile
        });
        files.push(logfile);
      }
    });

    after(function(done) {
      async.forEach(files, remove, done);
    });
      
    it('should only add one `exit` listener', function () {
      process.listeners('exit').length.should.be.below(initialListeners + 2);
    });

  });

  describe('exit listener', function() {
    var openedFiles = [];

    before(function() {
      var exitListener
      , dateFileAppender = sandbox.require(
        '../lib/appenders/dateFile',
        {
          globals: {
            process: {
              on: function(evt, listener) {
                exitListener = listener;
              }
            }
          },
          requires: {
            '../streams': {
              DateRollingFileStream: function(filename) {
                openedFiles.push(filename);
                
                this.end = function() {
                  openedFiles.shift();
                };
              }
            }
          }   
        }
      );

      for (var i=0; i < 5; i += 1) {
        dateFileAppender.configure({
          filename: 'test' + i
        });
      }

      openedFiles.should.not.be.empty;
      exitListener();
    });

    it('should close all open files', function() {
      openedFiles.should.be.empty;
    });
  });

  describe('with default settings', function() {
    var contents;

    before(function(done) {
      var testFile = path.join(__dirname, 'date-appender-default.log'),
      log4js = require('../lib/log4js'),
      logger = log4js.getLogger('default-settings');
      
      log4js.configure({
        appenders: { 
          "date": { type: "dateFile", filename: testFile }
        },
        categories: {
          default: { level: "debug", appenders: [ "date" ] }
        }
      });
        
      logger.info("This should be in the file.");
        
      setTimeout(function() {
        fs.readFile(testFile, "utf8", function(err, data) {
          contents = data;
          done(err);
        });
      }, 100);
        
    });

    after(function(done) {
      remove('date-appender-default.log', done);
    });
      
    it('should write to the file', function() {
      contents.should.include('This should be in the file');
    });
      
    it('should use the basic layout', function() {
      contents.should.match(
          /\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] default-settings - /
      );
    });
  });

  describe('configure', function() {
    describe('with dateFileAppender', function() {
      var contents;

      before(function(done) {
        var log4js = require('../lib/log4js')
        , logger = log4js.getLogger('tests');

        //this config file defines one file appender (to ./date-file-test.log)
        //and sets the log level for "tests" to WARN
        log4js.configure('test/with-dateFile.json');
        logger.info('this should not be written to the file');
        logger.warn('this should be written to the file');
        
        fs.readFile(path.join(__dirname, 'date-file-test.log'), 'utf8', function(err, data) {
          contents = data;
          done(err);
        });
      });

      after(function(done) {
        remove('date-file-test.log', done);
      });
      
      it('should load appender configuration from a json file', function() {
        contents.should.include('this should be written to the file' + require('os').EOL);
        contents.should.not.include('this should not be written to the file');
      });
    });

    describe('with options.alwaysIncludePattern', function() {
      var contents, thisTime;
      
      before(function(done) {
        var log4js = require('../lib/log4js')
        , format = require('../lib/date_format')
        , logger
        , options = {
          "appenders": {
            "datefile": {
              "type": "dateFile", 
              "filename": "test/date-file-test",
              "pattern": "-from-MM-dd.log",
              "alwaysIncludePattern": true,
              "layout": { 
                "type": "messagePassThrough" 
              }
            }
          },
          categories: { default: { level: "debug", appenders: [ "datefile" ] } }
        };
        thisTime = format.asString(options.appenders.datefile.pattern, new Date());

        fs.writeFile(
          path.join(__dirname, 'date-file-test' + thisTime), 
          "this is existing data" + require('os').EOL, 
          'utf8',
          function(err) {
            log4js.configure(options);
            logger = log4js.getLogger('tests');
            logger.warn('this should be written to the file with the appended date');
            //wait for filesystem to catch up
            setTimeout(function() {
              fs.readFile(
                path.join(__dirname, 'date-file-test' + thisTime), 
                'utf8', 
                function(err, data) {
                  contents = data;
                  done(err);
                }
              );
            }, 200);
          }
        );
      });

      after(function(done) {
        remove('date-file-test' + thisTime, done);
      });

      it('should create file with the correct pattern', function() {
        contents.should.include('this should be written to the file with the appended date');
      });

      it('should not overwrite the file on open (bug found in issue #132)', function() {
        contents.should.include('this is existing data');
      });
    });
  });
});
