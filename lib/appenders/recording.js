'use strict';

let recordedEvents = [];

function configure() {
  return function (logEvent) {
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
  reset: reset
};
