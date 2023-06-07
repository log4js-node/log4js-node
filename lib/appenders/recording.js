const debug = require('debug')('log4js:recording');

const recordedEvents = [];

function configure(config) {
  return function (logEvent) {
    debug(
      `received logEvent, number of events now ${recordedEvents.length + 1}`
    );
    debug('log event was ', logEvent);
    if (config.maxLength && recordedEvents.length >= config.maxLength) {
      recordedEvents.shift();
    }
    recordedEvents.push(logEvent);
  };
}

function replay() {
  return recordedEvents.slice();
}

function reset() {
  recordedEvents.length = 0;
}

module.exports = {
  configure,
  replay,
  playback: replay,
  reset,
  erase: reset,
};
