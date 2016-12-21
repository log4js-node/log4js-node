'use strict';

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
      otherLevel = toLevel(otherLevel);
    }
    return this.level <= otherLevel.level;
  }

  isGreaterThanOrEqualTo(otherLevel) {
    if (typeof otherLevel === 'string') {
      otherLevel = toLevel(otherLevel);
    }
    return this.level >= otherLevel.level;
  }

  isEqualTo(otherLevel) {
    if (typeof otherLevel === 'string') {
      otherLevel = toLevel(otherLevel);
    }
    return this.level === otherLevel.level;
  }

}

/**
 * converts given String to corresponding Level
 * @param {Level|String} sArg -- String value of Level OR Log4js.Level
 * @param {Level} [defaultLevel] -- default Level, if no String representation
 * @return {Level}
 */
function toLevel(sArg, defaultLevel) {
  if (!sArg) {
    return defaultLevel;
  }

  if (sArg instanceof Level) {
    module.exports[sArg.toString()] = sArg;
    return sArg;
  }

  if (typeof sArg === 'string') {
    return module.exports[sArg.toUpperCase()] || defaultLevel;
  }

  return toLevel(sArg.toString());
}

function getLevel(levelStr) {
  let level;
  if (typeof levelStr === 'string') {
    const levelUpper = levelStr.toUpperCase();
    level = toLevel(levelUpper);
  }
  return level;
}

module.exports = {
  ALL: new Level(Number.MIN_VALUE, 'ALL'),
  TRACE: new Level(5000, 'TRACE'),
  DEBUG: new Level(10000, 'DEBUG'),
  INFO: new Level(20000, 'INFO'),
  WARN: new Level(30000, 'WARN'),
  ERROR: new Level(40000, 'ERROR'),
  FATAL: new Level(50000, 'FATAL'),
  MARK: new Level(9007199254740992, 'MARK'), // 2^53
  OFF: new Level(Number.MAX_VALUE, 'OFF'),
  toLevel: toLevel,
  Level: Level,
  getLevel: getLevel
};
