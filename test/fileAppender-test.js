"use strict";
/*jshint expr:true */
var fs = require('fs')
, async = require('async')
, path = require('path')
, sandbox = require('sandboxed-module')
, log4js = require('../lib/log4js')
, should = require('should');

function remove(filename, cb) {
  fs.unlink(filename, function(err) { cb(); });
}

describe('log4js fileAppender', function() {

  describe('adding multiple fileAppenders', function() {
    var files = [], initialCount, listenersCount; 

    before(function() {
      var logfile
      , count = 5
      , config = { 
        appenders: {}, 
        categories: { default: { level: "debug", appenders: ["file0"] } } 
      };

      initialCount = process.listeners('exit').length;

      while (count--) {
        logfile = path.join(__dirname, '/fa-default-test' + count + '.log');
        config.appenders["file" + count] = { type: "file", filename: logfile };
        files.push(logfile);
      }

      log4js.configure(config);

      listenersCount = process.listeners('exit').length;
    });

    after(function(done) {
      async.forEach(files, remove, done);
    });
    
    it('does not add more than one `exit` listeners', function () {
      listenersCount.should.be.below(initialCount + 2);
    });
  });

  describe('exit listener', function() {
    var openedFiles = [];

    before(function() {
      var exitListener
      , fileAppender = sandbox.require(
        '../lib/appenders/file',
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
              RollingFileStream: function(filename) {
                openedFiles.push(filename);
                
                this.end = function() {
                  openedFiles.shift();
                };

                this.on = function() {};
              }
            }
          }   
        }
      );
      for (var i=0; i < 5; i += 1) {
        fileAppender.appender('test' + i, null, 100);
      }
      openedFiles.should.not.be.empty;
      exitListener();
    });

    it('should close all open files', function() {
      openedFiles.should.be.empty;
    });
  });

  describe('with default fileAppender settings', function() {
    var fileContents
    , testFile = path.join(__dirname, '/fa-default-test.log');

    before(function(done) {
      var logger = log4js.getLogger('default-settings');

      remove(testFile, function() {

        log4js.configure({
          appenders: { 
            "file": { type: "file", filename: testFile }
          },
          categories: {
            "default": { level: "debug", appenders: [ "file" ] }
          }
        });
        
        logger.info("This should be in the file.");
        
        setTimeout(function() {
          fs.readFile(testFile, "utf8", function(err, contents) {
            if (!err) {
              fileContents = contents;
            }
            done(err);
          });
        }, 100);
      });
    });

    after(function(done) {
      remove(testFile, done);
    });

    it('should write log messages to the file', function() {
      fileContents.should.include("This should be in the file.\n");
    });

    it('log messages should be in the basic layout format', function() {
      fileContents.should.match(
          /\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] default-settings - /
      );
    });
  });

  describe('with a max file size and no backups', function() {
    var testFile = path.join(__dirname, '/fa-maxFileSize-test.log');

    before(function(done) {
      var logger = log4js.getLogger('max-file-size');

      async.forEach([
        testFile,
        testFile + '.1'
      ], remove, function() {

        //log file of 100 bytes maximum, no backups
        log4js.configure({
          appenders: {
            "file": { type: "file", filename: testFile, maxLogSize: 100, backups: 0 }
          },
          categories: {
            "default": { level: "debug", appenders: [ "file" ] }
          }
        });
        logger.info("This is the first log message.");
        logger.info("This is an intermediate log message.");
        logger.info("This is the second log message.");
        done();
      });
    });

    after(function(done) {
      async.forEach([ testFile, testFile + '.1' ], remove, done);
    });

    describe('log file', function() {
      it('should only contain the second message', function(done) {
        //wait for the file system to catch up
        setTimeout(function() {
          fs.readFile(testFile, "utf8", function(err, fileContents) {
            fileContents.should.include("This is the second log message.\n");
            fileContents.should.not.include("This is the first log message.");
            done(err);
          });
        }, 100);
      });
    });

    describe('the number of files starting with the test file name', function() {
      it('should be two', function(done) {
        fs.readdir(__dirname, function(err, files) {
          //there will always be one backup if you've specified a max log size
          var logFiles = files.filter(
            function(file) { return file.indexOf('fa-maxFileSize-test.log') > -1; }
          );
          logFiles.should.have.length(2);
          done(err);
        });
      });
    });
  });

  describe('with a max file size and 2 backups', function() {
    var testFile = path.join(__dirname, '/fa-maxFileSize-with-backups-test.log');

    before(function(done) {
      var logger = log4js.getLogger('max-file-size-backups');

      async.forEach([
        testFile,
        testFile+'.1',
        testFile+'.2'
      ], remove, function() {
      
        //log file of 50 bytes maximum, 2 backups
        log4js.configure({
          appenders: {
            "file": { type: "file", filename: testFile, maxLogSize: 50, backups: 2 }
          },
          categories: {
            "default": { level: "debug", appenders: [ "file" ] }
          }
        });
        
        logger.info("This is the first log message.");
        logger.info("This is the second log message.");
        logger.info("This is the third log message.");
        logger.info("This is the fourth log message.");

        done();
      });
    });
    
    describe('the log files', function() {
      var logFiles;
      
      before(function(done) {
        setTimeout(function() {
          fs.readdir(__dirname, function(err, files) { 
            if (files) {
              logFiles = files.sort().filter(
                function(file) { 
                  return file.indexOf('fa-maxFileSize-with-backups-test.log') > -1; 
                }
              );
              done(null);
            } else { 
              done(err); 
            }
          });
        }, 200);
      });

      after(function(done) {
        async.forEach(logFiles, remove, done);
      });

      it('should be 3', function () {
        logFiles.should.have.length(3);
      });

      it('should be named in sequence', function() {
        logFiles.should.eql([
          'fa-maxFileSize-with-backups-test.log', 
          'fa-maxFileSize-with-backups-test.log.1', 
          'fa-maxFileSize-with-backups-test.log.2'
        ]);
      });

      describe('and the contents of the first file', function() {
        it('should be the last log message', function(done) {
          fs.readFile(path.join(__dirname, logFiles[0]), "utf8", function(err, contents) {
            contents.should.include('This is the fourth log message.');
            done(err);
          });
        });
      });

      describe('and the contents of the second file', function() {
        it('should be the third log message', function(done) {
          fs.readFile(path.join(__dirname, logFiles[1]), "utf8", function(err, contents) {
            contents.should.include('This is the third log message.');
            done(err);
          });
        });
      });

      describe('and the contents of the third file', function() {
        it('should be the second log message', function(done) {
          fs.readFile(path.join(__dirname, logFiles[2]), "utf8", function(err, contents) {
            contents.should.include('This is the second log message.');
            done(err);
          });
        });
      });
    });
  });

  describe('when underlying stream errors', function() {
    var consoleArgs;

    before(function() {
      var errorHandler
      , fileAppender = sandbox.require(
        '../lib/appenders/file',
        {
          globals: {
            console: {
              error: function() {
                consoleArgs = Array.prototype.slice.call(arguments);
              }
            }
          },
          requires: {
            '../streams': {
              RollingFileStream: function(filename) {
                
                this.end = function() {};
                this.on = function(evt, cb) {
                  if (evt === 'error') {
                    errorHandler = cb;
                  }
                };
              }
            }
          }   
        }
      );
      fileAppender.configure({
        filename: 'test1.log', 
        maxLogSize: 100
      });
      errorHandler({ error: 'aargh' });
    });
    
    it('should log the error to console.error', function() {
      consoleArgs.should.not.be.empty;
      consoleArgs[0].should.eql('log4js.fileAppender - Writing to file %s, error happened ');
      consoleArgs[1].should.eql('test1.log');
      consoleArgs[2].error.should.eql('aargh');
    });
  });
});
