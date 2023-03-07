/* istanbul ignore file */
// This is used in browsers only and is designed to allow the rest of
// log4js to continue as if `clustering.js` is in use.
const isMaster = () => true;

const listeners = [];

const sendToListeners = (logEvent) => {
  listeners.forEach((l) => l(logEvent));
};

module.exports = {
  onlyOnMaster: (fn, notMaster) => (isMaster() ? fn() : notMaster),
  isMaster,
  send: sendToListeners,
  onMessage: (listener) => {
    listeners.push(listener);
  },
};
