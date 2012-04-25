var layouts = require('../layouts')
, path = require('path')
, fs = require('fs')
, streams = require('../streams');

/**
 * File Appender writing the logs to a text file. Supports rolling of logs by size.
 *
 * @param file file log messages will be written to
 * @param layout a function that takes a logevent and returns a string (defaults to basicLayout).
 * @param logSize - the maximum size (in bytes) for a log file, if not provided then logs won't be rotated.
 * @param numBackups - the number of log files to keep after logSize has been reached (default 5)
 */
function fileAppender (file, layout, logSize, numBackups) {
    var bytesWritten = 0;
    file = path.normalize(file);
    layout = layout || layouts.basicLayout;
    numBackups = numBackups === undefined ? 5 : numBackups;
    //there has to be at least one backup if logSize has been specified
    numBackups = numBackups === 0 ? 1 : numBackups;

    function openTheStream(file, fileSize, numFiles) {
        var stream;
        if (fileSize) {
            stream = new streams.BufferedWriteStream(
                new streams.RollingFileStream(
                    file,
                    fileSize,
                    numFiles
                )
            );
        } else {
            stream = new streams.BufferedWriteStream(fs.createWriteStream(file, { encoding: "utf8", mode: 0644, flags: 'a' }));
        }
        stream.on("error", function (err) {
            console.error("log4js.fileAppender - Writing to file %s, error happened ", file, err);
        });
        return stream;
    }

    var logFile = openTheStream(file, logSize, numBackups);

    //close the file on process exit.
    process.on('exit', function() {
        logFile.end();
    });

    return {
      log: function(loggingEvent) {
                logFile.write(layout(loggingEvent)+'\n', "utf8");
              },
      flush: function(cb) {
               logFile.flushBufferEvenIfCannotWrite(cb);
             }
    };
}

function configure(config) {
    var layout;
    if (config.layout) {
	layout = layouts.layout(config.layout.type, config.layout);
    }
    return fileAppender(config.filename, layout, config.maxLogSize, config.backups);
}

exports.name = "file";
exports.appender = fileAppender;
exports.configure = configure;
