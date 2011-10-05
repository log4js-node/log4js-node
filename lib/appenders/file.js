var layouts = require('../layouts')
, fs = require('fs');

/**
 * File Appender writing the logs to a text file. Supports rolling of logs by size.
 *
 * @param file file log messages will be written to
 * @param layout a function that takes a logevent and returns a string (defaults to basicLayout).
 * @param logSize - the maximum size (in bytes) for a log file, if not provided then logs won't be rotated.
 * @param numBackups - the number of log files to keep after logSize has been reached (default 5)
 * @param filePollInterval - the time in seconds between file size checks (default 30s)
 */
function fileAppender (file, layout, logSize, numBackups, filePollInterval) {
    layout = layout || layouts.basicLayout;
    numBackups = numBackups === undefined ? 5 : numBackups;
    //there has to be at least one backup if logSize has been specified
    numBackups = numBackups === 0 ? 1 : numBackups;
    filePollInterval = filePollInterval * 1000 || 30000;

    function setupLogRolling () {
        fs.watchFile(
            file,
            {
                persistent: false,
                interval: filePollInterval
            },
            function (curr, prev) {
                if (curr.size >= logSize) {
                    rollThatLog();
                }
            }
        );
    }

    function rollThatLog () {
        //roll the backups (rename file.n-1 to file.n, where n <= numBackups)
        for (var i=numBackups; i > 0; i--) {
            if (i > 1) {
                if (fileExists(file + '.' + (i-1))) {
                    fs.renameSync(file+'.'+(i-1), file+'.'+i);
                }
            } else {
                fs.renameSync(file, file+'.1');
            }
        }
        //let's make a new file
        var newLogFileFD = fs.openSync(file, 'a', 0644)
      , oldLogFileFD = logFile.fd;
        logFile.fd = newLogFileFD;
        fs.close(oldLogFileFD);
    }

    function fileExists (filename) {
        try {
            fs.statSync(filename);
            return true;
        } catch (e) {
            return false;
        }
    }

    function openTheStream() {
        var stream = fs.createWriteStream(file, { flags: 'a', mode: 0644, encoding: 'utf8' });
        stream.on("open", function() {
            canWrite = true;
            while (logEventBuffer.length > 0 && canWrite) {
                canWrite = writeToLog(logEventBuffer.shift());
            }
        });
        stream.on("error", function (err) {
            console.error("log4js.fileAppender - Error happened ", err);
        });
        stream.on("drain", function() {
            canWrite = true;
            while (logEventBuffer.length > 0 && canWrite) {
                canWrite = writeToLog(logEventBuffer.shift());
            }
        });
        return stream;
    }


    var logEventBuffer = []
  , canWrite = false
  , logFile = openTheStream();

    if (logSize > 0) {
        setupLogRolling();
    }

    //close the file on process exit.
    process.on('exit', function() {
        logFile.end();
        logFile.destroy();
    });

    function writeToLog(loggingEvent) {
	return logFile.write(layout(loggingEvent)+'\n', "utf8");
    }

    return function(loggingEvent) {
        //because the log stream is opened asynchronously, we don't want to write
        //until it is ready.
        if (canWrite) {
            canWrite = writeToLog(loggingEvent);
        } else {
            logEventBuffer.push(loggingEvent);
        }
    };
}

function configure(config) {
    var layout;
    if (config.layout) {
	layout = layouts.layout(config.layout.type, config.layout);
    }
    return fileAppender(config.filename, layout, config.maxLogSize, config.backups, config.pollInterval);
}

exports.name = "file";
exports.appender = fileAppender;
exports.configure = configure;
