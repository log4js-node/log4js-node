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
function toLevel(sArg, defaultLevel) {

    if (sArg === null) {
	return defaultLevel;
    }

    if (typeof sArg == "string") {
	var s = sArg.toUpperCase();
	if (module.exports[s]) {
	    return module.exports[s];
	}
    }
    return defaultLevel;
};

Level.prototype.toString = function() {
    return this.levelStr;
};

Level.prototype.isLessThanOrEqualTo = function(otherLevel) {
    if (typeof otherLevel === "string") {
        otherLevel = Level.toLevel(otherLevel);
    }
    return this.level <= otherLevel.level;
};

Level.prototype.isGreaterThanOrEqualTo = function(otherLevel) {
    if (typeof otherLevel === "string") {
        otherLevel = Level.toLevel(otherLevel);
    }
    return this.level >= otherLevel.level;
};

module.exports = {
    ALL: new Level(Number.MIN_VALUE, "ALL", "grey")
  , TRACE: new Level(5000, "TRACE", "blue")
  , DEBUG: new Level(10000, "DEBUG", "cyan")
  , INFO: new Level(20000, "INFO", "green")
  , WARN: new Level(30000, "WARN", "yellow")
  , ERROR: new Level(40000, "ERROR", "red")
  , FATAL: new Level(50000, "FATAL", "magenta")
  , OFF: new Level(Number.MAX_VALUE, "OFF", "grey")
  , toLevel: toLevel
};
