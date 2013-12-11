"use strict";
var vows = require('vows')
  , assert = require('assert')
  , log4js = require('../lib/log4js')
  , sandbox = require('sandboxed-module')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  ;

function setupLogging(category, options) {

  function FakeAmqp() {
    var self = this;
    EventEmitter.call(self);

    self.messages = [];
    self.setupCb = function() {};

    self.exchangeObj = {
      publish: function (routingKey, msg, options) {
        self.messages.push(msg);
      }
    };
  }

  util.inherits(FakeAmqp, EventEmitter); 

  FakeAmqp.prototype.connect = function () {
    var self = this;
    process.nextTick(function () {
      self.emit("ready", {});
    });
  };

  FakeAmqp.prototype.exchange = function () {
    var self = this;

    var cb = Array.prototype.slice.call(arguments).pop();
    cb(self.exchangeObj);

    process.nextTick(function() {
      self.setupCb();
    });
  };

  var fakeAmqp = new FakeAmqp();
  var fakeAmqpFactory = {
    createConnection: function () {
      fakeAmqp.connect();
      return fakeAmqp;
    }
  };

  var fakeConsole = {
    errors: [],
    error: function (msg, value) {
      this.errors.push({ msg: msg, value: value });
    }
  };

  var amqpModule = sandbox.require('../lib/appenders/amqp', {
    requires: {
      'amqp': fakeAmqpFactory
    },
    globals: {
      console: fakeConsole
    }
  });

  log4js.addAppender(amqpModule.configure(options), category);

  return {
    logger: log4js.getLogger(category),
    amqp: fakeAmqp,
    console: fakeConsole
  };
}

log4js.clearAppenders();

//process.on('uncaughtException', function(err) {
//  console.log('Caught exception: ' + err);
//});

vows.describe('log4js amqpAppender').addBatch({
  'minimal config, log item written before amqp setup': {
    topic: function () {
      var setup = setupLogging('minimal config, log item written before amqp setup', {});
      setup.logger.info('Log event #1');
      this.callback(null, setup);
    },
    'there should be one message only': function (result) {
      assert.equal(result.amqp.messages.length, 1);
    },
    'message should contain proper data': function (result) {
      assert.equal(result.amqp.messages[0], 'Log event #1');
    }
  },
  'minimal config, log item written after amqp setup': {
    topic: function () {
      var self = this;
      var setup = setupLogging('minimal config, log item written after amqp setup', {});
      setup.amqp.setupCb = function() {
        setup.logger.info('Log event #1');
        self.callback(null, setup);
      };
    },
    'there should be one message only': function (result) {
      assert.equal(result.amqp.messages.length, 1);
    },
    'message should contain proper data': function (result) {
      assert.equal(result.amqp.messages[0], 'Log event #1');
    }
  },
  'fancy config, log item written after amqp setup': {
    topic: function () {
      var self = this;
      var setup = setupLogging('fancy config, log item written after amqp setup', {
        connection: {
          url: "amqp://username:password@aTestEndpoint:5672"
        },
        exchange: {
          name: 'aTestExchange'
        }
      });
      setup.amqp.setupCb = function() {
        setup.logger.info('Log event #1');
        self.callback(null, setup);
      };
    },
    'there should be one message only': function (result) {
      assert.equal(result.amqp.messages.length, 1);
    },
    'message should contain proper data': function (result) {
      assert.equal(result.amqp.messages[0], 'Log event #1');
    }
  },
  'separate queue message for each event': {
    topic: function () {
      var self = this;
      var setup = setupLogging('separate message for each event', {});
      setup.amqp.setupCb = function() {
        setTimeout(function () {
          setup.logger.info('Log event #1');
        }, 0);
        setTimeout(function () {
          setup.logger.info('Log event #2');
        }, 100);
        setTimeout(function () {
          setup.logger.info('Log event #3');
        }, 200);
        setTimeout(function () {
          self.callback(null, setup);
        }, 300);
      };
    },
    'there should be three messages': function (result) {
      assert.equal(result.amqp.messages.length, 3);
    },
    'messages should contain proper data': function (result) {
      assert.equal(result.amqp.messages[0], 'Log event #1');
      assert.equal(result.amqp.messages[1], 'Log event #2');
      assert.equal(result.amqp.messages[2], 'Log event #3');
    }
  }

}).export(module);
