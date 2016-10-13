"use strict";
var fs = require('fs')
, path = require('path')
, sandbox = require('sandboxed-module')
, log4js = require('../lib/log4js')
, assert = require('assert')
, EOL = require('os').EOL || '\n';

function remove(filename) {
  try {
    fs.unlinkSync(filename);
  } catch (e) {
    //doesn't really matter if it failed
  }
}

describe('log4js fileSyncAppender', function() {
  describe('with default fileSyncAppender settings', function() {
    var that = this
    , testFile = path.join(__dirname, '/fa-default-sync-test.log')
    , logger = log4js.getLogger('default-settings');

    before(function() {

      log4js.configure({
        appenders: {
          "testFile": { type: "fileSync", filename: testFile }
        },
        categories: {
          "default-settings": { appender: "testFile" }
        }
      });
      logger.info("This should be in the file.");
    });

    after(function() {
      remove(testFile);
    });

    it('should write messages to the file', function(done) {
      fs.readFile(testFile, "utf8", function(err, contents) {
        assert.include(contents, "This should be in the file." + EOL);
        done(err);
      });
    });

    it('log messages should be in the basic layout format', function(done) {
      fs.readFile(testFile, "utf8", function(err, fileContents) {
        assert.match(
          fileContents,
            /\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO\] default-settings - /
        );
        done(err);
      });
    });
  });

  describe('with a max file size and no backups', function() {
    var testFile = path.join(__dirname, '/fa-maxFileSize-sync-test.log')
    , logger = log4js.getLogger('max-file-size');

    before(function() {

      //log file of 100 bytes maximum, no backups
      log4js.configure({
        appenders: {
          "testFile": { type: "fileSync", filename: testFile, maxLogSize: 100, backups: 0 }
        },
        categories: {
          "max-file-size": { appender: "testFile" }
        }
      });
      logger.info("This is the first log message.");
      logger.info("This is an intermediate log message.");
      logger.info("This is the second log message.");
    });

    after(function() {
      remove(testFile);
      remove(testFile + '.1');
    });

    it('log file should only contain the second message', function(done) {
      fs.readFile(testFile, "utf8", function (err, fileContents) {
        assert.include(fileContents, "This is the second log message." + EOL);
        assert.equal(fileContents.indexOf("This is the first log message."), -1);
        done(err);
      });
    });

    describe('the number of files', function() {
      it('starting with the test file name should be two', function(done) {
        fs.readdir(__dirname, function(err, files) {
          //there will always be one backup if you've specified a max log size
          var logFiles = files.filter(
            function(file) { return file.indexOf('fa-maxFileSize-sync-test.log') > -1; }
          );
          assert.equal(logFiles.length, 2);
          done(err);
        });
      });
    });
  });

  describe('with a max file size and 2 backups', function() {
    var testFile = path.join(__dirname, '/fa-maxFileSize-with-backups-sync-test.log')
    , logger = log4js.getLogger('max-file-size-backups');

    before(function() {
      //log file of 50 bytes maximum, 2 backups
      log4js.configure({
        appenders: {
          "testFile": { type: "fileSync", filename: testFile, maxLogSize: 50, backups: 2 }
        },
        categories: {
          'max-file-size-backups': { appender: "testFile" }
        }
      });
      logger.info("This is the first log message.");
      logger.info("This is the second log message.");
      logger.info("This is the third log message.");
      logger.info("This is the fourth log message.");
    });

    after(function() {
      remove(testFile);
      remove(testFile+'.1');
      remove(testFile+'.2');
    });

    it('should produce 3 files, named in sequence', function(done) {
      fs.readdir(__dirname, function(err, files) {
        if (files) {
          var testFiles = files
                            .sort()
                            .filter(function(f) {
                              return f.contains('fa-maxFileSize-with-backups-sync-test.log'); }
                            );
          testFiles.length.should.equal(3);
          assert.deepEqual(testFiles, [
            'fa-maxFileSize-with-backups-sync-test.log',
            'fa-maxFileSize-with-backups-sync-test.log.1',
            'fa-maxFileSize-with-backups-sync-test.log.2'
          ]);
          assert.include(
            fs.readFileSync(path.join(__dirname, testFiles[0]), "utf8"),
            "This is the fourth log message"
          );
          assert.include(
            fs.readFileSync(path.join(__dirname, testFiles[1]), "utf8"),
            "This is the third log message"
          );
          assert.include(
            fs.readFileSync(path.join(__dirname, testFiles[2]), "utf8"),
            "This is the second log message"
          );
          done();
        } else {
          done(err, files);
        }
      });

    });
  });

  describe('configuration', function() {
    before(function() {
      var log4js = require('../lib/log4js')
      , logger;
      //this config defines one file appender (to ./tmp-sync-tests.log)
      //and sets the log level for "tests" to WARN
      log4js.configure({
          appenders: [{
              category: "tests",
              type: "file",
              filename: "tmp-sync-tests.log",
              layout: { type: "messagePassThrough" }
          }],

          levels: { tests:  "WARN" }
      });
      logger = log4js.getLogger('tests');
      logger.info('this should not be written to the file');
      logger.warn('this should be written to the file');
    });

    it('should load appender configuration from a json file', function(done) {
      fs.readFile('tmp-sync-tests.log', 'utf8', function(err, contents) {
        assert.include(contents, 'this should be written to the file' + EOL);
        assert.equal(contents.indexOf('this should not be written to the file'), -1);
        done(err);
      });
    });

  });
});
