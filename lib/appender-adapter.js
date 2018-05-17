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
  const unit = maxLogSize.substr(maxLogSize.length - 1).toLocaleUpperCase();
  const value = maxLogSize.substring(0, maxLogSize.length - 1).trim();

  if (validUnit.indexOf(unit) < 0 || !Number.isInteger(Number(value))) {
    throw Error(`maxLogSize: "${maxLogSize}" is invalid`);
  } else {
    return value * units[unit];
  }
}

function adapter(configAdapter, config) {
  Object.keys(configAdapter).forEach((key) => {
    if (config[key]) {
      config[key] = configAdapter[key](config[key]);
    }
  });
}

function fileAppenderAdapter(config) {
  const configAdapter = {
    maxLogSize: maxFileSizeUnitTransform
  };
  adapter(configAdapter, config);
}

function fileSyncAppenderAdapter(config) {
  const configAdapter = {
    maxLogSize: maxFileSizeUnitTransform
  };
  adapter(configAdapter, config);
}

const appenderAdapter = {
  file: fileAppenderAdapter,
  fileSync: fileSyncAppenderAdapter
};

module.exports = appenderAdapter;
