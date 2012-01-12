var vows = require('vows')
, log4js = require('../lib/log4js')
, assert = require('assert')
, util = require('util')
, dgram = require("dgram");

log4js.configure({ "appenders": [{"type": "gelf"}] }, undefined);

vows.describe('log4js gelfAppender').addBatch({

    'with default gelfAppender settings': {
        topic: function() {
            var logger = log4js.getLogger();

            //Start local dgram server to act as GELF server
            var server = dgram.createSocket("udp4");
            //Assert as soon as message arrives
            server.on("message", this.callback);
            //Send a fake message as soon as server is ready
            server.on("listening", function () {
              logger.info("This should be a packet of size 161 bytes at the server");
            });

            //Listen on default values
            server.bind(12201, 'localhost');
        },
        'should receive log messages at the local gelf server': function(err, packet) {
            assert.ok(packet.size > 0, "Recevied blank message");
        }
    }
}).export(module);