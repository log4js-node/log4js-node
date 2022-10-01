const flatted = require('flatted');
const { test } = require('tap');
const LoggingEvent = require('../../lib/LoggingEvent');
const levels = require('../../lib/levels');

test('LoggingEvent', (batch) => {
  batch.test('should serialise to flatted', (t) => {
    const event = new LoggingEvent(
      'cheese',
      levels.DEBUG,
      [
        'log message',
        Number('abc'),
        'NaN',
        1 / 0,
        'Infinity',
        -1 / 0,
        '-Infinity',
        undefined,
        'undefined',
      ],
      {
        user: 'bob',
      }
    );
    // set the event date to a known value
    event.startTime = new Date(Date.UTC(2018, 1, 4, 18, 30, 23, 10));
    const rehydratedEvent = flatted.parse(event.serialise());
    t.equal(rehydratedEvent.startTime, '2018-02-04T18:30:23.010Z');
    t.equal(rehydratedEvent.categoryName, 'cheese');
    t.equal(rehydratedEvent.level.levelStr, 'DEBUG');
    t.equal(rehydratedEvent.data.length, 9);
    t.equal(rehydratedEvent.data[0], 'log message');
    t.equal(rehydratedEvent.data[1], '__LOG4JS_NaN__');
    t.equal(rehydratedEvent.data[2], 'NaN');
    t.equal(rehydratedEvent.data[3], '__LOG4JS_Infinity__');
    t.equal(rehydratedEvent.data[4], 'Infinity');
    t.equal(rehydratedEvent.data[5], '__LOG4JS_-Infinity__');
    t.equal(rehydratedEvent.data[6], '-Infinity');
    t.equal(rehydratedEvent.data[7], '__LOG4JS_undefined__');
    t.equal(rehydratedEvent.data[8], 'undefined');
    t.equal(rehydratedEvent.context.user, 'bob');
    t.end();
  });

  batch.test('should deserialise from flatted', (t) => {
    const dehydratedEvent = flatted.stringify({
      startTime: '2018-02-04T10:25:23.010Z',
      categoryName: 'biscuits',
      level: {
        levelStr: 'INFO',
      },
      data: [
        'some log message',
        { x: 1 },
        '__LOG4JS_NaN__',
        'NaN',
        '__LOG4JS_Infinity__',
        'Infinity',
        '__LOG4JS_-Infinity__',
        '-Infinity',
        '__LOG4JS_undefined__',
        'undefined',
      ],
      context: { thing: 'otherThing' },
      pid: '1234',
      functionName: 'bound',
      fileName: 'domain.js',
      lineNumber: 421,
      columnNumber: 15,
      callStack: 'at bound (domain.js:421:15)\n',
    });
    const event = LoggingEvent.deserialise(dehydratedEvent);
    t.type(event, LoggingEvent);
    t.same(event.startTime, new Date(Date.UTC(2018, 1, 4, 10, 25, 23, 10)));
    t.equal(event.categoryName, 'biscuits');
    t.same(event.level, levels.INFO);
    t.equal(event.data.length, 10);
    t.equal(event.data[0], 'some log message');
    t.equal(event.data[1].x, 1);
    t.ok(Number.isNaN(event.data[2]));
    t.equal(event.data[3], 'NaN');
    t.equal(event.data[4], 1 / 0);
    t.equal(event.data[5], 'Infinity');
    t.equal(event.data[6], -1 / 0);
    t.equal(event.data[7], '-Infinity');
    t.equal(event.data[8], undefined);
    t.equal(event.data[9], 'undefined');
    t.equal(event.context.thing, 'otherThing');
    t.equal(event.pid, '1234');
    t.equal(event.functionName, 'bound');
    t.equal(event.fileName, 'domain.js');
    t.equal(event.lineNumber, 421);
    t.equal(event.columnNumber, 15);
    t.equal(event.callStack, 'at bound (domain.js:421:15)\n');
    t.end();
  });

  batch.test('Should correct construct with/without location info', (t) => {
    // console.log([Error('123').stack.split('\n').slice(1).join('\n')])
    const callStack =
      '    at repl:1:14\n    at ContextifyScript.Script.runInThisContext (vm.js:50:33)\n    at REPLServer.defaultEval (repl.js:240:29)\n    at bound (domain.js:301:14)\n    at REPLServer.runBound [as eval] (domain.js:314:12)\n    at REPLServer.onLine (repl.js:468:10)\n    at emitOne (events.js:121:20)\n    at REPLServer.emit (events.js:211:7)\n    at REPLServer.Interface._onLine (readline.js:280:10)\n    at REPLServer.Interface._line (readline.js:629:8)'; // eslint-disable-line max-len
    const fileName = '/log4js-node/test/tap/layouts-test.js';
    const lineNumber = 1;
    const columnNumber = 14;
    const className = '';
    const functionName = '';
    const functionAlias = '';
    const callerName = '';
    const location = {
      fileName,
      lineNumber,
      columnNumber,
      callStack,
      className,
      functionName,
      functionAlias,
      callerName,
    };
    const event = new LoggingEvent(
      'cheese',
      levels.DEBUG,
      ['log message'],
      { user: 'bob' },
      location
    );
    t.equal(event.fileName, fileName);
    t.equal(event.lineNumber, lineNumber);
    t.equal(event.columnNumber, columnNumber);
    t.equal(event.callStack, callStack);
    t.equal(event.className, className);
    t.equal(event.functionName, functionName);
    t.equal(event.functionAlias, functionAlias);
    t.equal(event.callerName, callerName);

    const event2 = new LoggingEvent('cheese', levels.DEBUG, ['log message'], {
      user: 'bob',
    });
    t.equal(event2.fileName, undefined);
    t.equal(event2.lineNumber, undefined);
    t.equal(event2.columnNumber, undefined);
    t.equal(event2.callStack, undefined);
    t.equal(event2.className, undefined);
    t.equal(event2.functionName, undefined);
    t.equal(event2.functionAlias, undefined);
    t.equal(event2.callerName, undefined);
    t.end();
  });

  batch.test('Should contain class, method and alias names', (t) => {
    // console.log([Error('123').stack.split('\n').slice(1).join('\n')])
    const callStack =
      '    at Foo.bar [as baz] (repl:1:14)\n    at ContextifyScript.Script.runInThisContext (vm.js:50:33)\n    at REPLServer.defaultEval (repl.js:240:29)\n    at bound (domain.js:301:14)\n    at REPLServer.runBound [as eval] (domain.js:314:12)\n    at REPLServer.onLine (repl.js:468:10)\n    at emitOne (events.js:121:20)\n    at REPLServer.emit (events.js:211:7)\n    at REPLServer.Interface._onLine (readline.js:280:10)\n    at REPLServer.Interface._line (readline.js:629:8)'; // eslint-disable-line max-len
    const fileName = '/log4js-node/test/tap/layouts-test.js';
    const lineNumber = 1;
    const columnNumber = 14;
    const className = 'Foo';
    const functionName = 'bar';
    const functionAlias = 'baz';
    const callerName = 'Foo.bar [as baz]';
    const location = {
      fileName,
      lineNumber,
      columnNumber,
      callStack,
      className,
      functionName,
      functionAlias,
      callerName,
    };
    const event = new LoggingEvent(
      'cheese',
      levels.DEBUG,
      ['log message'],
      { user: 'bob' },
      location
    );
    t.equal(event.fileName, fileName);
    t.equal(event.lineNumber, lineNumber);
    t.equal(event.columnNumber, columnNumber);
    t.equal(event.callStack, callStack);
    t.equal(event.className, className);
    t.equal(event.functionName, functionName);
    t.equal(event.functionAlias, functionAlias);
    t.equal(event.callerName, callerName);
    t.end();
  });

  batch.test('Should correctly serialize and deserialize', (t) => {
    const error = new Error('test');
    const location = {
      fileName: __filename,
      lineNumber: 123,
      columnNumber: 52,
      callStack: error.stack,
      className: 'Foo',
      functionName: 'test',
      functionAlias: 'baz',
      callerName: 'Foo.test [as baz]',
    };
    const event = new LoggingEvent(
      'cheese',
      levels.DEBUG,
      [
        error,
        'log message',
        Number('abc'),
        'NaN',
        1 / 0,
        'Infinity',
        -1 / 0,
        '-Infinity',
        undefined,
        'undefined',
      ],
      {
        user: 'bob',
      },
      location,
      error
    );
    const event2 = LoggingEvent.deserialise(event.serialise());
    t.match(event2, event);

    t.end();
  });

  batch.end();
});
