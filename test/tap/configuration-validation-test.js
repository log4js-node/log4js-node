'use strict';

const test = require('tap').test;
const util = require('util');
const path = require('path');
const sandbox = require('@log4js-node/sandboxed-module');
const log4js = require('../../lib/log4js');
const configuration = require('../../lib/configuration');
const debug = require('debug')('log4js:test.configuration-validation');
const deepFreeze = require('deep-freeze');

const testAppender = (label, result) => ({
  configure: function (config, layouts, findAppender) {
    debug(`testAppender(${label}).configure called, with config: ${util.inspect(config)}`);
    result.configureCalled = true;
    result.type = config.type;
    result.label = label;
    result.config = config;
    result.layouts = layouts;
    result.findAppender = findAppender;
    return { };
  }
});

test('log4js configuration validation', (batch) => {
  batch.test('should give error if config is just plain silly', (t) => {
    [null, undefined, '', ' ', []].forEach((config) => {
      const expectedError =
        new Error(`Problem with log4js configuration: (${util.inspect(config)}) - must be an object.`);
      t.throws(
        () => configuration.configure(config),
        expectedError
      );
    });

    t.end();
  });

  batch.test('should give error if config is an empty object', (t) => {
    const expectedError =
      new Error('Problem with log4js configuration: ({}) - must have a property "appenders" of type object.');
    t.throws(() => log4js.configure({}), expectedError);
    t.end();
  });

  batch.test('should give error if config has no appenders', (t) => {
    const expectedError =
      new Error('Problem with log4js configuration: ({ categories: {} }) ' +
      '- must have a property "appenders" of type object.');
    t.throws(() => log4js.configure({ categories: {} }), expectedError);
    t.end();
  });

  batch.test('should give error if config has no categories', (t) => {
    const expectedError =
      new Error('Problem with log4js configuration: ({ appenders: { out: { type: \'stdout\' } } }) ' +
      '- must have a property "categories" of type object.');
    t.throws(() => log4js.configure({ appenders: { out: { type: 'stdout' } } }), expectedError);
    t.end();
  });

  batch.test('should give error if appenders is not an object', (t) => {
    const error =
      new Error('Problem with log4js configuration: ({ appenders: [], categories: [] })' +
      ' - must have a property "appenders" of type object.');
    t.throws(
      () => log4js.configure({ appenders: [], categories: [] }),
      error
    );
    t.end();
  });

  batch.test('should give error if appenders are not all valid', (t) => {
    const error =
      new Error('Problem with log4js configuration: ({ appenders: { thing: \'cheese\' }, categories: {} })' +
      ' - appender "thing" is not valid (must be an object with property "type")');
    t.throws(
      () => log4js.configure({ appenders: { thing: 'cheese' }, categories: {} }),
      error
    );
    t.end();
  });

  batch.test('should require at least one appender', (t) => {
    const error = new Error('Problem with log4js configuration: ({ appenders: {}, categories: {} })' +
      ' - must define at least one appender.');
    t.throws(
      () => log4js.configure({ appenders: {}, categories: {} }),
      error
    );
    t.end();
  });

  batch.test('should give error if categories are not all valid', (t) => {
    const error = new Error('Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n  categories: { thing: \'cheese\' } })' +
      ' - category "thing" is not valid (must be an object with properties "appenders" and "level")');
    t.throws(
      () => log4js.configure({ appenders: { stdout: { type: 'stdout' } }, categories: { thing: 'cheese' } }),
      error
    );
    t.end();
  });

  batch.test('should give error if default category not defined', (t) => {
    const error = new Error('Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { thing: { appenders: [ \'stdout\' ], level: \'ERROR\' } } })' +
      ' - must define a "default" category.');
    t.throws(
      () => log4js.configure({
        appenders: { stdout: { type: 'stdout' } },
        categories: { thing: { appenders: ['stdout'], level: 'ERROR' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should require at least one category', (t) => {
    const error =
      new Error('Problem with log4js configuration: ({ appenders: { stdout: { type: \'stdout\' } }, categories: {} })' +
      ' - must define at least one category.');
    t.throws(
      () => log4js.configure({ appenders: { stdout: { type: 'stdout' } }, categories: {} }),
      error
    );
    t.end();
  });

  batch.test('should give error if category.appenders is not an array', (t) => {
    const error = new Error('Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { thing: { appenders: {}, level: \'ERROR\' } } })' +
      ' - category "thing" is not valid (appenders must be an array of appender names)');
    t.throws(
      () => log4js.configure({
        appenders: { stdout: { type: 'stdout' } },
        categories: { thing: { appenders: {}, level: 'ERROR' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should give error if category.appenders is empty', (t) => {
    const error = new Error('Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { thing: { appenders: [], level: \'ERROR\' } } })' +
      ' - category "thing" is not valid (appenders must contain at least one appender name)');
    t.throws(
      () => log4js.configure({
        appenders: { stdout: { type: 'stdout' } },
        categories: { thing: { appenders: [], level: 'ERROR' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should give error if categories do not refer to valid appenders', (t) => {
    const error = new Error('Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { thing: { appenders: [ \'cheese\' ], level: \'ERROR\' } } })' +
      ' - category "thing" is not valid (appender "cheese" is not defined)');
    t.throws(
      () => log4js.configure({
        appenders: { stdout: { type: 'stdout' } },
        categories: { thing: { appenders: ['cheese'], level: 'ERROR' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should give error if category level is not valid', (t) => {
    const error = new Error('Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { default: { appenders: [ \'stdout\' ], level: \'Biscuits\' } } })' +
      ' - category "default" is not valid (level "Biscuits" not recognised; ' +
      'valid levels are ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, MARK, OFF)');
    t.throws(
      () => log4js.configure({
        appenders: { stdout: { type: 'stdout' } },
        categories: { default: { appenders: ['stdout'], level: 'Biscuits' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should give error if appender type cannot be found', (t) => {
    const error = new Error('Problem with log4js configuration: ' +
      '({ appenders: { thing: { type: \'cheese\' } },\n' +
      '  categories: { default: { appenders: [ \'thing\' ], level: \'ERROR\' } } })' +
      ' - appender "thing" is not valid (type "cheese" could not be found)');
    t.throws(
      () => log4js.configure({
        appenders: { thing: { type: 'cheese' } },
        categories: { default: { appenders: ['thing'], level: 'ERROR' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should create appender instances', (t) => {
    const thing = {};
    const sandboxedLog4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          cheese: testAppender('cheesy', thing)
        },
        ignoreMissing: true
      }
    );

    sandboxedLog4js.configure({
      appenders: { thing: { type: 'cheese' } },
      categories: { default: { appenders: ['thing'], level: 'ERROR' } }
    });

    t.ok(thing.configureCalled);
    t.equal(thing.type, 'cheese');
    t.end();
  });

  batch.test('should load appenders from core first', (t) => {
    const result = {};
    const sandboxedLog4js = sandbox.require(
      '../../lib/log4js',
      {
        requires: {
          './cheese': testAppender('correct', result),
          cheese: testAppender('wrong', result)
        },
        ignoreMissing: true
      }
    );

    sandboxedLog4js.configure({
      appenders: { thing: { type: 'cheese' } },
      categories: { default: { appenders: ['thing'], level: 'ERROR' } }
    });

    t.ok(result.configureCalled);
    t.equal(result.type, 'cheese');
    t.equal(result.label, 'correct');
    t.end();
  });

  batch.test('should load appenders relative to main file if not in core, or node_modules', (t) => {
    const result = {};
    const mainPath = path.dirname(require.main.filename);
    const sandboxConfig = {
      ignoreMissing: true,
      requires: {}
    };
    sandboxConfig.requires[`${mainPath}/cheese`] = testAppender('correct', result);
    // add this one, because when we're running coverage the main path is a bit different
    sandboxConfig.requires[
      `${path.join(mainPath, '../../node_modules/nyc/bin/cheese')}`
    ] = testAppender('correct', result);
    const sandboxedLog4js = sandbox.require('../../lib/log4js', sandboxConfig);

    sandboxedLog4js.configure({
      appenders: { thing: { type: 'cheese' } },
      categories: { default: { appenders: ['thing'], level: 'ERROR' } }
    });

    t.ok(result.configureCalled);
    t.equal(result.type, 'cheese');
    t.equal(result.label, 'correct');
    t.end();
  });

  batch.test('should load appenders relative to process.cwd if not found in core, node_modules', (t) => {
    const result = {};
    const fakeProcess = new Proxy(process, {
      get(target, key) {
        if (key === 'cwd') {
          return () => '/var/lib/cheese';
        }

        return target[key];
      }
    });
    const sandboxedLog4js = sandbox.require(
      '../../lib/log4js',
      {
        ignoreMissing: true,
        requires: {
          '/var/lib/cheese/cheese': testAppender('correct', result),
        },
        globals: {
          process: fakeProcess
        }
      }
    );

    sandboxedLog4js.configure({
      appenders: { thing: { type: 'cheese' } },
      categories: { default: { appenders: ['thing'], level: 'ERROR' } }
    });

    t.ok(result.configureCalled);
    t.equal(result.type, 'cheese');
    t.equal(result.label, 'correct');
    t.end();
  });

  batch.test('should pass config, layout, findAppender to appenders', (t) => {
    const result = {};
    const sandboxedLog4js = sandbox.require(
      '../../lib/log4js',
      {
        ignoreMissing: true,
        requires: {
          cheese: testAppender('cheesy', result),
          notCheese: testAppender('notCheesy', {})
        }
      }
    );

    sandboxedLog4js.configure({
      appenders: { thing: { type: 'cheese', foo: 'bar' }, thing2: { type: 'notCheese' } },
      categories: { default: { appenders: ['thing'], level: 'ERROR' } }
    });

    t.ok(result.configureCalled);
    t.equal(result.type, 'cheese');
    t.equal(result.config.foo, 'bar');
    t.type(result.layouts, 'object');
    t.type(result.layouts.basicLayout, 'function');
    t.type(result.findAppender, 'function');
    t.type(result.findAppender('thing2'), 'object');
    t.end();
  });

  batch.test('should not give error if level object is used instead of string', (t) => {
    t.doesNotThrow(() => log4js.configure({
      appenders: { thing: { type: 'stdout' } },
      categories: { default: { appenders: ['thing'], level: log4js.levels.ERROR } }
    }));
    t.end();
  });

  batch.test('should not throw error if configure object is freezed', (t) => {
    t.doesNotThrow(() => log4js.configure(deepFreeze({
      appenders: {
        dateFile: {
          type: 'dateFile', filename: 'test/tap/freeze-date-file-test', alwaysIncludePattern: false
        }
      },
      categories: { default: { appenders: ['dateFile'], level: log4js.levels.ERROR } }
    })));
    t.end();
  });

  batch.end();
});
