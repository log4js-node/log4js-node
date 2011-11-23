var layouts = require('../layouts')
, path = require('path')
, fs = require('fs');

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
    
    function setupLogRolling () {
        try {
            var stat = fs.statSync(file);
            bytesWritten = stat.size;
            if (bytesWritten >= logSize) {
                rollThatLog();
            }
        } catch (e) {
            //file does not exist
            bytesWritten = 0;
        }
    }

    function rollThatLog () {
        function index(filename) {
            return parseInt(filename.substring((path.basename(file) + '.').length), 10) || 0;
        }

        var nameMatcher = new RegExp('^' + path.basename(file));
        function justTheLogFiles (item) {
            return nameMatcher.test(item);
        }

        function byIndex(a, b) {
            if (index(a) > index(b)) {
                return 1;
            } else if (index(a) < index(b) ) {
                return -1;
            } else {
                return 0;
            }
        }

        function increaseFileIndex (fileToRename) {
            var idx = index(fileToRename);
            if (idx < numBackups) {
                fs.renameSync(path.join(path.dirname(file), fileToRename), file + '.' + (idx + 1));
            }
        }

        //roll the backups (rename file.n to file.n+1, where n <= numBackups)
        fs.readdirSync(path.dirname(file))
          .filter(justTheLogFiles)
            .sort(byIndex)
              .reverse()
                .forEach(increaseFileIndex);

        //let's make a new file
        var newLogFileFD = fs.openSync(file, 'a', 0644)
      , oldLogFileFD = logFile.fd;
        logFile.fd = newLogFileFD;
        fs.close(oldLogFileFD);
        //reset the counter
        bytesWritten = 0;
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
        });
        stream.on("error", function (err) {
            console.error("log4js.fileAppender - Writing to file %s, error happened ", file, err);
        });
        stream.on("drain", function() {
            canWrite = true;
        });
        return stream;
    }

    function flushBuffer(force) {
        logFile.write(force + "\n", "utf8");
        
        while ((logEventBuffer.length > 0) && (canWrite || force)) {
            canWrite = writeToLog(logEventBuffer.shift());
        }
    }
    
    var logEventBuffer = []
  , canWrite = false
  , logFile = openTheStream();

    if (logSize > 0) {
        setupLogRolling();
    }
    
    // during testing, write() returns false a LOT.
    var intervalId = setInterval(flushBuffer, 100, false);
    
    // close the file on process exit.
    // this doesn't seem to actually work…
    process.on('exit', function() {
        clearInterval(intervalId);
        
        flushBuffer(true);
        logFile.end();
        logFile.destroy();
    });
    
    function writeToLog(loggingEvent) {
        var rc = true;
        
        var logMessage = layout(loggingEvent)+'\n';
        //not entirely accurate, but it'll do.
        bytesWritten += logMessage.length;
        
        rc = logFile.write(logMessage, "utf8");
        
        if (rc) {
            if (bytesWritten >= logSize) {
                rollThatLog();
            }
        }
        
        return rc;
    }
    
    return function(loggingEvent) {
        logEventBuffer.push(loggingEvent);
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
