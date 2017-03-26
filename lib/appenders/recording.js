'use strict';

const debug = require('debug')('log4js:recording');

let recordedEvents = [];

function configure() {
  return function (logEvent) {
    debug(`received logEvent, number of events now ${recordedEvents.length + 1}`);
    recordedEvents.push(logEvent);
  };
}

function replay() {
  return recordedEvents;
}

function reset() {
  recordedEvents = [];
}

module.exports = {
  configure: configure,
  replay: replay,
  playback: replay,
  reset: reset,
  erase: reset
};
