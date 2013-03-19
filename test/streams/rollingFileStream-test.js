var vows = require('vows')
, async = require('async')
, assert = require('assert')
, events = require('events')
, fs = require('fs')
, streams = require('stream')
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
        'should take a filename, file size in bytes, number of backups as arguments and return a Writable': function(stream) {
          assert.instanceOf(stream, streams.Writable);
          assert.equal(stream.filename, "test-rolling-file-stream");
          assert.equal(stream.size, 1024);
          assert.equal(stream.backups, 5);
        },
        'with default settings for the underlying stream': function(stream) {
            assert.equal(stream.theStream.mode, 420);
            assert.equal(stream.theStream.flags, 'a');
	  //encoding isn't a property on the underlying stream
          //assert.equal(stream.theStream.encoding, 'utf8');
        }
    },
    'with stream arguments': {
        topic: function() {
            remove(__dirname + '/test-rolling-file-stream');
            return new RollingFileStream('test-rolling-file-stream', 1024, 5, { mode: 0666 });
        },
        'should pass them to the underlying stream': function(stream) {
            assert.equal(stream.theStream.mode, 0666);
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
        stream.write("cheese", "utf8", function() {
          stream.end();
          fs.readFile(__dirname + "/test-rolling-file-stream-write-less", "utf8", that.callback);
	});
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
    },
    'writing more than the file size': {
      topic: function() {
        remove(__dirname + "/test-rolling-file-stream-write-more");
        remove(__dirname + "/test-rolling-file-stream-write-more.1");
        var that = this, stream = new RollingFileStream(__dirname + "/test-rolling-file-stream-write-more", 45);
	async.forEach([0, 1, 2, 3, 4, 5, 6], function(i, cb) {
	  stream.write(i +".cheese\n", "utf8", cb);
        }, function() {
	  stream.end();
	  that.callback();
	});
      },
      'the number of files': {
        topic: function() {
          fs.readdir(__dirname, this.callback);
        },
        'should be two': function(files) {
          assert.equal(files.filter(
	    function(file) { return file.indexOf('test-rolling-file-stream-write-more') > -1; }
	  ).length, 2);
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
