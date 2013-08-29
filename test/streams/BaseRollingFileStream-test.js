"use strict";
var should = require('should')
, fs = require('fs')
, sandbox = require('sandboxed-module');

describe('../../lib/streams/BaseRollingFileStream', function() {
  describe('when node version < 0.10.0', function() {
    it('should use readable-stream to maintain compatibility', function() {
    
      var streamLib = sandbox.load(
        '../../lib/streams/BaseRollingFileStream',
        {
          globals: {
            process: {
              version: '0.8.11'
            }
          },
          requires: {
            'readable-stream': {
              Writable: function() {}
            }
          }
        }
      );

      streamLib.required.should.have.property('readable-stream');
      streamLib.required.should.not.have.property('stream');
    });
  });

  describe('when node version > 0.10.0', function() {
    it('should use the core stream module', function() {
      var streamLib = sandbox.load(
        '../../lib/streams/BaseRollingFileStream',
        {
          globals: {
            process: {
              version: '0.10.1'
            }
          },
          requires: {
            'stream': {
              Writable: function() {}
            }
          }
        }
      );

      streamLib.required.should.have.property('stream');
      streamLib.required.should.not.have.property('readable-stream');
    });
  });

  describe('when no filename is passed', function() {
    it('should throw an error', function() {
      var BaseRollingFileStream = require('../../lib/streams/BaseRollingFileStream');
      (function() {
        new BaseRollingFileStream();
      }).should.throw();
    });
  });

  describe('default behaviour', function() {
    var stream;

    before(function() {
      var BaseRollingFileStream = require('../../lib/streams/BaseRollingFileStream');
      stream = new BaseRollingFileStream('basetest.log');
    });

    after(function(done) {
      fs.unlink('basetest.log', done);
    });

    it('should not want to roll', function() {
      stream.shouldRoll().should.eql(false);
    });

    it('should not roll', function() {
      var cbCalled = false;
      //just calls the callback straight away, no async calls
      stream.roll('basetest.log', function() { cbCalled = true; });
      cbCalled.should.eql(true);
    });
  });
});
