const flatted = require('flatted');
const levels = require('./levels');

/**
 * @name LoggingEvent
 * @namespace Log4js
 */
class LoggingEvent {
  /**
   * Models a logging event.
   * @constructor
   * @param {string} categoryName name of category
   * @param {Log4js.Level} level level of message
   * @param {Array} data objects to log
   * @author Seth Chisamore
   */
  constructor(categoryName, level, data, context, location) {
    this.startTime = new Date();
    this.categoryName = categoryName;
    this.data = data;
    this.level = level;
    this.context = Object.assign({}, context); // eslint-disable-line prefer-object-spread
    this.pid = process.pid;

    if (location) {
      this.functionName = location.functionName;
      this.fileName = location.fileName;
      this.lineNumber = location.lineNumber;
      this.columnNumber = location.columnNumber;
      this.callStack = location.callStack;
    }
  }

  serialise() {
    return flatted.stringify(this, (key, value) => {
      // JSON.stringify(new Error('test')) returns {}, which is not really useful for us.
      // The following allows us to serialize errors correctly.
      // duck-typing for Error object
      if (value && value.message && value.stack) {
        // eslint-disable-next-line prefer-object-spread
        value = Object.assign({message: value.message, stack: value.stack}, value);
      }
      // JSON.stringify({a: parseInt('abc'), b: 1/0, c: -1/0}) returns {a: null, b: null, c: null}.
      // The following allows us to serialize to NaN, Infinity and -Infinity correctly.
      else if (typeof value === 'number' && (Number.isNaN(value) || !Number.isFinite(value))) {
        value = value.toString();
      }
      // JSON.stringify([undefined]) returns [null].
      // The following allows us to serialize to undefined correctly.
      else if (typeof value === 'undefined') {
        value = typeof value;
      }
      return value;
    });
  }

  static deserialise(serialised) {
    let event;
    try {
      const rehydratedEvent = flatted.parse(serialised, (key, value) => {
        if (value && value.message && value.stack) {
          const fakeError = new Error(value);
          Object.keys(value).forEach((k) => { fakeError[k] = value[k]; });
          value = fakeError;
        }
        return value;
      });
      rehydratedEvent.location = {
        functionName: rehydratedEvent.functionName,
        fileName: rehydratedEvent.fileName,
        lineNumber: rehydratedEvent.lineNumber,
        columnNumber: rehydratedEvent.columnNumber,
        callStack: rehydratedEvent.callStack
      };
      event = new LoggingEvent(
        rehydratedEvent.categoryName,
        levels.getLevel(rehydratedEvent.level.levelStr),
        rehydratedEvent.data,
        rehydratedEvent.context,
        rehydratedEvent.location
      );
      event.startTime = new Date(rehydratedEvent.startTime);
      event.pid = rehydratedEvent.pid;
      event.cluster = rehydratedEvent.cluster;
    } catch (e) {
      event = new LoggingEvent(
        'log4js',
        levels.ERROR,
        ['Unable to parse log:', serialised, 'because: ', e]
      );
    }

    return event;
  }
}

module.exports = LoggingEvent;
