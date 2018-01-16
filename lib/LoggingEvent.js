const CircularJSON = require('circular-json');
const levels = require('./levels');

/**
 * @name LoggingEvent
 * @namespace Log4js
 */
class LoggingEvent {
  /**
   * Models a logging event.
   * @constructor
   * @param {String} categoryName name of category
   * @param {Log4js.Level} level level of message
   * @param {Array} data objects to log
   * @author Seth Chisamore
   */
  constructor(categoryName, level, data, context) {
    this.startTime = new Date();
    this.categoryName = categoryName;
    this.data = data;
    this.level = level;
    this.context = Object.assign({}, context);
    this.pid = process.pid;
    // if (cluster && cluster.isWorker) {
    //   this.cluster = {
    //     workerId: cluster.worker.id,
    //     worker: process.pid
    //   };
    // }
  }

  serialise() {
    // JSON.stringify(new Error('test')) returns {}, which is not really useful for us.
    // The following allows us to serialize errors correctly.
    // Validate that we really are in this case
    try {
      const logData = this.data.map((e) => {
        if (e && e.stack && CircularJSON.stringify(e) === '{}') {
          e = { message: e.message, stack: e.stack };
        }
        return e;
      });
      this.data = logData;
      return CircularJSON.stringify(this);
    } catch (e) {
      return new LoggingEvent(
        'log4js',
        levels.ERROR,
        ['Unable to serialise log event due to :', e]
      ).serialise();
    }
  }

  static deserialise(serialised) {
    let event;
    try {
      event = CircularJSON.parse(serialised);
      event.startTime = new Date(event.startTime);
      event.level = levels.getLevel(event.level.levelStr);
      event.data = event.data.map((e) => {
        if (e && e.stack) {
          const fakeError = new Error(e.message);
          fakeError.stack = e.stack;
          e = fakeError;
        }
        return e;
      });
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
