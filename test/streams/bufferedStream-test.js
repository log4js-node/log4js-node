var vows = require('vows')
, assert = require('assert')
, events = require('events')
, BufferedWriteStream = require('../../lib/streams').BufferedWriteStream;

function FakeStream() {
    this.writes = [];
    this.canWrite = false;
    this.callbacks = {};
}

FakeStream.prototype.on = function(event, callback) {
    this.callbacks[event] = callback;
}

FakeStream.prototype.write = function(data, encoding) {
    assert.equal("utf8", encoding);
    this.writes.push(data);
    return this.canWrite;
}

FakeStream.prototype.emit = function(event, payload) {
    this.callbacks[event](payload);
}

FakeStream.prototype.block = function() {
    this.canWrite = false;
}

FakeStream.prototype.unblock = function() {
    this.canWrite = true;
    this.emit("drain");
}

vows.describe('BufferedWriteStream').addBatch({
    'stream': {
        topic: new BufferedWriteStream(new FakeStream()),
        'should take a stream as an argument and return a stream': function(stream) {
            assert.instanceOf(stream, events.EventEmitter);
        }
    },
    'before stream is open': {
        topic: function() {
            var fakeStream = new FakeStream(),
            stream = new BufferedWriteStream(fakeStream);
            stream.write("Some data", "utf8");
            stream.write("Some more data", "utf8");
            return fakeStream.writes;
        },
        'should buffer writes': function(writes) {
            assert.equal(writes.length, 0);
        }
    },
    'when stream is open': {
        topic: function() {
            var fakeStream = new FakeStream(),
            stream = new BufferedWriteStream(fakeStream);
            stream.write("Some data", "utf8");
            fakeStream.canWrite = true;
            fakeStream.emit("open");
            stream.write("Some more data", "utf8");
            return fakeStream.writes;
        },
        'should write data to stream from before stream was open': function (writes) {
            assert.equal(writes[0], "Some data");
        },
        'should write data to stream from after stream was open': function (writes) {
            assert.equal(writes[1], "Some more data");
        }
    },
    'when stream is blocked': {
        topic: function() {
            var fakeStream = new FakeStream(),
            stream = new BufferedWriteStream(fakeStream);
            fakeStream.emit("open");
            fakeStream.block();
            stream.write("will not know it is blocked until first write", "utf8");
            stream.write("so this one will be buffered, but not the previous one", "utf8");
            return fakeStream.writes;
        },
        'should buffer writes': function (writes) {
            assert.equal(writes.length, 1);
            assert.equal(writes[0], "will not know it is blocked until first write");
        }
    },
    'when stream is unblocked': {
        topic: function() {
            var fakeStream = new FakeStream(),
            stream = new BufferedWriteStream(fakeStream);
            fakeStream.emit("open");
            fakeStream.block();
            stream.write("will not know it is blocked until first write", "utf8");
            stream.write("so this one will be buffered, but not the previous one", "utf8");
            fakeStream.unblock();
            return fakeStream.writes;
        },
        'should send buffered data': function (writes) {
            assert.equal(writes.length, 2);
            assert.equal(writes[1], "so this one will be buffered, but not the previous one");
        }
    },
    'when stream is closed': {
        topic: function() {
            var fakeStream = new FakeStream(),
            stream = new BufferedWriteStream(fakeStream);
            fakeStream.emit("open");
            fakeStream.block();
            stream.write("first write to notice stream is blocked", "utf8");
            stream.write("data while blocked", "utf8");
            stream.end();
            return fakeStream.writes;
        },
        'should send any buffered writes to the stream': function (writes) {
            assert.equal(writes.length, 2);
            assert.equal(writes[1], "data while blocked");
        }
    },
    'when stream errors': {
        topic: function() {
            var fakeStream = new FakeStream(),
            stream = new BufferedWriteStream(fakeStream);
            stream.on("error", this.callback);
            fakeStream.emit("error", "oh noes!");
        },
        'should emit error': function(err, value) {
            assert.equal(err, "oh noes!");
        }
    }

}).exportTo(module);
