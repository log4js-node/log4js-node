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
 *  var logging = require('log4js-node')();
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
var events = require('events'),
path = require('path'),
sys = require('sys'),
DEFAULT_CATEGORY = '[default]',
ALL_CATEGORIES = '[all]',
appenders = {},
loggers = {},
levels = {
    ALL: new Level(Number.MIN_VALUE, "ALL", "grey"),
    TRACE: new Level(5000, "TRACE", "blue"),
    DEBUG: new Level(10000, "DEBUG", "cyan"),
    INFO: new Level(20000, "INFO", "green"),
    WARN: new Level(30000, "WARN", "yellow"),
    ERROR: new Level(40000, "ERROR", "red"),
    FATAL: new Level(50000, "FATAL", "magenta"),
    OFF: new Level(Number.MAX_VALUE, "OFF", "grey")  
},
appenderMakers = {
    "file": function(config, fileAppender) {
	var layout;
	if (config.layout) {
	    layout = layoutMakers[config.layout.type](config.layout);
	}
	return fileAppender(config.filename, layout, config.maxLogSize, config.backups, config.pollInterval);
    },
    "console": function(config, fileAppender, consoleAppender) {
	var layout;
	if (config.layout) {
	    layout = layoutMakers[config.layout.type](config.layout);
	}
	return consoleAppender(layout);
    },
    "logLevelFilter": function(config, fileAppender, consoleAppender) {
	var appender = appenderMakers[config.appender.type](config.appender, fileAppender, consoleAppender);
	return logLevelFilter(config.level, appender);
    }
},
layoutMakers = {
    "messagePassThrough": function() { return messagePassThroughLayout; },
    "basic": function() { return basicLayout; },
    "colored": function() { return colouredLayout; },
    "coloured": function() { return colouredLayout; },
    "pattern": function (config) {
	var pattern = config.pattern || undefined;
	return patternLayout(pattern);
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
    appenders.count = appenders.count ? appenders.count++ : 1;
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
    }
} 

function Level(level, levelStr, colour) {
    this.level = level;
    this.levelStr = levelStr;
    this.colour = colour;
}

/** 
 * converts given String to corresponding Level
 * @param {String} sArg String value of Level
 * @param {Log4js.Level} defaultLevel default Level, if no String representation
 * @return Level object
 * @type Log4js.Level
 */
Level.toLevel = function(sArg, defaultLevel) {                  
    
    if (sArg === null) {
	return defaultLevel;
    }
    
    if (typeof sArg == "string") { 
	var s = sArg.toUpperCase();
	if (levels[s]) {
	    return levels[s];
	}
    }
    return defaultLevel;
};

Level.prototype.toString = function() {
    return this.levelStr;	
};

Level.prototype.isLessThanOrEqualTo = function(otherLevel) {
    return this.level <= otherLevel.level;
};

Level.prototype.isGreaterThanOrEqualTo = function(otherLevel) {
    return this.level >= otherLevel.level;
};

/**
 * Models a logging event.
 * @constructor
 * @param {String} categoryName name of category
 * @param {Log4js.Level} level level of message
 * @param {String} message message to log
 * @param {Log4js.Logger} logger the associated logger
 * @author Seth Chisamore
 */
function LoggingEvent (categoryName, level, message, exception, logger) {
    this.startTime = new Date();
    this.categoryName = categoryName;
    this.message = message;
    this.level = level;
    this.logger = logger;
    if (exception && exception.message && exception.name) {
        this.exception = exception;
    } else if (exception) {
        this.exception = new Error(sys.inspect(exception));
    }
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
    this.level = Level.toLevel(level, levels.TRACE);
}
sys.inherits(Logger, events.EventEmitter);

Logger.prototype.setLevel = function(level) {
    this.level = Level.toLevel(level, levels.TRACE);
};

Logger.prototype.log = function(logLevel, message, exception) {
    var loggingEvent = new LoggingEvent(this.category, logLevel, message, exception, this);
    this.emit("log", loggingEvent);
};

Logger.prototype.isLevelEnabled = function(otherLevel) {
    return this.level.isLessThanOrEqualTo(otherLevel);
};

['Trace','Debug','Info','Warn','Error','Fatal'].forEach(
    function(levelString) {
	var level = Level.toLevel(levelString);
	Logger.prototype['is'+levelString+'Enabled'] = function() {
	    return this.isLevelEnabled(level);
	};
	
	Logger.prototype[levelString.toLowerCase()] = function (message, exception) {
	    if (this.isLevelEnabled(level)) {
		this.log(level, message, exception);
	    }
	};
    }
);

/**
 * Get the default logger instance.
 * @return {Logger} instance of default logger
 * @static
 */
function getDefaultLogger () {
    return getLogger(DEFAULT_CATEGORY); 
}

function logLevelFilter (levelString, appender) {
    var level = Level.toLevel(levelString);
    return function(logEvent) {
	if (logEvent.level.isGreaterThanOrEqualTo(level)) {
	    appender(logEvent);
	}
    }
}

/**
 * BasicLayout is a simple layout for storing the logs. The logs are stored
 * in following format:
 * <pre>
 * [startTime] [logLevel] categoryName - message\n
 * </pre>
 *
 * @author Stephan Strittmatter
 */
function basicLayout (loggingEvent) {
    var timestampLevelAndCategory = '[' + loggingEvent.startTime.toFormattedString() + '] ';
    timestampLevelAndCategory += '[' + loggingEvent.level.toString() + '] ';
    timestampLevelAndCategory += loggingEvent.categoryName + ' - ';
    
    var output = timestampLevelAndCategory + loggingEvent.message;
    
    if (loggingEvent.exception) {
	output += '\n'
	output += timestampLevelAndCategory;
	if (loggingEvent.exception.stack) {
	    output += loggingEvent.exception.stack;
	} else {
	    output += loggingEvent.exception.name + ': '+loggingEvent.exception.message;
	}
    }
    return output;
}

/**
 * Taken from masylum's fork (https://github.com/masylum/log4js-node)
 */
function colorize (str, style) {
    var styles = {
        //styles
        'bold'      : [1,  22],
        'italic'    : [3,  23],
        'underline' : [4,  24],
        'inverse'   : [7,  27],
        //grayscale
        'white'     : [37, 39],
        'grey'      : [90, 39],
        'black'     : [90, 39],
        //colors
        'blue'      : [34, 39],
        'cyan'      : [36, 39],
        'green'     : [32, 39],
        'magenta'   : [35, 39],
        'red'       : [31, 39],
        'yellow'    : [33, 39]
    };
    return '\033[' + styles[style][0] + 'm' + str +
        '\033[' + styles[style][1] + 'm';
}

/**
 * colouredLayout - taken from masylum's fork.
 * same as basicLayout, but with colours.
 */
function colouredLayout (loggingEvent) {
    var timestampLevelAndCategory = colorize('[' + loggingEvent.startTime.toFormattedString() + '] ', 'grey');
    timestampLevelAndCategory += colorize(
        '[' + loggingEvent.level.toString() + '] ', loggingEvent.level.colour
    );
    timestampLevelAndCategory += colorize(loggingEvent.categoryName + ' - ', 'grey');

    var output = timestampLevelAndCategory + loggingEvent.message;

    if (loggingEvent.exception) {
        output += '\n'
        output += timestampLevelAndCategory;
        if (loggingEvent.exception.stack) {
            output += loggingEvent.exception.stack;
        } else {
            output += loggingEvent.exception.name + ': '+loggingEvent.exception.message;
        }
    }
    return output;
}

function messagePassThroughLayout (loggingEvent) {
    return loggingEvent.message;
}

/** 
 * PatternLayout 
 * Takes a pattern string and returns a layout function.
 * @author Stephan Strittmatter
 */
function patternLayout (pattern) {
    var TTCC_CONVERSION_PATTERN  = "%r %p %c - %m%n";
    var regex = /%(-?[0-9]+)?(\.?[0-9]+)?([cdmnpr%])(\{([^\}]+)\})?|([^%]+)/;
    
    pattern = pattern || patternLayout.TTCC_CONVERSION_PATTERN;
    
    return function(loggingEvent) {
	var formattedString = "";
	var result;
	var searchString = this.pattern;

	while ((result = regex.exec(searchString))) {
	    var matchedString = result[0];
	    var padding = result[1];
	    var truncation = result[2];
	    var conversionCharacter = result[3];
	    var specifier = result[5];
	    var text = result[6];

	    // Check if the pattern matched was just normal text
	    if (text) {
		formattedString += "" + text;
	    } else {
		// Create a raw replacement string based on the conversion
		// character and specifier
		var replacement = "";
		switch(conversionCharacter) {
		case "c":
		    var loggerName = loggingEvent.categoryName;
		    if (specifier) {
			var precision = parseInt(specifier, 10);
			var loggerNameBits = loggingEvent.categoryName.split(".");
			if (precision >= loggerNameBits.length) {
			    replacement = loggerName;
			} else {
			    replacement = loggerNameBits.slice(loggerNameBits.length - precision).join(".");
			}
		    } else {
			replacement = loggerName;
		    }
		    break;
		case "d":
		    var dateFormat = Date.ISO8601_FORMAT;
		    if (specifier) {
			dateFormat = specifier;
			// Pick up special cases
			if (dateFormat == "ISO8601") {
			    dateFormat = Date.ISO8601_FORMAT;
			} else if (dateFormat == "ABSOLUTE") {
			    dateFormat = Date.ABSOLUTETIME_FORMAT;
			} else if (dateFormat == "DATE") {
			    dateFormat = Date.DATETIME_FORMAT;
			}
		    }
		    // Format the date
		    replacement = loggingEvent.startTime.toFormattedString(dateFormat);
		    break;
		case "m":
		    replacement = loggingEvent.message;
		    break;
		case "n":
		    replacement = "\n";
		    break;
		case "p":
		    replacement = loggingEvent.level.toString();
		    break;
		case "r":
		    replacement = "" + loggingEvent.startTime.toLocaleTimeString(); 
		    break;
		case "%":
		    replacement = "%";
		    break;
		default:
		    replacement = matchedString;
		    break;
		}
		// Format the replacement according to any padding or
		// truncation specified

		var len;

		// First, truncation
		if (truncation) {
		    len = parseInt(truncation.substr(1), 10);
		    replacement = replacement.substring(0, len);
		}
		// Next, padding
		if (padding) {
		    if (padding.charAt(0) == "-") {
			len = parseInt(padding.substr(1), 10);
			// Right pad with spaces
			while (replacement.length < len) {
			    replacement += " ";
			}
		    } else {
			len = parseInt(padding, 10);
			// Left pad with spaces
			while (replacement.length < len) {
			    replacement = " " + replacement;
			}
		    }
		}
		formattedString += replacement;
	    }
	    searchString = searchString.substr(result.index + result[0].length);
	}
	return formattedString;
    };

};


module.exports = function (fileSystem, standardOutput, configPaths) {
    var fs = fileSystem || require('fs'),
    standardOutput = standardOutput || sys.puts,
    configPaths = configPaths || require.paths;


    function consoleAppender (layout) {
	layout = layout || colouredLayout;
	return function(loggingEvent) {
	    standardOutput(layout(loggingEvent));
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
	layout = layout || basicLayout;	
	//syncs are generally bad, but we need 
	//the file to be open before we start doing any writing.
	var logFile = fs.openSync(file, 'a', 0644);

        if (logSize > 0) {
            setupLogRolling(logFile, file, logSize, numBackups || 5, (filePollInterval * 1000) || 30000);
        }
	
	return function(loggingEvent) {
	    fs.write(logFile, layout(loggingEvent)+'\n', null, "utf8");
	};
    }

    function setupLogRolling (logFile, filename, logSize, numBackups, filePollInterval) {
        fs.watchFile(filename, 
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
        //doing all of this fs stuff sync, because I don't want to lose any log events.
        //first close the current one.
        fs.closeSync(logFile);
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
        logFile = fs.openSync(filename, 'a', 0644);
    }

    function fileExists (filename) {
        try {
            fs.statSync(filename);
            return true;
        } catch (e) {
            return false;
        }
    }

    function configure (configurationFileOrObject) {
	var config = configurationFileOrObject;
	if (typeof(config) === "string") {
	    config = JSON.parse(fs.readFileSync(config, "utf8"));
        }
	if (config) {
	    try {
		configureAppenders(config.appenders, fileAppender, consoleAppender);
		configureLevels(config.levels);
            } catch (e) {
		throw new Error("Problem reading log4js config " + sys.inspect(config) + ". Error was \"" + e.message + "\" ("+e.stack+")");
            }
	}
    }

    function findConfiguration() {
        //add current directory onto the list of configPaths
        var paths = ['.'].concat(configPaths);
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

    function replaceConsole(logger) {
        function replaceWith (fn) {
            return function() {
                fn.apply(logger, arguments);
            }
        }
 
        console.log = replaceWith(logger.info);
        console.debug = replaceWith(logger.debug);
        console.trace = replaceWith(logger.trace);
        console.info = replaceWith(logger.info);
        console.warn = replaceWith(logger.warn);
        console.error = replaceWith(logger.error);

    }

    //do we already have appenders?
    if (!appenders.count) {
	//set ourselves up if we can find a default log4js.json
	configure(findConfiguration());
	//replace console.log, etc with log4js versions
	//disabling this (17/04/11 - GJ), as console.log does fancy formatting that this breaks
	//replaceConsole(getLogger("console"));
    }

    var thismodule = {
	getLogger: getLogger,
	getDefaultLogger: getDefaultLogger,

	addAppender: addAppender,
	clearAppenders: clearAppenders,
	configure: configure,
	
	levels: levels,

	consoleAppender: consoleAppender,
	fileAppender: fileAppender,
	logLevelFilter: logLevelFilter,
	
	basicLayout: basicLayout,
	messagePassThroughLayout: messagePassThroughLayout,
	patternLayout: patternLayout,
        colouredLayout: colouredLayout,
        coloredLayout: colouredLayout,
    };
    thismodule.connectLogger = require('./connect-logger')(thismodule).connectLogger;
	
    return thismodule;
}


Date.ISO8601_FORMAT = "yyyy-MM-dd hh:mm:ss.SSS";
Date.ISO8601_WITH_TZ_OFFSET_FORMAT = "yyyy-MM-ddThh:mm:ssO";
Date.DATETIME_FORMAT = "dd MMM YYYY hh:mm:ss.SSS";
Date.ABSOLUTETIME_FORMAT = "hh:mm:ss.SSS";

Date.prototype.toFormattedString = function(format) {
    format = format || Date.ISO8601_FORMAT;

    var vDay = addZero(this.getDate());
    var vMonth = addZero(this.getMonth()+1);
    var vYearLong = addZero(this.getFullYear());
    var vYearShort = addZero(this.getFullYear().toString().substring(3,4));
    var vYear = (format.indexOf("yyyy") > -1 ? vYearLong : vYearShort);
    var vHour  = addZero(this.getHours());
    var vMinute = addZero(this.getMinutes());
    var vSecond = addZero(this.getSeconds());
    var vMillisecond = padWithZeros(this.getMilliseconds(), 3);
    var vTimeZone = offset(this);
    var formatted = format
                      .replace(/dd/g, vDay)
                      .replace(/MM/g, vMonth)
                      .replace(/y{1,4}/g, vYear)
                      .replace(/hh/g, vHour)
                      .replace(/mm/g, vMinute)
                      .replace(/ss/g, vSecond)
                      .replace(/SSS/g, vMillisecond)
                      .replace(/O/g, vTimeZone);
    return formatted;
  
    function padWithZeros(vNumber, width) {
	var numAsString = vNumber + "";
	while (numAsString.length < width) {
	    numAsString = "0" + numAsString;
	}
	return numAsString;
    }
      
    function addZero(vNumber) {
	return padWithZeros(vNumber, 2);
    }
	
    /**
     * Formats the TimeOffest
     * Thanks to http://www.svendtofte.com/code/date_format/
     * @private
     */
    function offset(date) {
	// Difference to Greenwich time (GMT) in hours
	var os = Math.abs(date.getTimezoneOffset());
	var h = String(Math.floor(os/60));
	var m = String(os%60);
	h.length == 1? h = "0"+h:1;
	m.length == 1? m = "0"+m:1;
	return date.getTimezoneOffset() < 0 ? "+"+h+m : "-"+h+m;
    }
};

