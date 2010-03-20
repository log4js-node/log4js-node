var fs = require('fs'), sys = require('sys');
var DEFAULT_CATEGORY = '[default]';
var ALL_CATEGORIES = '[all]';

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
 *  var logging = require('log4js-node');
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
var log4js = {
	
	/** 
	 * Current version of log4js-node. 
	 * @static
	 * @final
	 */
  	version: "0.1.0",

	/**  
	 * Date of logger initialized.
	 * @static
	 * @final
	 */
	applicationStartDate: new Date(),
		
	/**  
	 * Hashtable of loggers.
	 * @static
	 * @final
	 * @private  
	 */
	loggers: {},
  
  appenders: {},
  
	/**
	 * Get a logger instance. Instance is cached on categoryName level.
	 * @param  {String} categoryName name of category to log to.
	 * @return {Logger} instance of logger for the category
	 * @static
	 */
	getLogger: function(categoryName) {
		
		// Use default logger if categoryName is not specified or invalid
		if (!(typeof categoryName == "string")) {
			categoryName = DEFAULT_CATEGORY;
		}

    var self = this, appenderList;
		if (!this.loggers[categoryName]) {
			// Create the logger for this name if it doesn't already exist
			this.loggers[categoryName] = new Logger(categoryName);
      if (this.appenders[categoryName]) {
        appenderList = this.appenders[categoryName];
        appenderList.forEach(function(appender) {
          self.loggers[categoryName].addListener("log", appender);
        });
      }
      if (this.appenders[ALL_CATEGORIES]) {
        appenderList = this.appenders[ALL_CATEGORIES];
        appenderList.forEach(function(appender) {
          self.loggers[categoryName].addListener("log", appender);
        });
      }
		}
		
		return this.loggers[categoryName];
	},
	
	/**
	 * Get the default logger instance.
	 * @return {Logger} instance of default logger
	 * @static
	 */
	getDefaultLogger: function() {
		return this.getLogger(DEFAULT_CATEGORY); 
	},
  
  addAppender: function (appender, categoryName) {
    var category = categoryName || ALL_CATEGORIES;
    if (!this.appenders[category]) {
      this.appenders[category] = [];
    }
    this.appenders[category].push(appender);
    
    if (category === ALL_CATEGORIES) {
      for (var logger in this.loggers) {
        if (this.loggers.hasOwnProperty(logger)) {
          this.loggers[logger].addListener("log", appender);
        }
      }
    } else if (this.loggers[category]) {
      this.loggers[category].addListener("log", appender);
    }
    
  },
  
  clearAppenders: function() {
    this.appenders = [];
    for (var logger in this.loggers) {
      if (this.loggers.hasOwnProperty(logger)) {
        this.loggers[logger].listeners.length = 0;
      }
    }
  },
  
  configure: function(configurationFile) {
    var config = JSON.parse(fs.readFileSync(configurationFile));
    configureAppenders(config.appenders);
    configureLevels(config.levels);
  },
  
  levels: {
    ALL: new Level(Number.MIN_VALUE, "ALL"),
		TRACE: new Level(5000, "TRACE"),
		DEBUG: new Level(10000, "DEBUG"),
    INFO: new Level(20000, "INFO"),
		WARN: new Level(30000, "WARN"),
		ERROR: new Level(40000, "ERROR"),
		FATAL: new Level(50000, "FATAL"),
		OFF: new Level(Number.MAX_VALUE, "OFF")
  }
  
};

var appenderMakers = {
  "file": function(config) {
    var layout;
    if (config.layout) {
      layout = layoutMakers[config.layout.type](config.layout);
    }
    return fileAppender(config.filename, layout);
  },
  "console": function(config) {
    var layout;
    if (config.layout) {
      layout = layoutMakers[config.layout.type](config.layout);
    }
    return consoleAppender(layout);
  },
  "logLevelFilter": function(config) {
    var appender = appenderMakers[config.appender.type](config.appender);
    return logLevelFilter(config.level, appender);
  }
};

var layoutMakers = {
  "messagePassThrough": function() { return messagePassThroughLayout; },
  "basic": function() { return basicLayout; },
  "pattern": function (config) {
    var pattern = config.pattern || undefined;
    return patternLayout(pattern);
  }
};

function configureAppender(appenderConfig) {
}

function configureAppenders(appenderList) {
  log4js.clearAppenders();
  if (appenderList) {
    appenderList.forEach(function(appenderConfig) {
      var appender = appenderMakers[appenderConfig.type](appenderConfig);
      if (appender) {
        log4js.addAppender(appender, appenderConfig.category);    
      } else {
        throw new Error("log4js configuration problem for "+sys.inspect(appenderConfig));
      }
    });
  } else {
    log4js.addAppender(consoleAppender);
  }
}

function configureLevels(levels) {
  if (levels) {
    for (var category in levels) {
      if (levels.hasOwnProperty(category)) {
        log4js.getLogger(category).setLevel(levels[category]);
      }
    }
  }
} 


/**
 * Log4js.Level Enumeration. Do not use directly. Use static objects instead.
 * @constructor
 * @param {Number} level number of level
 * @param {String} levelString String representation of level
 * @private
 */
function Level(level, levelStr) {
	this.level = level;
	this.levelStr = levelStr;
};

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
    if (log4js.levels[s]) {
      return log4js.levels[s];
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
LoggingEvent = function(categoryName, level, message, exception, logger) {
	/**
	 * the timestamp of the Logging Event
	 * @type Date
	 * @private
	 */
	this.startTime = new Date();
	/**
	 * category of event
	 * @type String
	 * @private
	 */
	this.categoryName = categoryName;
	/**
	 * the logging message
	 * @type String
	 * @private
	 */
	this.message = message;
	/**
	 * the logging exception
	 * @type Exception
	 * @private
	 */
	this.exception = exception;
	/**
	 * level of log
	 * @type Log4js.Level
	 * @private
	 */
	this.level = level;
	/**
	 * reference to logger
	 * @type Log4js.Logger
	 * @private
	 */
	this.logger = logger;
};

/**
 * Logger to log messages.
 * use {@see Log4js#getLogger(String)} to get an instance.
 * @constructor
 * @param name name of category to log to
 * @author Stephan Strittmatter
 */
Logger = function(name, level) {
	this.category = name || DEFAULT_CATEGORY;
	this.level = Level.toLevel(level, log4js.levels.TRACE);
};

sys.inherits(Logger, process.EventEmitter);

Logger.prototype.setLevel = function(level) {
  this.level = Level.toLevel(level, log4js.levels.TRACE);
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
	
consoleAppender = function (layout) {
  layout = layout || basicLayout;
  return function(loggingEvent) {
    sys.puts(layout(loggingEvent));
  };  
};

/**
 * File Appender writing the logs to a text file.
 * 
 * @param file file log messages will be written to
 * @param layout a function that takes a logevent and returns a string (defaults to basicLayout).
 */
fileAppender = function(file, layout) {
	layout = layout || basicLayout;	
	file = file || "log4js.log";	
  //syncs are generally bad, but we need 
  //the file to be open before we start doing any writing.
  var logFile = fs.openSync(file, process.O_APPEND | process.O_WRONLY | process.O_CREAT, 0644);    
  //register ourselves as listeners for shutdown
  //so that we can close the file.
  //not entirely sure this is necessary, but still.
  process.addListener("exit", function() { fs.close(logFile); });
  
  return function(loggingEvent) {
    fs.write(logFile, layout(loggingEvent)+'\n', null, "utf-8");
  };
};

logLevelFilter = function(levelString, appender) {
  var level = Level.toLevel(levelString);
  return function(logEvent) {
    if (logEvent.level.isGreaterThanOrEqualTo(level)) {
      appender(logEvent);
    }
  }
};

/**
 * BasicLayout is a simple layout for storing the logs. The logs are stored
 * in following format:
 * <pre>
 * [startTime] [logLevel] categoryName - message\n
 * </pre>
 *
 * @author Stephan Strittmatter
 */
basicLayout = function(loggingEvent) {
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
};

messagePassThroughLayout = function(loggingEvent) {
  return loggingEvent.message;
};

/** 
 * PatternLayout 
 * Takes a pattern string and returns a layout function.
 * @author Stephan Strittmatter
 */
patternLayout = function(pattern) {
  pattern = pattern || patternLayout.DEFAULT_CONVERSION_PATTERN;
	var regex = /%(-?[0-9]+)?(\.?[0-9]+)?([cdmnpr%])(\{([^\}]+)\})?|([^%]+)/;
  
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
						replacement = "" + loggingEvent.startTime.toLocaleTimeString(); //TODO: .getDifference(Log4js.applicationStartDate);
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

patternLayout.TTCC_CONVERSION_PATTERN = "%r %p %c - %m%n";
patternLayout.DEFAULT_CONVERSION_PATTERN = "%m%n";

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

log4js.consoleAppender = consoleAppender;
log4js.fileAppender = fileAppender;
log4js.logLevelFilter = logLevelFilter;
log4js.basicLayout = basicLayout;
log4js.patternLayout = patternLayout;
log4js.messagePassThroughLayout = messagePassThroughLayout;

process.mixin(exports,log4js);
