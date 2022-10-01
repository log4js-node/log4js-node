/* eslint no-underscore-dangle: ["error", { "allow": ["_log"] }] */

const debug = require('debug')('log4js:logger');
const LoggingEvent = require('./LoggingEvent');
const levels = require('./levels');
const clustering = require('./clustering');
const categories = require('./categories');
const configuration = require('./configuration');

const stackReg = /at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/;
/**
 * The top entry is the Error
 */
const baseCallStackSkip = 1;
/**
 * The _log function is 3 levels deep, we need to skip those to make it to the callSite
 */
const defaultErrorCallStackSkip = 3;

/**
 *
 * @param {Error} data
 * @param {number} skipIdx
 * @returns {import('../types/log4js').CallStack | null}
 */
function defaultParseCallStack(
  data,
  skipIdx = defaultErrorCallStackSkip + baseCallStackSkip
) {
  try {
    const stacklines = data.stack.split('\n').slice(skipIdx);
    if (!stacklines.length) {
      // There's no stack in this stack
      // Should we try a previous index if skipIdx was set?
      return null;
    }
    const lineMatch = stackReg.exec(stacklines[0]);
    /* istanbul ignore else: failsafe */
    if (lineMatch && lineMatch.length === 6) {
      // extract class, function and alias names
      let className = '';
      let functionName = '';
      let functionAlias = '';
      if (lineMatch[1] && lineMatch[1] !== '') {
        // WARN: this will unset alias if alias is not present.
        [functionName, functionAlias] = lineMatch[1]
          .replace(/[[\]]/g, '')
          .split(' as ');
        functionAlias = functionAlias || '';

        if (functionName.includes('.'))
          [className, functionName] = functionName.split('.');
      }

      return {
        fileName: lineMatch[2],
        lineNumber: parseInt(lineMatch[3], 10),
        columnNumber: parseInt(lineMatch[4], 10),
        callStack: stacklines.join('\n'),
        className,
        functionName,
        functionAlias,
        callerName: lineMatch[1] || '',
      };
      // eslint-disable-next-line no-else-return
    } else {
      // will never get here unless nodejs has changes to Error
      console.error('log4js.logger - defaultParseCallStack error'); // eslint-disable-line no-console
    }
  } catch (err) {
    // will never get error unless nodejs has breaking changes to Error
    console.error('log4js.logger - defaultParseCallStack error', err); // eslint-disable-line no-console
  }
  return null;
}

/**
 * Logger to log messages.
 * use {@see log4js#getLogger(String)} to get an instance.
 *
 * @name Logger
 * @namespace Log4js
 * @param name name of category to log to
 * @param level - the loglevel for the category
 * @param dispatch - the function which will receive the logevents
 *
 * @author Stephan Strittmatter
 */
class Logger {
  constructor(name) {
    if (!name) {
      throw new Error('No category provided.');
    }
    this.category = name;
    this.context = {};
    /** @private */
    this.callStackSkipIndex = 0;
    /** @private */
    this.parseCallStack = defaultParseCallStack;
    debug(`Logger created (${this.category}, ${this.level})`);
  }

  get level() {
    return levels.getLevel(
      categories.getLevelForCategory(this.category),
      levels.OFF
    );
  }

  set level(level) {
    categories.setLevelForCategory(
      this.category,
      levels.getLevel(level, this.level)
    );
  }

  get useCallStack() {
    return categories.getEnableCallStackForCategory(this.category);
  }

  set useCallStack(bool) {
    categories.setEnableCallStackForCategory(this.category, bool === true);
  }

  get callStackLinesToSkip() {
    return this.callStackSkipIndex;
  }

  set callStackLinesToSkip(number) {
    if (typeof number !== 'number') {
      throw new TypeError('Must be a number');
    }
    if (number < 0) {
      throw new RangeError('Must be >= 0');
    }
    this.callStackSkipIndex = number;
  }

  log(level, ...args) {
    const logLevel = levels.getLevel(level);
    if (!logLevel) {
      if (configuration.validIdentifier(level) && args.length > 0) {
        // logLevel not found but of valid signature, WARN before fallback to INFO
        this.log(
          levels.WARN,
          'log4js:logger.log: valid log-level not found as first parameter given:',
          level
        );
        this.log(levels.INFO, `[${level}]`, ...args);
      } else {
        // apart from fallback, allow .log(...args) to be synonym with .log("INFO", ...args)
        this.log(levels.INFO, level, ...args);
      }
    } else if (this.isLevelEnabled(logLevel)) {
      this._log(logLevel, args);
    }
  }

  isLevelEnabled(otherLevel) {
    return this.level.isLessThanOrEqualTo(otherLevel);
  }

  _log(level, data) {
    debug(`sending log data (${level}) to appenders`);
    const error = data.find((item) => item instanceof Error);
    let callStack;
    if (this.useCallStack) {
      try {
        if (error) {
          callStack = this.parseCallStack(
            error,
            this.callStackSkipIndex + baseCallStackSkip
          );
        }
      } catch (_err) {
        // Ignore Error and use the original method of creating a new Error.
      }
      callStack =
        callStack ||
        this.parseCallStack(
          new Error(),
          this.callStackSkipIndex +
            defaultErrorCallStackSkip +
            baseCallStackSkip
        );
    }
    const loggingEvent = new LoggingEvent(
      this.category,
      level,
      data,
      this.context,
      callStack,
      error
    );
    clustering.send(loggingEvent);
  }

  addContext(key, value) {
    this.context[key] = value;
  }

  removeContext(key) {
    delete this.context[key];
  }

  clearContext() {
    this.context = {};
  }

  setParseCallStackFunction(parseFunction) {
    if (typeof parseFunction === 'function') {
      this.parseCallStack = parseFunction;
    } else if (typeof parseFunction === 'undefined') {
      this.parseCallStack = defaultParseCallStack;
    } else {
      throw new TypeError('Invalid type passed to setParseCallStackFunction');
    }
  }
}

function addLevelMethods(target) {
  const level = levels.getLevel(target);

  const levelStrLower = level.toString().toLowerCase();
  const levelMethod = levelStrLower.replace(/_([a-z])/g, (g) =>
    g[1].toUpperCase()
  );
  const isLevelMethod = levelMethod[0].toUpperCase() + levelMethod.slice(1);

  Logger.prototype[`is${isLevelMethod}Enabled`] = function () {
    return this.isLevelEnabled(level);
  };

  Logger.prototype[levelMethod] = function (...args) {
    this.log(level, ...args);
  };
}

levels.levels.forEach(addLevelMethods);

configuration.addListener(() => {
  levels.levels.forEach(addLevelMethods);
});

module.exports = Logger;
