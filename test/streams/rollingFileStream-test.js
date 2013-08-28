"use strict";
var async = require('async')
, should = require('should')
, fs = require('fs')
, semver = require('semver')
, streams
, RollingFileStream;

if (semver.satisfies(process.version, '>=0.10.0')) {
  streams = require('stream');
} else {
  streams = require('readable-stream');
}
RollingFileStream = require('../../lib/streams').RollingFileStream;

function remove(filename, cb) {
  fs.unlink(filename, function() { cb(); });
}

function create(filename, cb) {
  fs.writeFile(filename, "test file", cb);
}

describe('RollingFileStream', function() {
  
  describe('arguments', function() {
    var stream;

    before(function(done) {
      remove(__dirname + "/test-rolling-file-stream", function() {
        stream = new RollingFileStream("test-rolling-file-stream", 1024, 5);
        done();
      });
    });

    after(function(done) {
      remove(__dirname + "/test-rolling-file-stream", done);
    });

    it('should take a filename, file size (bytes), no. backups, return Writable', function() {
      stream.should.be.an.instanceOf(streams.Writable);
      stream.filename.should.eql("test-rolling-file-stream");
      stream.size.should.eql(1024);
      stream.backups.should.eql(5);
    });

    it('should apply default settings to the underlying stream', function() {
      stream.theStream.mode.should.eql(420);
      stream.theStream.flags.should.eql('a');
      //encoding isn't a property on the underlying stream
      //assert.equal(stream.theStream.encoding, 'utf8');
    });
  });

  describe('with stream arguments', function() {
    it('should pass them to the underlying stream', function() {
      var stream = new RollingFileStream(
        'test-rolling-file-stream', 
        1024, 
        5, 
        { mode: parseInt('0666', 8) }
      );
      stream.theStream.mode.should.eql(parseInt('0666', 8));
    });

    after(function(done) {
      remove(__dirname + '/test-rolling-file-stream', done);
    });
  });

  describe('without size', function() {
    it('should throw an error', function() {
      (function() {
        new RollingFileStream(__dirname + "/test-rolling-file-stream");
      }).should.throw();
    });
  });

  describe('without number of backups', function() {
    it('should default to 1 backup', function() {
      var stream = new RollingFileStream(__dirname + "/test-rolling-file-stream", 1024);
      stream.backups.should.eql(1);
    });

    after(function(done) {
      remove(__dirname + "/test-rolling-file-stream", done);
    });
  });

  describe('writing less than the file size', function() {

    before(function(done) {
      remove(__dirname + "/test-rolling-file-stream-write-less", function() {
        var stream = new RollingFileStream(
          __dirname + "/test-rolling-file-stream-write-less", 
          100
        );
        stream.write("cheese", "utf8", function() {
          stream.end(done);
        });
      });
    });

    after(function(done) {
      remove(__dirname + "/test-rolling-file-stream-write-less", done);
    });
    
    it('should write to the file', function(done) {
      fs.readFile(
        __dirname + "/test-rolling-file-stream-write-less", "utf8", 
        function(err, contents) {
          contents.should.eql("cheese");
          done(err);
        }
      );
    });

    it('should write one file', function(done) {
      fs.readdir(__dirname, function(err, files) {
        files.filter(
          function(file) { return file.indexOf('test-rolling-file-stream-write-less') > -1; }
        ).should.have.length(1);
        done(err);
      });
    });
  });

  describe('writing more than the file size', function() {
    before(function(done) {
      async.forEach(
        [
          __dirname + "/test-rolling-file-stream-write-more",
          __dirname + "/test-rolling-file-stream-write-more.1"
        ],
        remove,
        function() {
          var stream = new RollingFileStream(
            __dirname + "/test-rolling-file-stream-write-more", 
            45
          );
          async.forEachSeries(
            [0, 1, 2, 3, 4, 5, 6], 
            function(i, cb) {
              stream.write(i +".cheese\n", "utf8", cb);
            }, 
            function() {
              stream.end(done);
            }
          );
        }
      );
    });

    after(function(done) {
      async.forEach(
        [
          __dirname + "/test-rolling-file-stream-write-more",
          __dirname + "/test-rolling-file-stream-write-more.1"
        ],
        remove,
        done
      );
    });

    it('should write two files' , function(done) {
      fs.readdir(__dirname, function(err, files) {
        files.filter(
          function(file) { 
            return file.indexOf('test-rolling-file-stream-write-more') > -1; 
          }
        ).should.have.length(2);
        done(err);
      });
    });

    it('should write the last two log messages to the first file', function(done) {
      fs.readFile(
        __dirname + "/test-rolling-file-stream-write-more", "utf8", 
        function(err, contents) {
          contents.should.eql('5.cheese\n6.cheese\n');
          done(err);
        });
    });

    it('should write the first five log messages to the second file', function(done) {
      fs.readFile(
        __dirname + '/test-rolling-file-stream-write-more.1', "utf8", 
        function(err, contents) {
          contents.should.eql('0.cheese\n1.cheese\n2.cheese\n3.cheese\n4.cheese\n');
          done(err);
        }
      );
    });
  });

  describe('when many files already exist', function() {
    before(function(done) {
      async.forEach(
        [
          __dirname + '/test-rolling-stream-with-existing-files.11',
          __dirname + '/test-rolling-stream-with-existing-files.20',
          __dirname + '/test-rolling-stream-with-existing-files.-1',
          __dirname + '/test-rolling-stream-with-existing-files.1.1',
          __dirname + '/test-rolling-stream-with-existing-files.1'
        ],
        remove,
        function(err) {
          if (err) done(err);
          
          async.forEach(
            [
              __dirname + '/test-rolling-stream-with-existing-files.11',
              __dirname + '/test-rolling-stream-with-existing-files.20',
              __dirname + '/test-rolling-stream-with-existing-files.-1',
              __dirname + '/test-rolling-stream-with-existing-files.1.1',
              __dirname + '/test-rolling-stream-with-existing-files.1'
            ],
            create,
            function(err) {
              if (err) done(err);

              var stream = new RollingFileStream(
                __dirname + "/test-rolling-stream-with-existing-files", 
                45,
                5
              );
              
              async.forEachSeries(
                [0, 1, 2, 3, 4, 5, 6], 
                function(i, cb) {
                  stream.write(i +".cheese\n", "utf8", cb);
                }, 
                function() {
                  stream.end(done);
                }
              );
            }
          );
        }
      );
    });

    after(function(done) {
      async.forEach([
        'test-rolling-stream-with-existing-files',
        'test-rolling-stream-with-existing-files.1',
        'test-rolling-stream-with-existing-files.2',
        'test-rolling-stream-with-existing-files.11',
        'test-rolling-stream-with-existing-files.20'
      ], remove, done);
    });

    it('should roll the files', function(done) {
      fs.readdir(__dirname, function(err, files) {
        files.should.include('test-rolling-stream-with-existing-files');
        files.should.include('test-rolling-stream-with-existing-files.1');
        files.should.include('test-rolling-stream-with-existing-files.2');
        files.should.include('test-rolling-stream-with-existing-files.11');
        files.should.include('test-rolling-stream-with-existing-files.20');
        done(err);
      });
    });
  });
});
