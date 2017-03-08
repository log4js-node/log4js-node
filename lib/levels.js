'use strict';

module.exports = function (customLevels) {
  /**
   * @name Level
   * @namespace Log4js
   */
  class Level {
    constructor(level, levelStr) {
      this.level = level;
      this.levelStr = levelStr;
    }

    toString() {
      return this.levelStr;
    }

    isLessThanOrEqualTo(otherLevel) {
      if (typeof otherLevel === 'string') {
        otherLevel = getLevel(otherLevel);
      }
      return this.level <= otherLevel.level;
    }

    isGreaterThanOrEqualTo(otherLevel) {
      if (typeof otherLevel === 'string') {
        otherLevel = getLevel(otherLevel);
      }
      return this.level >= otherLevel.level;
    }

    isEqualTo(otherLevel) {
      if (typeof otherLevel === 'string') {
        otherLevel = getLevel(otherLevel);
      }
      return this.level === otherLevel.level;
    }

  }

  const defaultLevels = {
    ALL: new Level(Number.MIN_VALUE, 'ALL'),
    TRACE: new Level(5000, 'TRACE'),
    DEBUG: new Level(10000, 'DEBUG'),
    INFO: new Level(20000, 'INFO'),
    WARN: new Level(30000, 'WARN'),
    ERROR: new Level(40000, 'ERROR'),
    FATAL: new Level(50000, 'FATAL'),
    MARK: new Level(9007199254740992, 'MARK'), // 2^53
    OFF: new Level(Number.MAX_VALUE, 'OFF')
  };

  if (customLevels) {
    const levels = Object.keys(customLevels);
    levels.forEach((l) => {
      defaultLevels[l.toUpperCase()] = new Level(customLevels[l], l.toUpperCase());
    });
  }

  /**
   * converts given String to corresponding Level
   * @param {Level|String} sArg -- String value of Level OR Log4js.Level
   * @param {Level} [defaultLevel] -- default Level, if no String representation
   * @return {Level}
   */
  function getLevel(sArg, defaultLevel) {
    if (!sArg) {
      return defaultLevel;
    }

    if (sArg instanceof Level) {
      return sArg;
    }

    if (typeof sArg === 'string') {
      return defaultLevels[sArg.toUpperCase()] || defaultLevel;
    }

    return getLevel(sArg.toString());
  }

  const orderedLevels = Object.keys(defaultLevels).sort((a, b) => b.level - a.level);
  defaultLevels.getLevel = getLevel;
  defaultLevels.levels = orderedLevels;

  return defaultLevels;
};
