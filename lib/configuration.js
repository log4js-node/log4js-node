'use strict';

const util = require('util');
const path = require('path');
const levels = require('./levels');
const layouts = require('./layouts');
const debug = require('debug')('log4js:configuration');

let cluster;
try {
  cluster = require('cluster'); // eslint-disable-line global-require
} catch (e) {
  debug('Clustering support disabled because require(cluster) threw an error: ', e);
}

const validColours = [
  'white', 'grey', 'black',
  'blue', 'cyan', 'green',
  'magenta', 'red', 'yellow'
];

function not(thing) {
  return !thing;
}

function anObject(thing) {
  return thing && typeof thing === 'object' && !Array.isArray(thing);
}

function validIdentifier(thing) {
  return /^[A-Za-z][A-Za-z0-9_]*$/g.test(thing);
}

function anInteger(thing) {
  return thing && typeof thing === 'number' && Number.isInteger(thing);
}

class Configuration {
  throwExceptionIf(checks, message) {
    const tests = Array.isArray(checks) ? checks : [checks];
    tests.forEach((test) => {
      if (test) {
        throw new Error(`Problem with log4js configuration: (${util.inspect(this.candidate, { depth: 5 })})` +
          ` - ${message}`);
      }
    });
  }

  tryLoading(modulePath) {
    debug('Loading module from ', modulePath);
    try {
      return require(modulePath); //eslint-disable-line
    } catch (e) {
      // if the module was found, and we still got an error, then raise it
      this.throwExceptionIf(
        e.code !== 'MODULE_NOT_FOUND',
        `appender "${path}" could not be loaded (error was: ${e})`
      );
      return undefined;
    }
  }

  loadAppenderModule(type) {
    return this.tryLoading(`./appenders/${type}`) ||
      this.tryLoading(type) ||
      this.tryLoading(path.join(path.dirname(require.main.filename), type)) ||
      this.tryLoading(path.join(process.cwd(), type));
  }

  createAppender(name, config) {
    const appenderModule = this.loadAppenderModule(config.type);
    this.throwExceptionIf(
      not(appenderModule),
      `appender "${name}" is not valid (type "${config.type}" could not be found)`
    );
    if (appenderModule.appender) {
      debug(`DEPRECATION: Appender ${config.type} exports an appender function.`);
    }
    if (appenderModule.shutdown) {
      debug(`DEPRECATION: Appender ${config.type} exports a shutdown function.`);
    }

    if (this.disableClustering || cluster.isMaster || (this.pm2 && process.env[this.pm2InstanceVar] === '0')) {
      debug(`cluster.isMaster ? ${cluster.isMaster}`);
      debug(`pm2 enabled ? ${this.pm2}`);
      debug(`pm2InstanceVar = ${this.pm2InstanceVar}`);
      debug(`process.env[${this.pm2InstanceVar}] = ${process.env[this.pm2InstanceVar]}`);

      const appender = appenderModule.configure(
        config,
        layouts,
        this.configuredAppenders.get.bind(this.configuredAppenders),
        this.configuredLevels
      );

      if (appender.deprecated && this.deprecationWarnings) {
        console.error(`Appender "${name}" uses a deprecated type "${config.type}", ` + // eslint-disable-line
          'which will be removed in log4js v3. ' +
          `You should change it to use "${appender.deprecated}". ` +
          'To turn off this warning add "deprecationWarnings: false" to your config.');
      }

      return appender;
    }
    return () => {};
  }

  get appenders() {
    return this.configuredAppenders;
  }

  set appenders(appenderConfig) {
    const appenderNames = Object.keys(appenderConfig);
    this.throwExceptionIf(not(appenderNames.length), 'must define at least one appender.');

    this.configuredAppenders = new Map();
    appenderNames.forEach((name) => {
      this.throwExceptionIf(
        not(appenderConfig[name].type),
        `appender "${name}" is not valid (must be an object with property "type")`
      );

      debug(`Creating appender ${name}`);
      this.configuredAppenders.set(name, this.createAppender(name, appenderConfig[name]));
    });
  }

  get categories() {
    return this.configuredCategories;
  }

  set categories(categoryConfig) {
    const categoryNames = Object.keys(categoryConfig);
    this.throwExceptionIf(not(categoryNames.length), 'must define at least one category.');

    this.configuredCategories = new Map();
    categoryNames.forEach((name) => {
      const category = categoryConfig[name];
      this.throwExceptionIf(
        [
          not(category.appenders),
          not(category.level)
        ],
        `category "${name}" is not valid (must be an object with properties "appenders" and "level")`
      );

      this.throwExceptionIf(
        not(Array.isArray(category.appenders)),
        `category "${name}" is not valid (appenders must be an array of appender names)`
      );

      this.throwExceptionIf(
        not(category.appenders.length),
        `category "${name}" is not valid (appenders must contain at least one appender name)`
      );

      const appenders = [];
      category.appenders.forEach((appender) => {
        this.throwExceptionIf(
          not(this.configuredAppenders.get(appender)),
          `category "${name}" is not valid (appender "${appender}" is not defined)`
        );
        appenders.push(this.appenders.get(appender));
      });

      this.throwExceptionIf(
        not(this.configuredLevels.getLevel(category.level)),
        `category "${name}" is not valid (level "${category.level}" not recognised;` +
        ` valid levels are ${this.configuredLevels.levels.join(', ')})`
      );

      debug(`Creating category ${name}`);
      this.configuredCategories.set(
        name,
        { appenders: appenders, level: this.configuredLevels.getLevel(category.level) }
      );
    });

    this.throwExceptionIf(not(categoryConfig.default), 'must define a "default" category.');
  }

  get levels() {
    return this.configuredLevels;
  }

  set levels(levelConfig) {
    // levels are optional
    if (levelConfig) {
      this.throwExceptionIf(not(anObject(levelConfig)), 'levels must be an object');
      const newLevels = Object.keys(levelConfig);
      newLevels.forEach((l) => {
        this.throwExceptionIf(
          not(validIdentifier(l)),
          `level name "${l}" is not a valid identifier (must start with a letter, only contain A-Z,a-z,0-9,_)`
        );
        this.throwExceptionIf(not(anObject(levelConfig[l])), `level "${l}" must be an object`);
        this.throwExceptionIf(not(levelConfig[l].value), `level "${l}" must have a 'value' property`);
        this.throwExceptionIf(not(anInteger(levelConfig[l].value)), `level "${l}".value must have an integer value`);
        this.throwExceptionIf(not(levelConfig[l].colour), `level "${l}" must have a 'colour' property`);
        this.throwExceptionIf(
          not(validColours.indexOf(levelConfig[l].colour) > -1),
          `level "${l}".colour must be one of ${validColours.join(', ')}`
        );
      });
    }
    this.configuredLevels = levels(levelConfig);
  }

  constructor(candidate) {
    this.candidate = candidate;

    this.throwExceptionIf(not(anObject(candidate)), 'must be an object.');
    this.throwExceptionIf(not(anObject(candidate.appenders)), 'must have a property "appenders" of type object.');
    this.throwExceptionIf(not(anObject(candidate.categories)), 'must have a property "categories" of type object.');

    this.disableClustering = this.candidate.disableClustering || !cluster;
    this.deprecationWarnings = true;
    if ('deprecationWarnings' in this.candidate) {
      this.deprecationWarnings = this.candidate.deprecationWarnings;
    }

    this.pm2 = this.candidate.pm2;
    this.pm2InstanceVar = this.candidate.pm2InstanceVar || 'NODE_APP_INSTANCE';

    this.levels = candidate.levels;
    this.appenders = candidate.appenders;
    this.categories = candidate.categories;
  }
}

module.exports = Configuration;
