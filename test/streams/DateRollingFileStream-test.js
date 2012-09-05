var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    DateRollingFileStream = require('../../lib/streams').DateRollingFileStream;

vows.describe('DateRollingFileStream').addBatch({
    'arguments': {
        topic: new DateRollingFileStream('test-date-rolling-file-stream', 'yyyy-mm-dd.hh'),

        'should take a filename and a pattern and return a FileWriteStream': function(stream) {
            assert.equal(stream.filename, 'test-date-rolling-file-stream');
            assert.equal(stream.pattern, 'yyyy-mm-dd.hh');
            assert.instanceOf(stream, fs.FileWriteStream);
        },
        'with default settings for the underlying stream': function(stream) {
            assert.equal(stream.mode, 420);
            assert.equal(stream.flags, 'a');
            assert.equal(stream.encoding, 'utf8');
        }
    },

    'default arguments': {
        topic: new DateRollingFileStream('test-date-rolling-file-stream'),

        'pattern should be yyyy-mm-dd': function(stream) {
            assert.equal(stream.pattern, 'yyyy-mm-dd');
        }
    },

    'with stream arguments': {
        topic: new DateRollingFileStream('test-rolling-file-stream', 'yyyy-mm-dd', { mode: 0666 }),

        'should pass them to the underlying stream': function(stream) {
            assert.equal(stream.mode, 0666);
        }
    },

    'with stream arguments but no pattern': {
        topic: new DateRollingFileStream('test-rolling-file-stream', { mode: 0666 }),

        'should pass them to the underlying stream': function(stream) {
            assert.equal(stream.mode, 0666);
        },
        'should use default pattern': function(stream) {
            assert.equal(stream.pattern, 'yyyy-mm-dd');
        }
    }

}).exportTo(module);
