'use strict';

var async = require('async')
, should = require('should')
, fs = require('fs')
, path = require('path')
, assert = require('assert');

function remove() {
  var files = Array.prototype.slice.call(arguments);
  return function(done) {
    async.forEach(
      files.map(function(file) { return path.join(__dirname, file); }),
      fs.unlink.bind(fs),
      function() { done(); }
    );
  };
}

describe('log4js', function() {

  before(
    remove(
      'test-category-filter-web.log', 
      'test-category-filter-all.log'
    )
  );

  after(
    remove(
      'test-category-filter-web.log',
      'test-category-filter-all.log'
    )
  );

  describe('category filtering', function() {
    before(function() {
      var log4js = require('../lib/log4js')
      , webLogger = log4js.getLogger("web")
      , appLogger = log4js.getLogger("app");
      
      log4js.configure({
        appenders: {
          rest: { 
            type: "file", 
            layout: { type: "messagePassThrough" },
            filename: path.join(__dirname, "test-category-filter-all.log") 
          },
          web: { 
            type: "file", 
            layout: { type: "messagePassThrough"}, 
            filename: path.join(__dirname, "test-category-filter-web.log") 
          }
        },
        categories: {
          "default": { level: "debug", appenders: [ "rest" ] },
          web: { level: "debug", appenders: [ "web" ] }
        }
      });
      
      webLogger.debug('This should get logged');
      appLogger.debug('This should not');
      webLogger.debug('Hello again');
      log4js.getLogger('db').debug('This shouldn\'t be included by the appender anyway');
    });

    it('should only pass matching category', function(done) {
      setTimeout(function() {
        fs.readFile(
          path.join(__dirname, 'test-category-filter-web.log'), 
          'utf8', 
          function(err, contents) {
            var lines = contents.trim().split('\n');
            lines.should.eql(["This should get logged", "Hello again"]);
            done(err);
          }
        );
      }, 50);
    });
    
    it('should send everything else to default appender', function(done) {
      setTimeout(function() {
        fs.readFile(
          path.join(__dirname, 'test-category-filter-all.log'), 
          'utf8', 
          function(err, contents) {
            var lines = contents.trim().split('\n');
            lines.should.eql([
              "This should not", 
              "This shouldn't be included by the appender anyway"
            ]);
            done(err);
          }
        );
      }, 50);
    });    

  });
});
