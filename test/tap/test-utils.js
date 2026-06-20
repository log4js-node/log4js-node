const osDelay = process.platform === 'win32' ? 500 : 200;

module.exports = {
  osDelay,
};
