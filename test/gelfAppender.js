var vows = require('vows')
, assert = require('assert')
, sandbox = require('sandboxed-module')
, fakeDgram = {
    socket: {
        packetLength: 0,
        close: function() {
        },
        send: function(pkt, offset, pktLength, port, host) {
            this.packet = pkt;
            this.offset = offset;
            this.packetLength = pktLength;
            this.port = port;
            this.host = host;
        }
    },
    createSocket: function(type) {
        this.type = type;
        return this.socket;
    }
}
, fakeCompressBuffer = {
    compress: function(objectToCompress) {
        this.uncompressed = objectToCompress;
        return "I've been compressed";
    }
}
, appender = sandbox.require('../lib/appenders/gelf', {
    requires: {
        dgram: fakeDgram,
        "compress-buffer": fakeCompressBuffer
    }
})
, log4js = require('../lib/log4js');

log4js.clearAppenders();
log4js.addAppender(appender.configure({}), "gelf-test");

vows.describe('log4js gelfAppender').addBatch({

    'with default gelfAppender settings': {
        topic: function() {
            log4js.getLogger("gelf-test").info("This is a test");
            return fakeDgram;
        },
        'should send log messages via udp to the localhost gelf server': function(dgram) {
            assert.equal(dgram.type, "udp4");
            assert.equal(dgram.socket.host, "localhost");
            assert.equal(dgram.socket.port, 12201);
            assert.equal(dgram.socket.offset, 0);
            assert.ok(dgram.socket.packetLength > 0, "Received blank message");
        },
        'should compress the log message': function(dgram) {
            assert.equal(dgram.socket.packet, "I've been compressed");
        }
    }
}).export(module);