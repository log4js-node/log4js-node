"use strict";

function Level(level, levelStr) {
  this.level = level;
  this.levelStr = levelStr;
}

/**
 * converts given String to corresponding Level
 * @param {String} sArg String value of Level OR Log4js.Level
 * @param {Log4js.Level} defaultLevel default Level, if no String representation
 * @return Level object
 * @type Log4js.Level
 */
function toLevel(sArg, defaultLevel) {

  if (!sArg) {
    return defaultLevel;
  }

  if (typeof sArg == "string") {
    var s = sArg.toUpperCase();
    if (module.exports[s]) {
      return module.exports[s];
    } else {
      return defaultLevel;
    }
  }

  return toLevel(sArg.toString());
}

Level.prototype.toString = function() {
  return this.levelStr;
};

function convertAndCompare(comparison) {
  return function(otherLevel) {
    if (typeof otherLevel === "string") {
      otherLevel = toLevel(otherLevel);
    }
    return comparison.call(this, otherLevel);
  };
}

Level.prototype.isLessThanOrEqualTo = convertAndCompare(
  function(otherLevel) {
    return this.level <= otherLevel.level;
  }
);

Level.prototype.isGreaterThanOrEqualTo = convertAndCompare(
  function(otherLevel) {
    return this.level >= otherLevel.level;
  }
);

Level.prototype.isEqualTo = convertAndCompare(
  function(otherLevel) {
    return this.level === otherLevel.level;
  }
);


exports.ALL = new Level(Number.MIN_VALUE, "ALL");
exports.TRACE = new Level(5000, "TRACE");
exports.DEBUG = new Level(10000, "DEBUG");
exports.INFO = new Level(20000, "INFO");
exports.WARN = new Level(30000, "WARN");
exports.ERROR = new Level(40000, "ERROR");
exports.FATAL = new Level(50000, "FATAL");
exports.OFF = new Level(Number.MAX_VALUE, "OFF");

exports.levels = [ 
  exports.OFF, 
  exports.TRACE, 
  exports.DEBUG, 
  exports.INFO, 
  exports.WARN, 
  exports.ERROR, 
  exports.FATAL 
];

exports.toLevel = toLevel;
