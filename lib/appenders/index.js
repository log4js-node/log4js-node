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
coreAppenders.set('file', require('./file'));
coreAppenders.set('dateFile', require('./dateFile'));
coreAppenders.set('fileSync', require('./fileSync'));

const appenders = new Map();

const tryLoading = (modulePath, config) => {
  debug('Loading module from ', modulePath);
  try {
    return require(modulePath); //eslint-disable-line
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

const loadAppenderModule = (type, config) => coreAppenders.get(type)
  || tryLoading(`./${type}`, config)
  || tryLoading(type, config)
  || (require.main && tryLoading(path.join(path.dirname(require.main.filename), type), config))
  || tryLoading(path.join(process.cwd(), type), config);

const appendersLoading = new Set();

const getAppender = (name, config) => {
  if (appenders.has(name)) return appenders.get(name);
  if (!config.appenders[name]) return false;
  if (appendersLoading.has(name)) throw new Error(`Dependency loop detected for appender ${name}.`);
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
    ? appenderConfig.type : loadAppenderModule(appenderConfig.type, config);
  configuration.throwExceptionIf(
    config,
    configuration.not(appenderModule),
    `appender "${name}" is not valid (type "${appenderConfig.type}" could not be found)`
  );
  if (appenderModule.appender) {
    debug(`DEPRECATION: Appender ${appenderConfig.type} exports an appender function.`);
  }
  if (appenderModule.shutdown) {
    debug(`DEPRECATION: Appender ${appenderConfig.type} exports a shutdown function.`);
  }

  debug(`${name}: clustering.isMaster ? ${clustering.isMaster()}`);
  debug(`${name}: appenderModule is ${require('util').inspect(appenderModule)}`); // eslint-disable-line
  return clustering.onlyOnMaster(() => {
    debug(`calling appenderModule.configure for ${name} / ${appenderConfig.type}`);
    return appenderModule.configure(
      adapters.modifyConfig(appenderConfig),
      layouts,
      appender => getAppender(appender, config),
      levels
    );
  }, () => { });
};

const setup = (config) => {
  appenders.clear();
  appendersLoading.clear();
  const usedAppenders = [];
  Object.values(config.categories).forEach(category => {
    usedAppenders.push(...category.appenders)
  });
  Object.keys(config.appenders).forEach((name) => {
    // dodgy hard-coding of special case for tcp-server which may not have
    // any categories associated with it, but needs to be started up anyway
    if (usedAppenders.includes(name) || config.appenders[name].type === 'tcp-server') {
      getAppender(name, config);
    }
  });
};

setup({ appenders: { out: { type: 'stdout' } }, categories: { default: { appenders: ['out'], level: 'trace' } } });

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
