"use strict";
var should = require('should')
, Logger = require('../lib/logger');

describe('../lib/logger', function() {
  describe('Logger constructor', function() {
    it('must be passed a dispatch delegate and a category', function() {
      (function() { new Logger(); }).should.throw(
        "Logger must have a dispatch delegate."
      );
      (function() { new Logger(function() {}); }).should.throw(
        "Logger must have a category."
      );
    });

  });

  describe('Logger instance', function() {
    var event
    , logger = new Logger(
      function(evt) { event = evt; },
      "exciting category"
    );

    beforeEach(function() {
      event = null;
    });

    it('should be immutable', function() {
      logger.category = "rubbish";
      logger.debug("thing");

      event.category.should.equal("exciting category");
    });

    ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(function(level) {
      it('should have a ' + level + ' function', function() {
        logger[level].should.be.a('function');
      });
    });

    it('should send log events to the dispatch delegate', function() {
      logger.debug("interesting thing");
      event.should.have.property('category').equal('exciting category');
      event.should.have.property('level').equal('debug');
      event.should.have.property('data').eql(["interesting thing"]);
      event.should.have.property('startTime');
    });
  });
  
});

