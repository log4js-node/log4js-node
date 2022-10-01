const { test } = require('tap');
const debug = require('debug')('log4js:test.logger');
const sandbox = require('@log4js-node/sandboxed-module');
const callsites = require('callsites');
const levels = require('../../lib/levels');
const categories = require('../../lib/categories');

/** @type {import('../../types/log4js').LoggingEvent[]} */
const events = [];
/** @type {string[]} */
const messages = [];

/**
 * @typedef {import('../../types/log4js').Logger} LoggerClass
 */

/** @type {{new (): LoggerClass}} */
const Logger = sandbox.require('../../lib/logger', {
  requires: {
    './levels': levels,
    './categories': categories,
    './clustering': {
      isMaster: () => true,
      onlyOnMaster: (fn) => fn(),
      send: (evt) => {
        debug('fake clustering got event:', evt);
        events.push(evt);
      },
    },
  },
  globals: {
    console: {
      ...console,
      error(msg) {
        messages.push(msg);
      },
    },
  },
});

const testConfig = {
  level: levels.TRACE,
};

test('../../lib/logger', (batch) => {
  batch.beforeEach((done) => {
    events.length = 0;
    testConfig.level = levels.TRACE;
    if (typeof done === 'function') {
      done();
    }
  });

  batch.test('constructor with no parameters', (t) => {
    t.throws(() => new Logger(), new Error('No category provided.'));
    t.end();
  });

  batch.test('constructor with category', (t) => {
    const logger = new Logger('cheese');
    t.equal(logger.category, 'cheese', 'should use category');
    t.equal(logger.level, levels.OFF, 'should use OFF log level');
    t.end();
  });

  batch.test('set level should delegate', (t) => {
    const logger = new Logger('cheese');
    logger.level = 'debug';
    t.equal(logger.category, 'cheese', 'should use category');
    t.equal(logger.level, levels.DEBUG, 'should use level');
    t.end();
  });

  batch.test('isLevelEnabled', (t) => {
    const logger = new Logger('cheese');
    const functions = [
      'isTraceEnabled',
      'isDebugEnabled',
      'isInfoEnabled',
      'isWarnEnabled',
      'isErrorEnabled',
      'isFatalEnabled',
    ];
    t.test(
      'should provide a level enabled function for all levels',
      (subtest) => {
        subtest.plan(functions.length);
        functions.forEach((fn) => {
          subtest.type(logger[fn], 'function');
        });
      }
    );
    logger.level = 'INFO';
    t.notOk(logger.isTraceEnabled());
    t.notOk(logger.isDebugEnabled());
    t.ok(logger.isInfoEnabled());
    t.ok(logger.isWarnEnabled());
    t.ok(logger.isErrorEnabled());
    t.ok(logger.isFatalEnabled());
    t.end();
  });

  batch.test('should send log events to dispatch function', (t) => {
    const logger = new Logger('cheese');
    logger.level = 'debug';
    logger.debug('Event 1');
    logger.debug('Event 2');
    logger.debug('Event 3');

    t.equal(events.length, 3);
    t.equal(events[0].data[0], 'Event 1');
    t.equal(events[1].data[0], 'Event 2');
    t.equal(events[2].data[0], 'Event 3');
    t.end();
  });

  batch.test('should add context values to every event', (t) => {
    const logger = new Logger('fromage');
    logger.level = 'debug';
    logger.debug('Event 1');
    logger.addContext('cheese', 'edam');
    logger.debug('Event 2');
    logger.debug('Event 3');
    logger.addContext('biscuits', 'timtam');
    logger.debug('Event 4');
    logger.removeContext('cheese');
    logger.debug('Event 5');
    logger.clearContext();
    logger.debug('Event 6');

    t.equal(events.length, 6);
    t.same(events[0].context, {});
    t.same(events[1].context, { cheese: 'edam' });
    t.same(events[2].context, { cheese: 'edam' });
    t.same(events[3].context, { cheese: 'edam', biscuits: 'timtam' });
    t.same(events[4].context, { biscuits: 'timtam' });
    t.same(events[5].context, {});
    t.end();
  });

  batch.test('should not break when log data has no toString', (t) => {
    const logger = new Logger('thing');
    logger.level = 'debug';
    logger.info('Just testing ', Object.create(null));

    t.equal(events.length, 1);
    t.end();
  });

  batch.test(
    'default should disable useCallStack unless manual enable',
    (t) => {
      const logger = new Logger('stack');
      logger.level = 'debug';

      t.equal(logger.useCallStack, false);

      logger.debug('test no callStack');
      let event = events.shift();
      t.notMatch(event, { functionName: String });
      t.notMatch(event, { fileName: String });
      t.notMatch(event, { lineNumber: Number });
      t.notMatch(event, { columnNumber: Number });
      t.notMatch(event, { callStack: String });

      logger.useCallStack = false;
      t.equal(logger.useCallStack, false);

      logger.useCallStack = 0;
      t.equal(logger.useCallStack, false);

      logger.useCallStack = '';
      t.equal(logger.useCallStack, false);

      logger.useCallStack = null;
      t.equal(logger.useCallStack, false);

      logger.useCallStack = undefined;
      t.equal(logger.useCallStack, false);

      logger.useCallStack = 'true';
      t.equal(logger.useCallStack, false);

      logger.useCallStack = true;
      t.equal(logger.useCallStack, true);
      logger.debug('test with callStack');
      event = events.shift();
      t.match(event, {
        functionName: String,
        fileName: String,
        lineNumber: Number,
        columnNumber: Number,
        callStack: String,
      });
      t.end();
    }
  );

  batch.test('should correctly switch on/off useCallStack', (t) => {
    const logger = new Logger('stack');
    logger.level = 'debug';
    logger.useCallStack = true;
    t.equal(logger.useCallStack, true);

    logger.info('hello world');
    const callsite = callsites()[0];

    t.equal(events.length, 1);
    t.equal(events[0].data[0], 'hello world');
    t.equal(events[0].fileName, callsite.getFileName());
    t.equal(events[0].lineNumber, callsite.getLineNumber() - 1);
    t.equal(events[0].columnNumber, 12);

    logger.useCallStack = false;
    logger.info('disabled');
    t.equal(logger.useCallStack, false);
    t.equal(events[1].data[0], 'disabled');
    t.equal(events[1].fileName, undefined);
    t.equal(events[1].lineNumber, undefined);
    t.equal(events[1].columnNumber, undefined);
    t.end();
  });

  batch.test(
    'Once switch on/off useCallStack will apply all same category loggers',
    (t) => {
      const logger1 = new Logger('stack');
      logger1.level = 'debug';
      logger1.useCallStack = true;
      const logger2 = new Logger('stack');
      logger2.level = 'debug';

      logger1.info('hello world');
      const callsite = callsites()[0];

      t.equal(logger1.useCallStack, true);
      t.equal(events.length, 1);
      t.equal(events[0].data[0], 'hello world');
      t.equal(events[0].fileName, callsite.getFileName());
      t.equal(events[0].lineNumber, callsite.getLineNumber() - 1);
      t.equal(events[0].columnNumber, 15); // col of the '.' in logger1.info(...)

      logger2.info('hello world');
      const callsite2 = callsites()[0];

      t.equal(logger2.useCallStack, true);
      t.equal(events[1].data[0], 'hello world');
      t.equal(events[1].fileName, callsite2.getFileName());
      t.equal(events[1].lineNumber, callsite2.getLineNumber() - 1);
      t.equal(events[1].columnNumber, 15); // col of the '.' in logger1.info(...)

      logger1.useCallStack = false;
      logger2.info('hello world');
      t.equal(logger2.useCallStack, false);
      t.equal(events[2].data[0], 'hello world');
      t.equal(events[2].fileName, undefined);
      t.equal(events[2].lineNumber, undefined);
      t.equal(events[2].columnNumber, undefined);

      t.end();
    }
  );

  batch.test('parseCallStack function coverage', (t) => {
    const logger = new Logger('stack');
    logger.useCallStack = true;

    let results;

    results = logger.parseCallStack(new Error());
    t.ok(results);
    t.equal(messages.length, 0, 'should not have error');

    results = logger.parseCallStack('');
    t.notOk(results);
    t.equal(messages.length, 1, 'should have error');

    results = logger.parseCallStack(new Error(), 100);
    t.equal(results, null);

    t.end();
  });

  batch.test('parseCallStack names extraction', (t) => {
    const logger = new Logger('stack');
    logger.useCallStack = true;

    let results;

    const callStack1 =
      '    at Foo.bar [as baz] (repl:1:14)\n    at ContextifyScript.Script.runInThisContext (vm.js:50:33)\n    at REPLServer.defaultEval (repl.js:240:29)\n    at bound (domain.js:301:14)\n    at REPLServer.runBound [as eval] (domain.js:314:12)\n    at REPLServer.onLine (repl.js:468:10)\n    at emitOne (events.js:121:20)\n    at REPLServer.emit (events.js:211:7)\n    at REPLServer.Interface._onLine (readline.js:280:10)\n    at REPLServer.Interface._line (readline.js:629:8)'; // eslint-disable-line max-len
    results = logger.parseCallStack({ stack: callStack1 }, 0);
    t.ok(results);
    t.equal(results.className, 'Foo');
    t.equal(results.functionName, 'bar');
    t.equal(results.functionAlias, 'baz');
    t.equal(results.callerName, 'Foo.bar [as baz]');

    const callStack2 =
      '    at bar [as baz] (repl:1:14)\n    at ContextifyScript.Script.runInThisContext (vm.js:50:33)\n    at REPLServer.defaultEval (repl.js:240:29)\n    at bound (domain.js:301:14)\n    at REPLServer.runBound [as eval] (domain.js:314:12)\n    at REPLServer.onLine (repl.js:468:10)\n    at emitOne (events.js:121:20)\n    at REPLServer.emit (events.js:211:7)\n    at REPLServer.Interface._onLine (readline.js:280:10)\n    at REPLServer.Interface._line (readline.js:629:8)'; // eslint-disable-line max-len
    results = logger.parseCallStack({ stack: callStack2 }, 0);
    t.ok(results);
    t.equal(results.className, '');
    t.equal(results.functionName, 'bar');
    t.equal(results.functionAlias, 'baz');
    t.equal(results.callerName, 'bar [as baz]');

    const callStack3 =
      '    at bar (repl:1:14)\n    at ContextifyScript.Script.runInThisContext (vm.js:50:33)\n    at REPLServer.defaultEval (repl.js:240:29)\n    at bound (domain.js:301:14)\n    at REPLServer.runBound [as eval] (domain.js:314:12)\n    at REPLServer.onLine (repl.js:468:10)\n    at emitOne (events.js:121:20)\n    at REPLServer.emit (events.js:211:7)\n    at REPLServer.Interface._onLine (readline.js:280:10)\n    at REPLServer.Interface._line (readline.js:629:8)'; // eslint-disable-line max-len
    results = logger.parseCallStack({ stack: callStack3 }, 0);
    t.ok(results);
    t.equal(results.className, '');
    t.equal(results.functionName, 'bar');
    t.equal(results.functionAlias, '');
    t.equal(results.callerName, 'bar');

    const callStack4 =
      '    at repl:1:14\n    at ContextifyScript.Script.runInThisContext (vm.js:50:33)\n    at REPLServer.defaultEval (repl.js:240:29)\n    at bound (domain.js:301:14)\n    at REPLServer.runBound [as eval] (domain.js:314:12)\n    at REPLServer.onLine (repl.js:468:10)\n    at emitOne (events.js:121:20)\n    at REPLServer.emit (events.js:211:7)\n    at REPLServer.Interface._onLine (readline.js:280:10)\n    at REPLServer.Interface._line (readline.js:629:8)'; // eslint-disable-line max-len
    results = logger.parseCallStack({ stack: callStack4 }, 0);
    t.ok(results);
    t.equal(results.className, '');
    t.equal(results.functionName, '');
    t.equal(results.functionAlias, '');
    t.equal(results.callerName, '');

    const callStack5 =
      '    at Foo.bar (repl:1:14)\n    at ContextifyScript.Script.runInThisContext (vm.js:50:33)\n    at REPLServer.defaultEval (repl.js:240:29)\n    at bound (domain.js:301:14)\n    at REPLServer.runBound [as eval] (domain.js:314:12)\n    at REPLServer.onLine (repl.js:468:10)\n    at emitOne (events.js:121:20)\n    at REPLServer.emit (events.js:211:7)\n    at REPLServer.Interface._onLine (readline.js:280:10)\n    at REPLServer.Interface._line (readline.js:629:8)'; // eslint-disable-line max-len
    results = logger.parseCallStack({ stack: callStack5 }, 0);
    t.ok(results);
    t.equal(results.className, 'Foo');
    t.equal(results.functionName, 'bar');
    t.equal(results.functionAlias, '');
    t.equal(results.callerName, 'Foo.bar');

    t.end();
  });

  batch.test('should correctly change the parseCallStack function', (t) => {
    const logger = new Logger('stack');
    logger.level = 'debug';
    logger.useCallStack = true;

    logger.info('test defaultParseCallStack');
    const initialEvent = events.shift();
    const parseFunction = function () {
      return {
        functionName: 'test function name',
        fileName: 'test file name',
        lineNumber: 15,
        columnNumber: 25,
        callStack: 'test callstack',
      };
    };
    logger.setParseCallStackFunction(parseFunction);

    t.equal(logger.parseCallStack, parseFunction);

    logger.info('test parseCallStack');
    t.equal(events[0].functionName, 'test function name');
    t.equal(events[0].fileName, 'test file name');
    t.equal(events[0].lineNumber, 15);
    t.equal(events[0].columnNumber, 25);
    t.equal(events[0].callStack, 'test callstack');

    events.shift();

    logger.setParseCallStackFunction(undefined);
    logger.info('test restoredDefaultParseCallStack');

    t.equal(events[0].functionName, initialEvent.functionName);
    t.equal(events[0].fileName, initialEvent.fileName);
    t.equal(events[0].columnNumber, initialEvent.columnNumber);

    t.throws(
      () => logger.setParseCallStackFunction('not a function'),
      'Invalid type passed to setParseCallStackFunction'
    );

    t.end();
  });

  batch.test('should correctly change the stack levels to skip', (t) => {
    const logger = new Logger('stack');
    logger.level = 'debug';
    logger.useCallStack = true;

    t.equal(
      logger.callStackLinesToSkip,
      0,
      'initial callStackLinesToSkip changed'
    );

    logger.info('get initial stack');
    const initialEvent = events.shift();
    const newStackSkip = 1;
    logger.callStackLinesToSkip = newStackSkip;
    t.equal(logger.callStackLinesToSkip, newStackSkip);
    logger.info('test stack skip');
    const event = events.shift();
    t.not(event.functionName, initialEvent.functionName);
    t.not(event.fileName, initialEvent.fileName);
    t.equal(
      event.callStack,
      initialEvent.callStack.split('\n').slice(newStackSkip).join('\n')
    );

    t.throws(() => {
      logger.callStackLinesToSkip = -1;
    });
    t.throws(() => {
      logger.callStackLinesToSkip = '2';
    });
    t.end();
  });

  batch.test('should utilize the first Error data value', (t) => {
    const logger = new Logger('stack');
    logger.level = 'debug';
    logger.useCallStack = true;

    const error = new Error();

    logger.info(error);
    const event = events.shift();
    t.equal(event.error, error);

    logger.info(error);

    t.match(event, events.shift());

    logger.callStackLinesToSkip = 1;
    logger.info(error);
    const event2 = events.shift();

    t.equal(event2.callStack, event.callStack.split('\n').slice(1).join('\n'));
    logger.callStackLinesToSkip = 0;
    logger.info('hi', error);
    const event3 = events.shift();
    t.equal(event3.callStack, event.callStack);
    t.equal(event3.error, error);

    logger.info('hi', error, new Error());
    const event4 = events.shift();
    t.equal(event4.callStack, event.callStack);
    t.equal(event4.error, error);

    t.end();
  });

  batch.test('creating/cloning of category', (t) => {
    const defaultLogger = new Logger('default');
    defaultLogger.level = 'trace';
    defaultLogger.useCallStack = true;

    t.test(
      'category should be cloned from parent/default if does not exist',
      (assert) => {
        const originalLength = categories.size;

        const logger = new Logger('cheese1');
        assert.equal(
          categories.size,
          originalLength + 1,
          'category should be cloned'
        );
        assert.equal(
          logger.level,
          levels.TRACE,
          'should inherit level=TRACE from default-category'
        );
        assert.equal(
          logger.useCallStack,
          true,
          'should inherit useCallStack=true from default-category'
        );
        assert.end();
      }
    );

    t.test(
      'changing level should not impact default-category or useCallStack',
      (assert) => {
        const logger = new Logger('cheese2');
        logger.level = 'debug';
        assert.equal(
          logger.level,
          levels.DEBUG,
          'should be changed to level=DEBUG'
        );
        assert.equal(
          defaultLogger.level,
          levels.TRACE,
          'default-category should remain as level=TRACE'
        );
        assert.equal(
          logger.useCallStack,
          true,
          'should remain as useCallStack=true'
        );
        assert.equal(
          defaultLogger.useCallStack,
          true,
          'default-category should remain as useCallStack=true'
        );
        assert.end();
      }
    );

    t.test(
      'changing useCallStack should not impact default-category or level',
      (assert) => {
        const logger = new Logger('cheese3');
        logger.useCallStack = false;
        assert.equal(
          logger.useCallStack,
          false,
          'should be changed to useCallStack=false'
        );
        assert.equal(
          defaultLogger.useCallStack,
          true,
          'default-category should remain as useCallStack=true'
        );
        assert.equal(
          logger.level,
          levels.TRACE,
          'should remain as level=TRACE'
        );
        assert.equal(
          defaultLogger.level,
          levels.TRACE,
          'default-category should remain as level=TRACE'
        );
        assert.end();
      }
    );

    t.end();
  });

  batch.end();
});
