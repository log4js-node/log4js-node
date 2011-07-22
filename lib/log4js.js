/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jsl:option explicit*/

/**
 * @fileoverview log4js is a library to log in JavaScript in similar manner
 * than in log4j for Java. The API should be nearly the same.
 *
 * This file contains all log4js code and is the only file required for logging.
 *
 * <h3>Example:</h3>
 * <pre>
 *  var logging = require('log4js');
 *  //add an appender that logs all messages to stdout.
 *  logging.addAppender(logging.consoleAppender());
 *  //add an appender that logs "some-category" to a file
 *  logging.addAppender(logging.fileAppender("file.log"), "some-category");
 *  //get a logger
 *  var log = logging.getLogger("some-category");
 *  log.setLevel(logging.levels.TRACE); //set the Level
 *
 *  ...
 *
 *  //call the log
 *  log.trace("trace me" );
 * </pre>
 *
 * @version 1.0
 * @author Stephan Strittmatter - http://jroller.com/page/stritti
 * @author Seth Chisamore - http://www.chisamore.com
 * @since 2005-05-20
 * @static
 * Website: http://log4js.berlios.de
 */
var events = require('events')
, fs = require('fs')
, path = require('path')
, sys = require('sys')
, layouts = require('./layouts')
, levels = require('./levels')
, DEFAULT_CATEGORY = '[default]'
, ALL_CATEGORIES = '[all]'
, appenders = {}
, loggers = {}
, appenderMakers = {
    "file": function(config, fileAppender) {
        var layout;
        if (config.layout) {
            layout = layouts.layout(config.layout.type, config.layout);
        }
        return fileAppender(config.filename, layout, config.maxLogSize, config.backups, config.pollInterval);
    },
    "console": function(config, fileAppender, consoleAppender) {
        var layout;
        if (config.layout) {
            layout = layouts.layout(config.layout.type, config.layout);
        }
        return consoleAppender(layout);
    },
    "logLevelFilter": function(config, fileAppender, consoleAppender) {
        var appender = appenderMakers[config.appender.type](config.appender, fileAppender, consoleAppender);
        return logLevelFilter(config.level, appender);
    }
};

/**
 * Get a logger instance. Instance is cached on categoryName level.
 * @param  {String} categoryName name of category to log to.
 * @return {Logger} instance of logger for the category
 * @static
 */
function getLogger (categoryName) {

    // Use default logger if categoryName is not specified or invalid
    if (!(typeof categoryName == "string")) {
        categoryName = DEFAULT_CATEGORY;
    }

    var appenderList;
    if (!loggers[categoryName]) {
        // Create the logger for this name if it doesn't already exist
        loggers[categoryName] = new Logger(categoryName);
        if (appenders[categoryName]) {
            appenderList = appenders[categoryName];
            appenderList.forEach(function(appender) {
                loggers[categoryName].addListener("log", appender);
            });
        }
        if (appenders[ALL_CATEGORIES]) {
            appenderList = appenders[ALL_CATEGORIES];
            appenderList.forEach(function(appender) {
                loggers[categoryName].addListener("log", appender);
            });
        }
    }

    return loggers[categoryName];
}

/**
 * args are appender, then zero or more categories
 */
function addAppender () {
    var args = Array.prototype.slice.call(arguments);
    var appender = args.shift();
    if (args.length == 0 || args[0] === undefined) {
        args = [ ALL_CATEGORIES ];
    }
    //argument may already be an array
    if (Array.isArray(args[0])) {
        args = args[0];
    }

    args.forEach(function(category) {
        if (!appenders[category]) {
            appenders[category] = [];
        }
        appenders[category].push(appender);

        if (category === ALL_CATEGORIES) {
            for (var logger in loggers) {
                if (loggers.hasOwnProperty(logger)) {
                    loggers[logger].addListener("log", appender);
                }
            }
        } else if (loggers[category]) {
            loggers[category].addListener("log", appender);
        }
    });
}

function clearAppenders () {
    appenders = {};
    for (var logger in loggers) {
        if (loggers.hasOwnProperty(logger)) {
            loggers[logger].removeAllListeners("log");
        }
    }
}

function configureAppenders(appenderList, fileAppender, consoleAppender) {
    clearAppenders();
    if (appenderList) {
        appenderList.forEach(function(appenderConfig) {
            var appender = appenderMakers[appenderConfig.type](appenderConfig, fileAppender, consoleAppender);
            if (appender) {
                addAppender(appender, appenderConfig.category);
            } else {
                throw new Error("log4js configuration problem for "+sys.inspect(appenderConfig));
            }
        });
    } else {
        addAppender(consoleAppender);
    }
}

function configureLevels(levels) {
    if (levels) {
        for (var category in levels) {
            if (levels.hasOwnProperty(category)) {
                getLogger(category).setLevel(levels[category]);
            }
        }
    } else {
        for (l in loggers) {
            loggers[l].setLevel();
        }
    }
}

/**
 * Models a logging event.
 * @constructor
 * @param {String} categoryName name of category
 * @param {Log4js.Level} level level of message
 * @param {Array} data objects to log
 * @param {Log4js.Logger} logger the associated logger
 * @author Seth Chisamore
 */
function LoggingEvent (categoryName, level, data, logger) {
    this.startTime = new Date();
    this.categoryName = categoryName;
    this.data = data;
    this.level = level;
    this.logger = logger;
}

/**
 * Logger to log messages.
 * use {@see Log4js#getLogger(String)} to get an instance.
 * @constructor
 * @param name name of category to log to
 * @author Stephan Strittmatter
 */
function Logger (name, level) {
    this.category = name || DEFAULT_CATEGORY;

    if (! this.level) {
        this.__proto__.level = levels.TRACE;
    }
}
sys.inherits(Logger, events.EventEmitter);

Logger.prototype.setLevel = function(level) {
    this.level = levels.toLevel(level, levels.TRACE);
};

Logger.prototype.removeLevel = function() {
    delete this.level;
};

Logger.prototype.log = function() {
    var args = Array.prototype.slice.call(arguments)
  , logLevel = args.shift()
  , loggingEvent = new LoggingEvent(this.category, logLevel, args, this);
    this.emit("log", loggingEvent);
};

Logger.prototype.isLevelEnabled = function(otherLevel) {
    return this.level.isLessThanOrEqualTo(otherLevel);
};

['Trace','Debug','Info','Warn','Error','Fatal'].forEach(
    function(levelString) {
        var level = levels.toLevel(levelString);
        Logger.prototype['is'+levelString+'Enabled'] = function() {
            return this.isLevelEnabled(level);
        };

        Logger.prototype[levelString.toLowerCase()] = function () {
            if (this.isLevelEnabled(level)) {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(level);
                Logger.prototype.log.apply(this, args);
            }
        };
    }
);

function setGlobalLogLevel(level) {
    Logger.prototype.level = levels.toLevel(level, levels.TRACE);
}

/**
 * Get the default logger instance.
 * @return {Logger} instance of default logger
 * @static
 */
function getDefaultLogger () {
    return getLogger(DEFAULT_CATEGORY);
}

function logLevelFilter (levelString, appender) {
    var level = levels.toLevel(levelString);
    return function(logEvent) {
        if (logEvent.level.isGreaterThanOrEqualTo(level)) {
            appender(logEvent);
        }
    }
}


function consoleAppender (layout) {
    layout = layout || layouts.colouredLayout;
    return function(loggingEvent) {
        console._preLog4js_log(layout(loggingEvent));
    };
}

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
    var logFile = fs.createWriteStream(file, { flags: 'a', mode: 0644, encoding: 'utf8' });

    if (logSize > 0) {
        setupLogRolling(logFile, file, logSize, numBackups || 5, (filePollInterval * 1000) || 30000);
    }

    //close the file on process exit.
    process.on('exit', function() {
        logFile.end();
    });

    return function(loggingEvent) {
        logFile.write(layout(loggingEvent)+'\n');
    };
}

function setupLogRolling (logFile, filename, logSize, numBackups, filePollInterval) {
    fs.watchFile(
        filename,
        {
            persistent: false,
            interval: filePollInterval
        },
        function (curr, prev) {
            if (curr.size >= logSize) {
                rollThatLog(logFile, filename, numBackups);
            }
        }
    );
}

function rollThatLog (logFile, filename, numBackups) {
    //first close the current one.
    logFile.end();
    //roll the backups (rename file.n-1 to file.n, where n <= numBackups)
    for (var i=numBackups; i > 0; i--) {
        if (i > 1) {
            if (fileExists(filename + '.' + (i-1))) {
                fs.renameSync(filename+'.'+(i-1), filename+'.'+i);
            }
        } else {
            fs.renameSync(filename, filename+'.1');
        }
    }
    //open it up again
    logFile = fs.createWriteStream(filename, { flags: 'a', mode: 0644, encoding: "utf8" });
}

function fileExists (filename) {
    try {
        fs.statSync(filename);
        return true;
    } catch (e) {
        return false;
    }
}

function findConfiguration() {
    //add current directory onto the list of configPaths
    var paths = ['.'].concat(require.paths);
    //add this module's directory to the end of the list, so that we pick up the default config
    paths.push(__dirname);
    var pathsWithConfig = paths.filter( function (pathToCheck) {
        try {
            fs.statSync(path.join(pathToCheck, "log4js.json"));
            return true;
        } catch (e) {
            return false;
        }
    });
    if (pathsWithConfig.length > 0) {
        return path.join(pathsWithConfig[0], 'log4js.json');
    }
    return undefined;
}

function loadConfigurationFile(filename) {
    filename = filename || findConfiguration();
    if (filename) {
        return JSON.parse(fs.readFileSync(filename, "utf8"));
    }
    return undefined;
}

function configureOnceOff(config) {
    if (config) {
        try {
            configureAppenders(config.appenders, fileAppender, consoleAppender);
            configureLevels(config.levels);
        } catch (e) {
            throw new Error("Problem reading log4js config " + sys.inspect(config) + ". Error was \"" + e.message + "\" ("+e.stack+")");
        }
    }
}

var configState = {};

function reloadConfiguration() {
    var filename = configState.filename || findConfiguration(),
    mtime;
    if (!filename) {
        // can't find anything to reload
        return;
    }
    try {
        mtime = fs.statSync(filename).mtime;
    } catch (e) {
        getLogger('log4js').warn('Failed to load configuration file ' + filename);
        return;
    }
    if (configState.lastFilename && configState.lastFilename === filename) {
        if (mtime.getTime() > configState.lastMTime.getTime()) {
            configState.lastMTime = mtime;
        } else {
            filename = null;
        }
    } else {
        configState.lastFilename = filename;
        configState.lastMTime = mtime;
    }
    configureOnceOff(loadConfigurationFile(filename));
}

function initReloadConfiguration(filename, options) {
    if (configState.timerId) {
        clearInterval(configState.timerId);
        delete configState.timerId;
    }
    configState.filename = filename;
    configState.timerId = setInterval(reloadConfiguration, options.reloadSecs*1000);
}

function configure (configurationFileOrObject, options) {
    var config = configurationFileOrObject;
    if (config === undefined || config === null || typeof(config) === 'string') {
        options = options || { reloadSecs: 60 };
        if (options.reloadSecs) {
            initReloadConfiguration(config, options);
        }
        configureOnceOff(loadConfigurationFile(config));
    } else {
        options = options || {};
        if (options.reloadSecs) {
            getLogger('log4js').warn('Ignoring configuration reload parameter for "object" configuration.');
        }
        configureOnceOff(config);
    }
}

function replaceConsole(logger) {
    function replaceWith(fn) {
        return function() {
            fn.apply(logger, arguments);
        }
    }

    ['log','debug','info','warn','error'].forEach(function (item) {
        console['_preLog4js_'+item] = console[item];
        console[item] = replaceWith(item === 'log' ? logger.info : logger[item]);
    });

}

//set ourselves up if we can find a default log4js.json
configure(findConfiguration());
//replace console.log, etc with log4js versions
replaceConsole(getLogger("console"));

module.exports = {
    getLogger: getLogger,
    getDefaultLogger: getDefaultLogger,

    addAppender: addAppender,
    clearAppenders: clearAppenders,
    configure: configure,

    levels: levels,
    setGlobalLogLevel: setGlobalLogLevel,

    consoleAppender: consoleAppender,
    fileAppender: fileAppender,
    logLevelFilter: logLevelFilter,

    layouts: layouts,
    connectLogger: require('./connect-logger').connectLogger
};

//keep the old-style layouts
['basicLayout','messagePassThroughLayout','colouredLayout','coloredLayout'].forEach(function(item) {
    module.exports[item] = layouts[item];
});

