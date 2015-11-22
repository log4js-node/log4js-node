/* jshint maxparams:7 */
"use strict";
var vows    = require('vows');
var assert  = require('assert');
var util    = require('util');
var levels  = require('../lib/levels');
var http    = require('http');
var Hapi    = require('hapi');

//Create a server
var server = new Hapi.Server();
server.connection({ port: 3000 });

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
      reply('Hello, world!');
  }
});

function MockLogger() {

  var that = this;
  this.messages = [];

  this.log = function(level, message, exception) {
    that.messages.push({ level: level, message: message });
  };

  this.isLevelEnabled = function(level) {
    return level.isGreaterThanOrEqualTo(that.level);
  };

  this.level = levels.TRACE;

}

var ml = new MockLogger();
function registerPlugin(obj, cb){
  server.register({
    register: require('../lib/hapi-logger'), 
    options: obj
  }, function(err){
    return cb(err, true);
  });
}

function startServer(cb){
  server.start(function(err){
    if(err){
      return cb(err);
    }

    http.get(server.info.uri, function(res){
      var msg = ml.messages;
      return cb(null, msg);
    })
    .on('error', function(err){      
      return cb(err);
    });
  });
}

vows.describe('log4js hapi logger').addBatch({
  'register hapi logger': {
    topic: function() {
      var hapiLogger = require('../lib/hapi-logger');
      return hapiLogger;
    },

    'should return a "hapi logger" factory' : function(hapiLogger) {
      assert.isObject(hapiLogger);
    },

    'register logger on hapi server' : {
      topic: function() {
        var cb = this.callback;
        registerPlugin({logger4js: ml, level: 'auto'}, cb);
      },

      'should return true if the plugin is already registered': function(err, registered) {
        assert.isNull(err);
        assert.ok(registered);
      }
    },

    'log events' : {
      topic: function() {
        var cb = this.callback;
        startServer(cb);
      },

      'check message': function(err, messages) {        
        assert.isNull(err);
        assert.isArray(messages);
        assert.equal(messages.length, 1);
        assert.ok(levels.INFO.isEqualTo(messages[0].level));
        assert.include(messages[0].message, 'get');
        assert.include(messages[0].message, '127.0.0.1');
        assert.include(messages[0].message, '200');
      }
    }
  }
}).export(module);
