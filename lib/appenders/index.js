const path = require('path');
const debug = require('debug')('log4js:appenders');
const configuration = require('../configuration');
const clustering = require('../clustering');
const levels = require('../levels');
const layouts = require('../layouts');
const adapters = require('./adapters');

// pre-load the core appenders so that webpack can find them
const coreAppenders = new Map();
coreAppenders.set('console', require('./console'));
coreAppenders.set('stdout', require('./stdout'));
coreAppenders.set('stderr', require('./stderr'));
coreAppenders.set('logLevelFilter', require('./logLevelFilter'));
coreAppenders.set('categoryFilter', require('./categoryFilter'));
coreAppenders.set('noLogFilter', require('./noLogFilter'));
coreAppenders.set('recording', require('./recording'));
coreAppenders.set('file', require('./file'));
coreAppenders.set('dateFile', require('./dateFile'));
coreAppenders.set('multiFile', require('./multiFile'));
coreAppenders.set('multiprocess', require('./multiprocess'));
coreAppenders.set('fileSync', require('./fileSync'));
coreAppenders.set('tcp', require('./tcp'));
coreAppenders.set('tcp-server', require('./tcp-server'));

const appenders = new Map();

const tryLoading = (modulePath, config) => {
  let resolvedPath;
  try {
    const modulePathCJS = `${modulePath}.cjs`;
    resolvedPath = require.resolve(modulePathCJS);
    debug('Loading module from ', modulePathCJS);
  } catch (e) {
    resolvedPath = modulePath;
    debug('Loading module from ', modulePath);
  }
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(resolvedPath);
  } catch (e) {
    // if the module was found, and we still got an error, then raise it
    configuration.throwExceptionIf(
      config,
      e.code !== 'MODULE_NOT_FOUND',
      `appender "${modulePath}" could not be loaded (error was: ${e})`
    );
    return undefined;
  }
};

const loadAppenderModule = (type, config) =>
  coreAppenders.get(type) ||
  tryLoading(`./${type}`, config) ||
  tryLoading(type, config) ||
  (require.main &&
    require.main.filename &&
    tryLoading(path.join(path.dirname(require.main.filename), type), config)) ||
  tryLoading(path.join(process.cwd(), type), config);

const appendersLoading = new Set();

const getAppender = (name, config) => {
  if (appenders.has(name)) return appenders.get(name);
  if (!config.appenders[name]) return false;
  if (appendersLoading.has(name))
    throw new Error(`Dependency loop detected for appender ${name}.`);
  appendersLoading.add(name);

  debug(`Creating appender ${name}`);
  // eslint-disable-next-line no-use-before-define
  const appender = createAppender(name, config);
  appendersLoading.delete(name);
  appenders.set(name, appender);
  return appender;
};

const createAppender = (name, config) => {
  const appenderConfig = config.appenders[name];
  const appenderModule = appenderConfig.type.configure
    ? appenderConfig.type
    : loadAppenderModule(appenderConfig.type, config);
  configuration.throwExceptionIf(
    config,
    configuration.not(appenderModule),
    `appender "${name}" is not valid (type "${appenderConfig.type}" could not be found)`
  );
  if (appenderModule.appender) {
    process.emitWarning(
      `Appender ${appenderConfig.type} exports an appender function.`,
      'DeprecationWarning',
      'log4js-node-DEP0001'
    );
    debug(
      '[log4js-node-DEP0001]',
      `DEPRECATION: Appender ${appenderConfig.type} exports an appender function.`
    );
  }
  if (appenderModule.shutdown) {
    process.emitWarning(
      `Appender ${appenderConfig.type} exports a shutdown function.`,
      'DeprecationWarning',
      'log4js-node-DEP0002'
    );
    debug(
      '[log4js-node-DEP0002]',
      `DEPRECATION: Appender ${appenderConfig.type} exports a shutdown function.`
    );
  }

  debug(`${name}: clustering.isMaster ? ${clustering.isMaster()}`);
  debug(
    // eslint-disable-next-line global-require
    `${name}: appenderModule is ${require('util').inspect(appenderModule)}`
  );
  return clustering.onlyOnMaster(
    () => {
      debug(
        `calling appenderModule.configure for ${name} / ${appenderConfig.type}`
      );
      return appenderModule.configure(
        adapters.modifyConfig(appenderConfig),
        layouts,
        (appender) => getAppender(appender, config),
        levels
      );
    },
    /* istanbul ignore next: fn never gets called by non-master yet needed to pass config validation */ () => {}
  );
};

const setup = (config) => {
  appenders.clear();
  appendersLoading.clear();
  if (!config) {
    return;
  }

  const usedAppenders = [];
  Object.values(config.categories).forEach((category) => {
    usedAppenders.push(...category.appenders);
  });
  Object.keys(config.appenders).forEach((name) => {
    // dodgy hard-coding of special case for tcp-server and multiprocess which may not have
    // any categories associated with it, but needs to be started up anyway
    if (
      usedAppenders.includes(name) ||
      config.appenders[name].type === 'tcp-server' ||
      config.appenders[name].type === 'multiprocess'
    ) {
      getAppender(name, config);
    }
  });
};

const init = () => {
  setup();
};
init();

configuration.addListener((config) => {
  configuration.throwExceptionIf(
    config,
    configuration.not(configuration.anObject(config.appenders)),
    'must have a property "appenders" of type object.'
  );
  const appenderNames = Object.keys(config.appenders);
  configuration.throwExceptionIf(
    config,
    configuration.not(appenderNames.length),
    'must define at least one appender.'
  );

  appenderNames.forEach((name) => {
    configuration.throwExceptionIf(
      config,
      configuration.not(config.appenders[name].type),
      `appender "${name}" is not valid (must be an object with property "type")`
    );
  });
});

configuration.addListener(setup);

module.exports = appenders;
module.exports.init = init;
