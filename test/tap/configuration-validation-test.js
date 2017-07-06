'use strict';

const test = require('tap').test;
const Configuration = require('../../lib/configuration');
const util = require('util');
const sandbox = require('sandboxed-module');

function testAppender(label) {
  return {
    configure: function (config, layouts, findAppender) {
      return {
        configureCalled: true,
        type: config.type,
        label: label,
        config: config,
        layouts: layouts,
        findAppender: findAppender
      };
    }
  };
}

test('log4js configuration validation', (batch) => {
  batch.test('should give error if config is just plain silly', (t) => {
    [null, undefined, '', ' ', []].forEach((config) => {
      const expectedError = new Error(
        `Problem with log4js configuration: (${util.inspect(config)}) - must be an object.`
      );
      t.throws(
        () => new Configuration(config),
        expectedError
      );
    });

    t.end();
  });

  batch.test('should give error if config is an empty object', (t) => {
    const expectedError = new Error(
      'Problem with log4js configuration: ({}) - must have a property "appenders" of type object.'
    );
    t.throws(() => new Configuration({}), expectedError);
    t.end();
  });

  batch.test('should give error if config has no appenders', (t) => {
    const expectedError = new Error(
      'Problem with log4js configuration: ({ categories: {} }) - must have a property "appenders" of type object.'
    );
    t.throws(() => new Configuration({ categories: {} }), expectedError);
    t.end();
  });

  batch.test('should give error if config has no categories', (t) => {
    const expectedError = new Error(
      'Problem with log4js configuration: ({ appenders: {} }) - must have a property "categories" of type object.'
    );
    t.throws(() => new Configuration({ appenders: {} }), expectedError);
    t.end();
  });

  batch.test('should give error if appenders is not an object', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ({ appenders: [], categories: [] })' +
      ' - must have a property "appenders" of type object.'
    );
    t.throws(
      () => new Configuration({ appenders: [], categories: [] }),
      error
    );
    t.end();
  });

  batch.test('should give error if appenders are not all valid', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ({ appenders: { thing: \'cheese\' }, categories: {} })' +
      ' - appender "thing" is not valid (must be an object with property "type")'
    );
    t.throws(
      () => new Configuration({ appenders: { thing: 'cheese' }, categories: {} }),
      error
    );
    t.end();
  });

  batch.test('should require at least one appender', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ({ appenders: {}, categories: {} })' +
      ' - must define at least one appender.'
    );
    t.throws(
      () => new Configuration({ appenders: {}, categories: {} }),
      error
    );
    t.end();
  });

  batch.test('should give error if categories are not all valid', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n  categories: { thing: \'cheese\' } })' +
      ' - category "thing" is not valid (must be an object with properties "appenders" and "level")'
    );
    t.throws(
      () => new Configuration({ appenders: { stdout: { type: 'stdout' } }, categories: { thing: 'cheese' } }),
      error
    );
    t.end();
  });

  batch.test('should give error if default category not defined', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { thing: { appenders: [ \'stdout\' ], level: \'ERROR\' } } })' +
      ' - must define a "default" category.'
    );
    t.throws(
      () => new Configuration({
        appenders: { stdout: { type: 'stdout' } },
        categories: { thing: { appenders: ['stdout'], level: 'ERROR' } } }
      ),
      error
    );
    t.end();
  });

  batch.test('should require at least one category', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ({ appenders: { stdout: { type: \'stdout\' } }, categories: {} })' +
      ' - must define at least one category.'
    );
    t.throws(
      () => new Configuration({ appenders: { stdout: { type: 'stdout' } }, categories: {} }),
      error
    );
    t.end();
  });

  batch.test('should give error if category.appenders is not an array', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { thing: { appenders: {}, level: \'ERROR\' } } })' +
      ' - category "thing" is not valid (appenders must be an array of appender names)'
    );
    t.throws(
      () => new Configuration({
        appenders: { stdout: { type: 'stdout' } },
        categories: { thing: { appenders: {}, level: 'ERROR' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should give error if category.appenders is empty', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { thing: { appenders: [], level: \'ERROR\' } } })' +
      ' - category "thing" is not valid (appenders must contain at least one appender name)'
    );
    t.throws(
      () => new Configuration({
        appenders: { stdout: { type: 'stdout' } },
        categories: { thing: { appenders: [], level: 'ERROR' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should give error if categories do not refer to valid appenders', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { thing: { appenders: [ \'cheese\' ], level: \'ERROR\' } } })' +
      ' - category "thing" is not valid (appender "cheese" is not defined)'
    );
    t.throws(
      () => new Configuration({
        appenders: { stdout: { type: 'stdout' } },
        categories: { thing: { appenders: ['cheese'], level: 'ERROR' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should give error if category level is not valid', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ' +
      '({ appenders: { stdout: { type: \'stdout\' } },\n' +
      '  categories: { default: { appenders: [ \'stdout\' ], level: \'Biscuits\' } } })' +
      ' - category "default" is not valid (level "Biscuits" not recognised; ' +
      'valid levels are ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, MARK, OFF)'
    );
    t.throws(
      () => new Configuration({
        appenders: { stdout: { type: 'stdout' } },
        categories: { default: { appenders: ['stdout'], level: 'Biscuits' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should give error if appender type cannot be found', (t) => {
    const error = new Error(
      'Problem with log4js configuration: ' +
      '({ appenders: { thing: { type: \'cheese\' } },\n' +
      '  categories: { default: { appenders: [ \'thing\' ], level: \'ERROR\' } } })' +
      ' - appender "thing" is not valid (type "cheese" could not be found)'
    );
    t.throws(
      () => new Configuration({
        appenders: { thing: { type: 'cheese' } },
        categories: { default: { appenders: ['thing'], level: 'ERROR' } }
      }),
      error
    );
    t.end();
  });

  batch.test('should create appender instances', (t) => {
    const SandboxedConfiguration = sandbox.require(
      '../../lib/configuration',
      {
        singleOnly: true,
        requires: {
          cheese: testAppender('cheesy')
        }
      }
    );

    const config = new SandboxedConfiguration({
      appenders: { thing: { type: 'cheese' } },
      categories: { default: { appenders: ['thing'], level: 'ERROR' } }
    });

    const thing = config.appenders.get('thing');
    t.ok(thing.configureCalled);
    t.equal(thing.type, 'cheese');
    t.end();
  });

  batch.test('should load appenders from core first', (t) => {
    const SandboxedConfiguration = sandbox.require(
      '../../lib/configuration',
      {
        singleOnly: true,
        requires: {
          './appenders/cheese': testAppender('correct'),
          cheese: testAppender('wrong')
        }
      }
    );

    const config = new SandboxedConfiguration({
      appenders: { thing: { type: 'cheese' } },
      categories: { default: { appenders: ['thing'], level: 'ERROR' } }
    });

    const thing = config.appenders.get('thing');
    t.ok(thing.configureCalled);
    t.equal(thing.type, 'cheese');
    t.equal(thing.label, 'correct');
    t.end();
  });

  batch.test('should pass config, layout, findAppender to appenders', (t) => {
    const SandboxedConfiguration = sandbox.require(
      '../../lib/configuration',
      {
        singleOnly: true,
        requires: {
          cheese: testAppender('cheesy')
        }
      }
    );

    const config = new SandboxedConfiguration({
      appenders: { thing: { type: 'cheese', foo: 'bar' }, thing2: { type: 'cheese' } },
      categories: { default: { appenders: ['thing'], level: 'ERROR' } }
    });

    const thing = config.appenders.get('thing');
    t.ok(thing.configureCalled);
    t.equal(thing.type, 'cheese');
    t.equal(thing.config.foo, 'bar');
    t.type(thing.layouts, 'object');
    t.type(thing.layouts.basicLayout, 'function');
    t.type(thing.findAppender, 'function');
    t.type(thing.findAppender('thing2'), 'object');
    t.end();
  });

  batch.end();
});
