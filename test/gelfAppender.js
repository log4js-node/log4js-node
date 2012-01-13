var vows = require('vows')
, log4js = require('../lib/log4js')
, assert = require('assert')
, dgram = require("dgram");

var fakeClient = {
  packetLength: 0,
  close: function() {
  },
  send: function(pkt, offset, pktLength, port, host) {
    this.packetLength = pktLength;
  } 
};

log4js.configure({ "appenders": [{"type": "gelf", "client": fakeClient}] }, undefined);

vows.describe('log4js gelfAppender').addBatch({

    'with default gelfAppender settings': {
        topic: function() {
            var logger = log4js.getLogger();
            var self = this;
            logger.info('Fake log message');
            callback();
        },
        'should receive log messages at the local gelf server': function(err, packet) {
            assert.ok(fakeClient.packetLength > 0, "Recevied blank message");
        }
    }
}).export(module);