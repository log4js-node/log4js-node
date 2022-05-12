function maxFileSizeUnitTransform(maxLogSize) {
  if (typeof maxLogSize === 'number' && Number.isInteger(maxLogSize)) {
    return maxLogSize;
  }

  const units = {
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
  };
  const validUnit = Object.keys(units);
  const unit = maxLogSize.slice(-1).toLocaleUpperCase();
  const value = maxLogSize.slice(0, -1).trim();

  if (validUnit.indexOf(unit) < 0 || !Number.isInteger(Number(value))) {
    throw Error(`maxLogSize: "${maxLogSize}" is invalid`);
  } else {
    return value * units[unit];
  }
}

function adapter(configAdapter, config) {
  const newConfig = Object.assign({}, config); // eslint-disable-line prefer-object-spread
  Object.keys(configAdapter).forEach((key) => {
    if (newConfig[key]) {
      newConfig[key] = configAdapter[key](config[key]);
    }
  });
  return newConfig;
}

function fileAppenderAdapter(config) {
  const configAdapter = {
    maxLogSize: maxFileSizeUnitTransform
  };
  return adapter(configAdapter, config);
}

const adapters = {
  dateFile: fileAppenderAdapter,
  file: fileAppenderAdapter,
  fileSync: fileAppenderAdapter
};

module.exports.modifyConfig = config => (adapters[config.type] ? adapters[config.type](config) : config);
