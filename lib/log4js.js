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
 * NOTE: the authors below are the original browser-based log4js authors
 * don't try to contact them about bugs in this version :)
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
, util = require('util')
, layouts = require('./layouts')
, levels = require('./levels')
, consoleAppender = require('./appenders/console').appender
, DEFAULT_CATEGORY = '[default]'
, appenders = {}
, loggers = {}
, appenderMakers = {};

function isFunction(obj) {
    return (Object.prototype.toString.call(obj) == '[object Function]')
}

function registerAppender(logger,appender) {
    if (isFunction(appender)) {
        logger.addListener("log", appender);
    } else {
        for (var eventName in appender) {
            logger.addListener(eventName, appender[eventName]);
        }
    }
}

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
        var index = categoryName.lastIndexOf('.');
        if (index <= 0) {
            loggers[categoryName] = new Logger(categoryName);
        } else {
            var parentLoggerCategoryName = categoryName.slice(0, index);
            loggers[categoryName] = new Logger(categoryName, null, getLogger(parentLoggerCategoryName));
        }
        if (appenders[categoryName]) {
            appenderList = appenders[categoryName];
            appenderList.forEach(function(appender) {
                registerAppender(loggers[categoryName], appender);
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
        args = [ DEFAULT_CATEGORY ];
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

        if (loggers[category]) {
            registerAppender(loggers[category], appender);
        }
    });
}

function clearAppenders () {
    appenders = {};
    for (var logger in loggers) {
        if (loggers.hasOwnProperty(logger)) {
            loggers[logger].removeAllListeners("log");
            loggers[logger].removeAllListeners("flush");
        }
    }
}

function configureAppenders(appenderList) {
    clearAppenders();
    if (appenderList) {
        appenderList.forEach(function(appenderConfig) {
            loadAppender(appenderConfig.type);
            var appender;
            appenderConfig.makers = appenderMakers;
            appender = appenderMakers[appenderConfig.type](appenderConfig);
            if (appender) {
                addAppender(appender, appenderConfig.category);
            } else {
                throw new Error("log4js configuration problem for "+util.inspect(appenderConfig));
            }
        });
    } else {
        addAppender(consoleAppender());
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
            if (loggers.hasOwnProperty(l)) {
                loggers[l].setLevel();
            }
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
function Logger (name, level, parentLogger) {
    this.category = name || DEFAULT_CATEGORY;
    if (parentLogger) {
      this.parentLogger = parentLogger;
    } else if (this.category != DEFAULT_CATEGORY) {
      this.parentLogger = getDefaultLogger();
    }

    if (this.parentLogger && this.parentLogger.hasOwnProperty('level')) {
      this.level = this.parentLogger.level;
    }
}
util.inherits(Logger, events.EventEmitter);

Logger.prototype.level = levels.TRACE;

Logger.prototype.setLevel = function(level) {
    this.level = levels.toLevel(level, levels.TRACE);
};

Logger.prototype.removeLevel = function() {
    delete this.level;
};

Logger.prototype.getParent = function() {
    return this.parentLogger;
}

Logger.prototype.getLogger = function(subCategoryName) {
    if (!subCategoryName || subCategoryName.length <= 0) {
      return this;
    }
    return getLogger(this.category+"."+subCategoryName);
}

Logger.prototype.log = function() {
    var args = Array.prototype.slice.call(arguments)
  , logLevel = args.shift()
  , loggingEvent = new LoggingEvent(this.category, logLevel, args, this);
    this.emitLog(loggingEvent);
}

Logger.prototype.emitLog = function(loggingEvent) {
    this.emit("log", loggingEvent);
    if (this.parentLogger) {
      //this.parentLogger.emit("log", loggingEvent);
      Logger.prototype.emitLog.call(this.parentLogger, loggingEvent);
    }
}

Logger.prototype.flush = function(cb) {
    // Flush all appenders
    if (cb) {
      var num = this.listeners('flush').length;
      if (num == 0) {
        // No flush supported appender
        cb();
        return;
      }
      // Wait for each callbacks
      this.emit("flush", function() {
        if (--num <= 0) {
          cb();
        }
      });
    } else {
      this.emit("flush");
    }
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

function findConfiguration(filename) {
    var path;
    try {
        path = require.resolve(filename || 'log4js.json');
    } catch (e) {
        //file not found. default to the one in the log4js module.
        path = filename || __dirname + '/log4js.json';
    }

    return path;
}

var configState = {};

function loadConfigurationFile(filename) {
    filename = findConfiguration(filename);
    if (filename && (!configState.lastFilename || filename !== configState.lastFilename ||
                     !configState.lastMTime || fs.statSync(filename).mtime !== configState.lastMTime)) {
        configState.lastFilename = filename;
        configState.lastMTime = fs.statSync(filename).mtime;
        return JSON.parse(fs.readFileSync(filename, "utf8"));
    }
    return undefined;
}

function configureOnceOff(config) {
    if (config) {
        try {
            configureAppenders(config.appenders);
            configureLevels(config.levels);

            if (config.doNotReplaceConsole) {
                restoreConsole();
            } else {
                replaceConsole();
            }
        } catch (e) {
            throw new Error("Problem reading log4js config " + util.inspect(config) + ". Error was \"" + e.message + "\" ("+e.stack+")");
        }
    }
}

function reloadConfiguration() {
    var filename = findConfiguration(configState.filename),
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
            configureOnceOff(loadConfigurationFile(filename));
        }
    } else {
        configureOnceOff(loadConfigurationFile(filename));
    }
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
    options = options || {};

    if (config === undefined || config === null || typeof(config) === 'string') {
        if (options.reloadSecs) {
            initReloadConfiguration(config, options);
        }
        config = loadConfigurationFile(config);
    } else {
        if (options.reloadSecs) {
            getLogger('log4js').warn('Ignoring configuration reload parameter for "object" configuration.');
        }
    }

    if (options.hasOwnProperty('cwd')) {
        if(config.hasOwnProperty('appenders')) {
            config.appenders.forEach(function(appender) {
                if (!appender.hasOwnProperty('type')) return;

                if (appender.type === 'file') {
                    if(!appender.hasOwnProperty('filename')) return;
                    if(appender.hasOwnProperty('absolute')) {
                        if(appender.absolute) return;
                    }

                    appender.filename = path.join(options.cwd, appender.filename);
                }
            });
        }
    }

    configureOnceOff(config);
}

var originalConsoleFunctions = {
    log: console.log,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
};

function replaceConsole(logger) {
    function replaceWith(fn) {
        return function() {
            fn.apply(logger, arguments);
        }
    }
    logger = logger || getLogger("console");
    ['log','debug','info','warn','error'].forEach(function (item) {
        console[item] = replaceWith(item === 'log' ? logger.info : logger[item]);
    });
}

function restoreConsole() {
    ['log', 'debug', 'info', 'warn', 'error'].forEach(function (item) {
        console[item] = originalConsoleFunctions[item];
    });
}

function loadAppender(appender) {
    var appenderModule = require('./appenders/' + appender);
    module.exports.appenders[appenderModule.name] = appenderModule.appender;
    appenderMakers[appenderModule.name] = appenderModule.configure;
}

function flushAllLoggers(cb) {
    // Flush all loggers
    if (cb) {
        var num = Object.keys(loggers).length;
        if (num == 0) {
            // No loggers
            cb();
            return;
        }

        // Wait for each callbacks
        for (var l in loggers) {
            loggers[l].flush(function() {
                if (--num <= 0) {
                    cb();
                };
            });
        };
    } else {
        for (var l in loggers) {
            loggers[l].flush();
        }
    }
}

module.exports = {
    getLogger: getLogger,
    getDefaultLogger: getDefaultLogger,

    addAppender: addAppender,
    loadAppender: loadAppender,
    clearAppenders: clearAppenders,
    configure: configure,

    flushAllLoggers: flushAllLoggers,

    replaceConsole: replaceConsole,
    restoreConsole: restoreConsole,

    levels: levels,
    setGlobalLogLevel: setGlobalLogLevel,

    layouts: layouts,
    appenders: {},
    appenderMakers: appenderMakers,
    connectLogger: require('./connect-logger').connectLogger
};

//load the old-style appenders
[ 'console', 'file', 'logLevelFilter' ].forEach(function(appender) {
   loadAppender(appender);
});

//set ourselves up if we can find a default log4js.json
configure(findConfiguration());

//keep the old-style layouts
['basicLayout','messagePassThroughLayout','colouredLayout','coloredLayout'].forEach(function(item) {
    module.exports[item] = layouts[item];
});

//and the old-style appenders
module.exports.consoleAppender = module.exports.appenders.console;
module.exports.fileAppender = module.exports.appenders.file;
module.exports.logLevelFilter = module.exports.appenders.logLevelFilter;
