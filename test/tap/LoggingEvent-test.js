const flatted = require("flatted");
const { test } = require("tap");
const LoggingEvent = require("../../lib/LoggingEvent");
const levels = require("../../lib/levels");

test("LoggingEvent", batch => {
  batch.test("should serialise to flatted", t => {
    const event = new LoggingEvent("cheese", levels.DEBUG, ["log message"], {
      user: "bob"
    });
    // set the event date to a known value
    event.startTime = new Date(Date.UTC(2018, 1, 4, 18, 30, 23, 10));
    const rehydratedEvent = flatted.parse(event.serialise());
    t.equal(rehydratedEvent.startTime, "2018-02-04T18:30:23.010Z");
    t.equal(rehydratedEvent.categoryName, "cheese");
    t.equal(rehydratedEvent.level.levelStr, "DEBUG");
    t.equal(rehydratedEvent.data.length, 1);
    t.equal(rehydratedEvent.data[0], "log message");
    t.equal(rehydratedEvent.context.user, "bob");
    t.end();
  });

  batch.test("should deserialise from flatted", t => {
    const dehydratedEvent = flatted.stringify({
      startTime: "2018-02-04T10:25:23.010Z",
      categoryName: "biscuits",
      level: {
        levelStr: "INFO"
      },
      data: ["some log message", { x: 1 }],
      context: { thing: "otherThing" }
    });
    const event = LoggingEvent.deserialise(dehydratedEvent);
    t.type(event, LoggingEvent);
    t.same(event.startTime, new Date(Date.UTC(2018, 1, 4, 10, 25, 23, 10)));
    t.equal(event.categoryName, "biscuits");
    t.same(event.level, levels.INFO);
    t.equal(event.data[0], "some log message");
    t.equal(event.data[1].x, 1);
    t.equal(event.context.thing, "otherThing");
    t.end();
  });

  batch.test("Should correct construct with/without location info", t => {
    // console.log([Error('123').stack.split('\n').slice(1).join('\n')])
    const callStack =
      "    at repl:1:14\n    at ContextifyScript.Script.runInThisContext (vm.js:50:33)\n    at REPLServer.defaultEval (repl.js:240:29)\n    at bound (domain.js:301:14)\n    at REPLServer.runBound [as eval] (domain.js:314:12)\n    at REPLServer.onLine (repl.js:468:10)\n    at emitOne (events.js:121:20)\n    at REPLServer.emit (events.js:211:7)\n    at REPLServer.Interface._onLine (readline.js:280:10)\n    at REPLServer.Interface._line (readline.js:629:8)"; // eslint-disable-line
    const fileName = "/log4js-node/test/tap/layouts-test.js";
    const lineNumber = 1;
    const columnNumber = 14;
    const location = {
      fileName,
      lineNumber,
      columnNumber,
      callStack
    };
    const event = new LoggingEvent(
      "cheese",
      levels.DEBUG,
      ["log message"],
      { user: "bob" },
      location
    );
    t.equal(event.fileName, fileName);
    t.equal(event.lineNumber, lineNumber);
    t.equal(event.columnNumber, columnNumber);
    t.equal(event.callStack, callStack);

    const event2 = new LoggingEvent("cheese", levels.DEBUG, ["log message"], {
      user: "bob"
    });
    t.equal(event2.fileName, undefined);
    t.equal(event2.lineNumber, undefined);
    t.equal(event2.columnNumber, undefined);
    t.equal(event2.callStack, undefined);
    t.end();
  });

  batch.end();
});
