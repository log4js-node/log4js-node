"use strict";
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

/**
 * @fileoverview log4js is a library to log in JavaScript in similar manner
 * than in log4j for Java. The API should be nearly the same.
 *
 * <h3>Example:</h3>
 * <pre>
 *  var logging = require('log4js');
 *  logging.configure({
 *    appenders: {
 *      "errorFile": { type: "file", filename: "error.log" }
 *    },
 *    categories: {
 *      "default": { level: "ERROR", appenders: [ "errorFile" ] }
 *    }
 *  });
 *  //get a logger
 *  var log = logging.getLogger("some-category");
 *
 *  ...
 *
 *  //call the log
 *  log.error("oh noes");
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
var debug = require('debug')('log4js:core')
, fs = require('fs')
, cluster = require('cluster')
, util = require('util')
, layouts = require('./layouts')
, levels = require('./levels')
, Logger = require('./logger')
, appenders = {}
, categories = {}
, appenderMakers = {}
, defaultConfig =   {
  appenders: {
    console: { type: "console" }
  },
  categories: {
    default: { level: levels.DEBUG, appenders: [ "console" ] }
  }
};

function serialise(event) {
  return JSON.stringify(event);
}

function deserialise(serialised) {
  var event;
  try {
    event = JSON.parse(serialised);
    event.startTime = new Date(event.startTime);
    event.level = levels.toLevel(event.level.levelStr);
  } catch(e) {
    event = {
      startTime: new Date(),
      category: 'log4js',
      level: levels.ERROR,
      data: [ 'Unable to parse log:', serialised ]
    };
  }

  return event;
}

//in a multi-process node environment, worker loggers will use
//process.send
cluster.on('fork', function(worker) {
  debug('listening to worker: ', worker);
  worker.on('message', function(message) {
    if (message.type && message.type === '::log4js-message') {
      debug("received message: ", message.event);
      dispatch(deserialise(message.event));
    }
  });
});

/**
 * Get a logger instance. 
 * @param  {String} category to log to.
 * @return {Logger} instance of logger for the category
 * @static
 */
function getLogger (category) {
  debug("getLogger(", category, ")");

  return new Logger(
    cluster.isMaster ? dispatch : workerDispatch, 
    category || 'default'
  );
}

function workerDispatch(event) {
  process.send({ type: "::log4js-message", event: serialise(event) });
}

/**
 * Log event routing to appenders
 * This would be a good place to implement category hierarchies/wildcards, etc
 */
function dispatch(event) {
  debug("event is ", event);
  var category = categories[event.category] || categories.default;
  debug(
    "category.level[", 
    category.level, 
    "] <= ", 
    event.level, 
    " ? ", 
    category.level.isLessThanOrEqualTo(event.level)
  );

  if (category.level.isLessThanOrEqualTo(event.level)) {
    category.appenders.forEach(function(appender) {
      appenders[appender](event);
    });
  }
}

function load(file) {
  debug("loading ", file);
  var contents = fs.readFileSync(file, "utf-8");
  debug("file contents ", contents);
  return JSON.parse(contents);
}

function configure(configurationFileOrObject) {
  debug("configure(", configurationFileOrObject, ")");
  debug("process.env.LOG4JS_CONFIG = ", process.env.LOG4JS_CONFIG);

  var filename, config = process.env.LOG4JS_CONFIG || configurationFileOrObject;

  debug("config ", config);

  if (!config || !(typeof config === 'string' || typeof config === 'object')) {
    throw new Error("You must specify configuration as an object or a filename.");
  }

  if (typeof config === 'string') {
    debug("config is string");
    filename = config;
    config = load(filename);
  }

  if (!config.appenders || !Object.keys(config.appenders).length) {
    throw new Error("You must specify at least one appender.");
  }

  configureAppenders(config.appenders);

  validateCategories(config.categories);
  categories = config.categories;

}

function validateCategories(cats) { 
  if (!cats || !cats.default) {
    throw new Error("You must specify an appender for the default category");
  }

  Object.keys(cats).forEach(function(categoryName) {
    var category = cats[categoryName], inputLevel = category.level;
    if (!category.level) {
      throw new Error("You must specify a level for category '" + categoryName + "'.");
    }
    category.level = levels.toLevel(inputLevel);
    if (!category.level) {
      throw new Error(
        "Level '" + inputLevel + 
          "' is not valid for category '" + categoryName + 
          "'. Acceptable values are: " + levels.levels.join(', ') + "."
      );
    }

    if (!category.appenders || !category.appenders.length) {
      throw new Error("You must specify an appender for category '" + categoryName + "'.");
    }

    category.appenders.forEach(function(appender) {
      if (!appenders[appender]) {
        throw new Error(
          "Appender '" + appender + 
            "' for category '" + categoryName + 
            "' does not exist. Known appenders are: " + Object.keys(appenders).join(', ') + "."
        );
      }
    });
  });
}

function clearAppenders () {
  debug("clearing appenders and appender makers");
  appenders = {};
  appenderMakers = {};
}

function appenderByName(name) {
  if (appenders.hasOwnProperty(name)) {
    return appenders[name];
  } else {
    throw new Error("Appender '" + name + "' not found.");
  }
}

function configureAppenders(appenderMap) {
  clearAppenders();
  Object.keys(appenderMap).forEach(function(appenderName) {
    var appender, appenderConfig = appenderMap[appenderName];
    loadAppender(appenderConfig.type);
    try {
      appenders[appenderName] = appenderMakers[appenderConfig.type](
        appenderConfig, 
        appenderByName
      );
    } catch(e) {
      throw new Error(
        "log4js configuration problem for appender '" + appenderName + 
          "'. Error was " + e.stack
      );
    }
  });
}

function loadAppender(appender) {
  var appenderModule;

  if (!appenderMakers[appender]) {
    debug("Loading appender ", appender);
    try {
      appenderModule = require('./appenders/' + appender);
    } catch (e) {
      try {
        debug("Appender ", appender, " is not a core log4js appender.");
        appenderModule = require(appender);
      } catch (err) {
        debug("Error loading appender %s: ", appender, err);
        throw new Error("Could not load appender of type '" + appender + "'.");
      }
    }
    appenderMakers[appender] = appenderModule(layouts, levels);
  }  
}

module.exports = {
  getLogger: getLogger,
  configure: configure
};

//set ourselves up
debug("Starting configuration");
configure(defaultConfig);

