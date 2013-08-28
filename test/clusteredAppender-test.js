"use strict";
var should = require('should')
, sandbox = require('sandboxed-module');


describe('log4js in a cluster', function() {
  describe('when in master mode', function() {

    var log4js
    , clusterOnFork = false
    , workerCb 
    , events = []
    , worker = {
      on: function(evt, cb) {
        evt.should.eql('message');
        this.cb = cb;
      }
    };

    before(function() {
      log4js = sandbox.require(
        '../lib/log4js',
        {
          requires: {
            'cluster': {
              isMaster: true,
              on: function(evt, cb) {
                evt.should.eql('fork');
                clusterOnFork = true;
                cb(worker);
              }
            },
            './appenders/console': {
              configure: function() {
                return function(event) {
                  events.push(event);
                };
              }
            }
          }
        }
      );
    });

    it('should listen for fork events', function() {
      clusterOnFork.should.be.true;
    });

    it('should listen for messages from workers', function() {
      //workerCb was created in a different context to the test
      //(thanks to sandbox.require), so doesn't pick up the should prototype
      (typeof worker.cb).should.eql('function');
    });

    it('should log valid ::log4js-message events', function() {
      worker.cb({ 
        type: '::log4js-message', 
        event: JSON.stringify({ 
          startTime: '2010-10-10 18:54:06', 
          category: 'cheese', 
          level: { levelStr: 'DEBUG' }, 
          data: [ "blah" ] 
        })
      });
      events.should.have.length(1);
      events[0].data[0].should.eql("blah");
      events[0].category.should.eql('cheese');
      //startTime was created in a different context to the test
      //(thanks to sandbox.require), so instanceof doesn't think
      //it's a Date.
      events[0].startTime.constructor.name.should.eql('Date');
      events[0].level.toString().should.eql('DEBUG');
    });

    it('should handle invalid ::log4js-message events', function() {
      worker.cb({
        type: '::log4js-message',
        event: "biscuits"
      });
      worker.cb({
        type: '::log4js-message',
        event: JSON.stringify({
          startTime: 'whatever'
        })
      });

      events.should.have.length(3);
      events[1].data[0].should.eql('Unable to parse log:');
      events[1].data[1].should.eql('biscuits');
      events[1].category.should.eql('log4js');
      events[1].level.toString().should.eql('ERROR');

      events[2].data[0].should.eql('Unable to parse log:');
      events[2].data[1].should.eql(JSON.stringify({ startTime: 'whatever'}));

    });

    it('should ignore other events', function() {
      worker.cb({
        type: "::blah-blah",
        event: "blah"
      });

      events.should.have.length(3);
    });

  });

  describe('when in worker mode', function() {
    var log4js, events = [];

    before(function() {
      log4js = sandbox.require(
        '../lib/log4js',
        {
          requires: {
            'cluster': {
              isMaster: false,
              on: function() {}
            }
          },
          globals: {
            'process': {
              'send': function(event) {
                events.push(event);
              },
              'env': {
              }
            }
          }
        }
      );
      log4js.getLogger('test').debug("just testing");
    });
    
    it('should emit ::log4js-message events', function() {
      events.should.have.length(1);
      events[0].type.should.eql('::log4js-message');
      events[0].event.should.be.a('string');
      
      var evt = JSON.parse(events[0].event);
      evt.category.should.eql('test');
      evt.level.levelStr.should.eql('DEBUG');
      evt.data[0].should.eql('just testing');
    });
  });
});
