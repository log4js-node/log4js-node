var vows = require('vows')
, assert = require('assert')
, events = require('events')
, fs = require('fs')
, RollingFileStream = require('../../lib/streams').RollingFileStream;

function remove(filename) {
    try {
        fs.unlinkSync(filename);
    } catch (e) {
        //doesn't really matter if it failed
    }
}

vows.describe('RollingFileStream').addBatch({
    'arguments': {
        topic: function() {
            remove(__dirname + "/test-rolling-file-stream");
            return new RollingFileStream("test-rolling-file-stream", 1024, 5);
        },
        'should take a filename, file size in bytes, number of backups as arguments and return a FileWriteStream': function(stream) {
            assert.instanceOf(stream, fs.FileWriteStream);
            assert.equal(stream.filename, "test-rolling-file-stream");
            assert.equal(stream.size, 1024);
            assert.equal(stream.backups, 5);
        },
        'with default settings for the underlying stream': function(stream) {
            assert.equal(stream.mode, 420);
            assert.equal(stream.flags, 'a');
            assert.equal(stream.encoding, 'utf8');
        }
    },
    'with stream arguments': {
        topic: function() {
            remove(__dirname + '/test-rolling-file-stream');
            return new RollingFileStream('test-rolling-file-stream', 1024, 5, { mode: 0666 });
        },
        'should pass them to the underlying stream': function(stream) {
            assert.equal(stream.mode, 0666);
        }
    },
    'without size': {
        topic: function() {
            try {
                new RollingFileStream(__dirname + "/test-rolling-file-stream");
            } catch (e) {
                return e;
            }
        },
        'should throw an error': function(err) {
            assert.instanceOf(err, Error);
        }
    },
    'without number of backups': {
        topic: function() {
            remove('test-rolling-file-stream');
            return new RollingFileStream(__dirname + "/test-rolling-file-stream", 1024);
        },
        'should default to 1 backup': function(stream) {
            assert.equal(stream.backups, 1);
        }
    },
    'writing less than the file size': {
        topic: function() {
            remove(__dirname + "/test-rolling-file-stream-write-less");
            var that = this, stream = new RollingFileStream(__dirname + "/test-rolling-file-stream-write-less", 100);
            stream.on("open", function() { that.callback(null, stream); });
        },
        '(when open)': {
            topic: function(stream) {
                stream.write("cheese", "utf8");
                stream.end();
                fs.readFile(__dirname + "/test-rolling-file-stream-write-less", "utf8", this.callback);
            },
            'should write to the file': function(contents) {
                assert.equal(contents, "cheese");
            },
            'the number of files': {
                topic: function() {
                    fs.readdir(__dirname, this.callback);
                },
                'should be one': function(files) {
                    assert.equal(files.filter(function(file) { return file.indexOf('test-rolling-file-stream-write-less') > -1; }).length, 1);
                }
            }
        }
    },
    'writing more than the file size': {
        topic: function() {
            remove(__dirname + "/test-rolling-file-stream-write-more");
            remove(__dirname + "/test-rolling-file-stream-write-more.1");
            var that = this, stream = new RollingFileStream(__dirname + "/test-rolling-file-stream-write-more", 45);
            stream.on("open", function() {
                for (var i=0; i < 7; i++) {
                    stream.write(i +".cheese\n", "utf8");
                }
                //wait for the file system to catch up with us
                setTimeout(that.callback, 100);
            });
        },
        'the number of files': {
            topic: function() {
                fs.readdir(__dirname, this.callback);
            },
            'should be two': function(files) {
                assert.equal(files.filter(function(file) { return file.indexOf('test-rolling-file-stream-write-more') > -1; }).length, 2);
            }
        },
        'the first file': {
            topic: function() {
                fs.readFile(__dirname + "/test-rolling-file-stream-write-more", "utf8", this.callback);
            },
            'should contain the last two log messages': function(contents) {
                assert.equal(contents, '5.cheese\n6.cheese\n');
            }
        },
        'the second file': {
            topic: function() {
                fs.readFile(__dirname + '/test-rolling-file-stream-write-more.1', "utf8", this.callback);
            },
            'should contain the first five log messages': function(contents) {
                assert.equal(contents, '0.cheese\n1.cheese\n2.cheese\n3.cheese\n4.cheese\n');
            }
        }
    }
}).exportTo(module);
