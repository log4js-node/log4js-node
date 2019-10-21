const { test } = require("tap");
const os = require("os");
const path = require("path");

const { EOL } = os;

// used for patternLayout tests.
function testPattern(assert, layout, event, tokens, pattern, value) {
  assert.equal(layout(pattern, tokens)(event), value);
}

test("log4js layouts", batch => {
  batch.test("colouredLayout", t => {
    const layout = require("../../lib/layouts").colouredLayout;

    t.test("should apply level colour codes to output", assert => {
      const output = layout({
        data: ["nonsense"],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        categoryName: "cheese",
        level: {
          toString() {
            return "ERROR";
          },
          colour: "red"
        }
      });

      assert.equal(
        output,
        "\x1B[91m[2010-12-05T14:18:30.045] [ERROR] cheese - \x1B[39mnonsense"
      );
      assert.end();
    });

    t.test("should support the console.log format for the message", assert => {
      const output = layout({
        data: ["thing %d", 2],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        categoryName: "cheese",
        level: {
          toString() {
            return "ERROR";
          },
          colour: "red"
        }
      });
      assert.equal(
        output,
        "\x1B[91m[2010-12-05T14:18:30.045] [ERROR] cheese - \x1B[39mthing 2"
      );
      assert.end();
    });
    t.end();
  });

  batch.test("messagePassThroughLayout", t => {
    const layout = require("../../lib/layouts").messagePassThroughLayout;

    t.equal(
      layout({
        data: ["nonsense"],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        categoryName: "cheese",
        level: {
          colour: "green",
          toString() {
            return "ERROR";
          }
        }
      }),
      "nonsense",
      "should take a logevent and output only the message"
    );

    t.equal(
      layout({
        data: ["thing %d", 1, "cheese"],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        categoryName: "cheese",
        level: {
          colour: "green",
          toString() {
            return "ERROR";
          }
        }
      }),
      "thing 1 cheese",
      "should support the console.log format for the message"
    );

    t.equal(
      layout({
        data: [{ thing: 1 }],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        categoryName: "cheese",
        level: {
          colour: "green",
          toString() {
            return "ERROR";
          }
        }
      }),
      "{ thing: 1 }",
      "should output the first item even if it is not a string"
    );

    t.match(
      layout({
        data: [new Error()],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        categoryName: "cheese",
        level: {
          colour: "green",
          toString() {
            return "ERROR";
          }
        }
      }),
      /at (Test\.batch\.test\.t|Test\.<anonymous>)\s+\((.*)test[\\/]tap[\\/]layouts-test\.js:\d+:\d+\)/,
      "regexp did not return a match - should print the stacks of a passed error objects"
    );

    t.test("with passed augmented errors", assert => {
      const e = new Error("My Unique Error Message");
      e.augmented = "My Unique attribute value";
      e.augObj = { at1: "at2" };

      const layoutOutput = layout({
        data: [e],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        categoryName: "cheese",
        level: {
          colour: "green",
          toString() {
            return "ERROR";
          }
        }
      });

      assert.match(
        layoutOutput,
        /Error: My Unique Error Message/,
        "should print the contained error message"
      );
      assert.match(
        layoutOutput,
        /augmented:\s'My Unique attribute value'/,
        "should print error augmented string attributes"
      );
      assert.match(
        layoutOutput,
        /augObj:\s\{ at1: 'at2' \}/,
        "should print error augmented object attributes"
      );
      assert.end();
    });
    t.end();
  });

  batch.test("basicLayout", t => {
    const layout = require("../../lib/layouts").basicLayout;

    const event = {
      data: ["this is a test"],
      startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
      categoryName: "tests",
      level: {
        toString() {
          return "DEBUG";
        }
      }
    };

    t.equal(
      layout(event),
      "[2010-12-05T14:18:30.045] [DEBUG] tests - this is a test"
    );

    t.test(
      "should output a stacktrace, message if the event has an error attached",
      assert => {
        let i;
        const error = new Error("Some made-up error");
        const stack = error.stack.split(/\n/);

        event.data = ["this is a test", error];
        const output = layout(event);
        const lines = output.split(/\n/);

        assert.equal(lines.length, stack.length);
        assert.equal(
          lines[0],
          "[2010-12-05T14:18:30.045] [DEBUG] tests - this is a test Error: Some made-up error"
        );
        for (i = 1; i < stack.length; i++) {
          assert.equal(lines[i], stack[i]);
        }
        assert.end();
      }
    );

    t.test(
      "should output any extra data in the log event as util.inspect strings",
      assert => {
        event.data = [
          "this is a test",
          {
            name: "Cheese",
            message: "Gorgonzola smells."
          }
        ];
        const output = layout(event);
        assert.equal(
          output,
          "[2010-12-05T14:18:30.045] [DEBUG] tests - this is a test " +
            "{ name: 'Cheese', message: 'Gorgonzola smells.' }"
        );
        assert.end();
      }
    );
    t.end();
  });

  batch.test("dummyLayout", t => {
    const layout = require("../../lib/layouts").dummyLayout;

    t.test("should output just the first element of the log data", assert => {
      const event = {
        data: ["this is the first value", "this is not"],
        startTime: new Date("2010-12-05 14:18:30.045"),
        categoryName: "multiple.levels.of.tests",
        level: {
          toString() {
            return "DEBUG";
          },
          colour: "cyan"
        }
      };

      assert.equal(layout(event), "this is the first value");
      assert.end();
    });
    t.end();
  });

  batch.test("patternLayout", t => {
    const tokens = {
      testString: "testStringToken",
      testFunction() {
        return "testFunctionToken";
      },
      fnThatUsesLogEvent(logEvent) {
        return logEvent.level.toString();
      }
    };

    // console.log([Error('123').stack.split('\n').slice(1).join('\n')])
    const callStack =
      "    at repl:1:14\n    at ContextifyScript.Script.runInThisContext (vm.js:50:33)\n    at REPLServer.defaultEval (repl.js:240:29)\n    at bound (domain.js:301:14)\n    at REPLServer.runBound [as eval] (domain.js:314:12)\n    at REPLServer.onLine (repl.js:468:10)\n    at emitOne (events.js:121:20)\n    at REPLServer.emit (events.js:211:7)\n    at REPLServer.Interface._onLine (readline.js:280:10)\n    at REPLServer.Interface._line (readline.js:629:8)"; // eslint-disable-line
    const fileName = path.normalize("/log4js-node/test/tap/layouts-test.js");
    const lineNumber = 1;
    const columnNumber = 14;
    const event = {
      data: ["this is a test"],
      startTime: new Date("2010-12-05 14:18:30.045"),
      categoryName: "multiple.levels.of.tests",
      level: {
        toString() {
          return "DEBUG";
        },
        colour: "cyan"
      },
      context: tokens,

      // location
      callStack,
      fileName,
      lineNumber,
      columnNumber
    };
    event.startTime.getTimezoneOffset = () => -600;

    const layout = require("../../lib/layouts").patternLayout;

    t.test('should default to "time logLevel loggerName - message"', assert => {
      testPattern(
        assert,
        layout,
        event,
        tokens,
        null,
        `14:18:30 DEBUG multiple.levels.of.tests - this is a test${EOL}`
      );
      assert.end();
    });

    t.test("%r should output time only", assert => {
      testPattern(assert, layout, event, tokens, "%r", "14:18:30");
      assert.end();
    });

    t.test("%p should output the log level", assert => {
      testPattern(assert, layout, event, tokens, "%p", "DEBUG");
      assert.end();
    });

    t.test("%c should output the log category", assert => {
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%c",
        "multiple.levels.of.tests"
      );
      assert.end();
    });

    t.test("%m should output the log data", assert => {
      testPattern(assert, layout, event, tokens, "%m", "this is a test");
      assert.end();
    });

    t.test("%n should output a new line", assert => {
      testPattern(assert, layout, event, tokens, "%n", EOL);
      assert.end();
    });

    t.test("%h should output hostname", assert => {
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%h",
        os.hostname().toString()
      );
      assert.end();
    });

    t.test("%z should output pid", assert => {
      testPattern(assert, layout, event, tokens, "%z", process.pid.toString());
      assert.end();
    });

    t.test("%z should pick up pid from log event if present", assert => {
      event.pid = "1234";
      testPattern(assert, layout, event, tokens, "%z", "1234");
      delete event.pid;
      assert.end();
    });

    t.test("%y should output pid (was cluster info)", assert => {
      testPattern(assert, layout, event, tokens, "%y", process.pid.toString());
      assert.end();
    });

    t.test(
      "%c should handle category names like java-style package names",
      assert => {
        testPattern(assert, layout, event, tokens, "%c{1}", "tests");
        testPattern(assert, layout, event, tokens, "%c{2}", "of.tests");
        testPattern(assert, layout, event, tokens, "%c{3}", "levels.of.tests");
        testPattern(
          assert,
          layout,
          event,
          tokens,
          "%c{4}",
          "multiple.levels.of.tests"
        );
        testPattern(
          assert,
          layout,
          event,
          tokens,
          "%c{5}",
          "multiple.levels.of.tests"
        );
        testPattern(
          assert,
          layout,
          event,
          tokens,
          "%c{99}",
          "multiple.levels.of.tests"
        );
        assert.end();
      }
    );

    t.test("%d should output the date in ISO8601 format", assert => {
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%d",
        "2010-12-05T14:18:30.045"
      );
      assert.end();
    });

    t.test("%d should allow for format specification", assert => {
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%d{ISO8601}",
        "2010-12-05T14:18:30.045"
      );

      // Commenting this test out, because it does not work in travis
      // for reasons I do not understand.
      // testPattern(
      //   assert,
      //   layout,
      //   event,
      //   tokens,
      //   "%d{ISO8601_WITH_TZ_OFFSET}",
      //   "2010-12-05T03:18:30.045+1000"
      // );

      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%d{ABSOLUTE}",
        "14:18:30.045"
      );
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%d{DATE}",
        "05 12 2010 14:18:30.045"
      );
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%d{yy MM dd hh mm ss}",
        "10 12 05 14 18 30"
      );
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%d{yyyy MM dd}",
        "2010 12 05"
      );
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%d{yyyy MM dd hh mm ss SSS}",
        "2010 12 05 14 18 30 045"
      );
      assert.end();
    });

    t.test("%% should output %", assert => {
      testPattern(assert, layout, event, tokens, "%%", "%");
      assert.end();
    });

    t.test("%f should output filename", assert => {
      testPattern(assert, layout, event, tokens, "%f", fileName);
      assert.end();
    });

    t.test("%f should handle filename depth", assert => {
      testPattern(assert, layout, event, tokens, "%f{1}", "layouts-test.js");
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%f{2}",
        path.join("tap", "layouts-test.js")
      );
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%f{3}",
        path.join("test", "tap", "layouts-test.js")
      );
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%f{4}",
        path.join("log4js-node","test","tap","layouts-test.js")
      );
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%f{5}",
        path.join("/log4js-node","test","tap","layouts-test.js")
      );
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%f{99}",
        path.join("/log4js-node","test","tap","layouts-test.js")
      );
      assert.end();
    });

    t.test("%f should accept truncation and padding", assert => {
      testPattern(assert, layout, event, tokens, "%.5f", fileName.substring(0, 5));
      testPattern(assert, layout, event, tokens, "%20f{1}", "     layouts-test.js");
      testPattern(assert, layout, event, tokens, "%30.30f{2}", `           ${  path.join("tap","layouts-test.js")}`);
      testPattern(assert, layout, event, tokens, "%10.-5f{1}", "     st.js");
      assert.end();
    });

    t.test("%l should output line number", assert => {
      testPattern(assert, layout, event, tokens, "%l", lineNumber.toString());
      assert.end();
    });

    t.test("%l should accept truncation and padding", assert => {
      testPattern(assert, layout, event, tokens, "%5.10l", "    1");
      testPattern(assert, layout, event, tokens, "%.5l", "1");
      testPattern(assert, layout, event, tokens, "%.-5l", "1");
      testPattern(assert, layout, event, tokens, "%-5l", "1    ");
      assert.end();
    });

    t.test("%o should output column postion", assert => {
      testPattern(assert, layout, event, tokens, "%o", columnNumber.toString());
      assert.end();
    });

    t.test("%o should accept truncation and padding", assert => {
      testPattern(assert, layout, event, tokens, "%5.10o", "   14");
      testPattern(assert, layout, event, tokens, "%.5o", "14");
      testPattern(assert, layout, event, tokens, "%.1o", "1");
      testPattern(assert, layout, event, tokens, "%.-1o", "4");
      testPattern(assert, layout, event, tokens, "%-5o", "14   ");
      assert.end();
    });

    t.test("%s should output stack", assert => {
      testPattern(assert, layout, event, tokens, "%s", callStack);
      assert.end();
    });

    t.test("%f should output empty string when fileName not exist", assert => {
      delete event.fileName;
      testPattern(assert, layout, event, tokens, "%f", "");
      assert.end();
    });

    t.test(
      "%l should output empty string when lineNumber not exist",
      assert => {
        delete event.lineNumber;
        testPattern(assert, layout, event, tokens, "%l", "");
        assert.end();
      }
    );

    t.test(
      "%o should output empty string when columnNumber not exist",
      assert => {
        delete event.columnNumber;
        testPattern(assert, layout, event, tokens, "%o", "");
        assert.end();
      }
    );

    t.test("%s should output empty string when callStack not exist", assert => {
      delete event.callStack;
      testPattern(assert, layout, event, tokens, "%s", "");
      assert.end();
    });

    t.test("should output anything not preceded by % as literal", assert => {
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "blah blah blah",
        "blah blah blah"
      );
      assert.end();
    });

    t.test(
      "should output the original string if no replacer matches the token",
      assert => {
        testPattern(assert, layout, event, tokens, "%a{3}", "a{3}");
        assert.end();
      }
    );

    t.test("should handle complicated patterns", assert => {
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%m%n %c{2} at %d{ABSOLUTE} cheese %p%n",
        `this is a test${EOL} of.tests at 14:18:30.045 cheese DEBUG${EOL}`
      );
      assert.end();
    });

    t.test("should truncate fields if specified", assert => {
      testPattern(assert, layout, event, tokens, "%.4m", "this");
      testPattern(assert, layout, event, tokens, "%.7m", "this is");
      testPattern(assert, layout, event, tokens, "%.9m", "this is a");
      testPattern(assert, layout, event, tokens, "%.14m", "this is a test");
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%.2919102m",
        "this is a test"
      );
      testPattern(assert, layout, event, tokens, "%.-4m", "test");
      assert.end();
    });

    t.test("should pad fields if specified", assert => {
      testPattern(assert, layout, event, tokens, "%10p", "     DEBUG");
      testPattern(assert, layout, event, tokens, "%8p", "   DEBUG");
      testPattern(assert, layout, event, tokens, "%6p", " DEBUG");
      testPattern(assert, layout, event, tokens, "%4p", "DEBUG");
      testPattern(assert, layout, event, tokens, "%-4p", "DEBUG");
      testPattern(assert, layout, event, tokens, "%-6p", "DEBUG ");
      testPattern(assert, layout, event, tokens, "%-8p", "DEBUG   ");
      testPattern(assert, layout, event, tokens, "%-10p", "DEBUG     ");
      assert.end();
    });

    t.test("%[%r%] should output colored time", assert => {
      testPattern(
        assert,
        layout,
        event,
        tokens,
        "%[%r%]",
        "\x1B[36m14:18:30\x1B[39m"
      );
      assert.end();
    });

    t.test(
      "%x{testString} should output the string stored in tokens",
      assert => {
        testPattern(
          assert,
          layout,
          event,
          tokens,
          "%x{testString}",
          "testStringToken"
        );
        assert.end();
      }
    );

    t.test(
      "%x{testFunction} should output the result of the function stored in tokens",
      assert => {
        testPattern(
          assert,
          layout,
          event,
          tokens,
          "%x{testFunction}",
          "testFunctionToken"
        );
        assert.end();
      }
    );

    t.test(
      "%x{doesNotExist} should output the string stored in tokens",
      assert => {
        testPattern(assert, layout, event, tokens, "%x{doesNotExist}", "null");
        assert.end();
      }
    );

    t.test(
      "%x{fnThatUsesLogEvent} should be able to use the logEvent",
      assert => {
        testPattern(
          assert,
          layout,
          event,
          tokens,
          "%x{fnThatUsesLogEvent}",
          "DEBUG"
        );
        assert.end();
      }
    );

    t.test("%x should output the string stored in tokens", assert => {
      testPattern(assert, layout, event, tokens, "%x", "null");
      assert.end();
    });

    t.test(
      "%X{testString} should output the string stored in tokens",
      assert => {
        testPattern(
          assert,
          layout,
          event,
          {},
          "%X{testString}",
          "testStringToken"
        );
        assert.end();
      }
    );

    t.test(
      "%X{testFunction} should output the result of the function stored in tokens",
      assert => {
        testPattern(
          assert,
          layout,
          event,
          {},
          "%X{testFunction}",
          "testFunctionToken"
        );
        assert.end();
      }
    );

    t.test(
      "%X{doesNotExist} should output the string stored in tokens",
      assert => {
        testPattern(assert, layout, event, {}, "%X{doesNotExist}", "null");
        assert.end();
      }
    );

    t.test(
      "%X{fnThatUsesLogEvent} should be able to use the logEvent",
      assert => {
        testPattern(
          assert,
          layout,
          event,
          {},
          "%X{fnThatUsesLogEvent}",
          "DEBUG"
        );
        assert.end();
      }
    );

    t.test("%X should output the string stored in tokens", assert => {
      testPattern(assert, layout, event, {}, "%X", "null");
      assert.end();
    });

    t.end();
  });

  batch.test("layout makers", t => {
    const layouts = require("../../lib/layouts");

    t.test("should have a maker for each layout", assert => {
      assert.ok(layouts.layout("messagePassThrough"));
      assert.ok(layouts.layout("basic"));
      assert.ok(layouts.layout("colored"));
      assert.ok(layouts.layout("coloured"));
      assert.ok(layouts.layout("pattern"));
      assert.ok(layouts.layout("dummy"));
      assert.end();
    });

    t.test(
      "layout pattern maker should pass pattern and tokens to layout from config",
      assert => {
        let layout = layouts.layout("pattern", { pattern: "%%" });
        assert.equal(layout({}), "%");
        layout = layouts.layout("pattern", {
          pattern: "%x{testStringToken}",
          tokens: { testStringToken: "cheese" }
        });
        assert.equal(layout({}), "cheese");
        assert.end();
      }
    );
    t.end();
  });

  batch.test("add layout", t => {
    const layouts = require("../../lib/layouts");

    t.test("should be able to add a layout", assert => {
      layouts.addLayout("test_layout", config => {
        assert.equal(config, "test_config");
        return function(logEvent) {
          return `TEST LAYOUT >${logEvent.data}`;
        };
      });
      const serializer = layouts.layout("test_layout", "test_config");
      assert.ok(serializer);
      assert.equal(serializer({ data: "INPUT" }), "TEST LAYOUT >INPUT");
      assert.end();
    });
    t.end();
  });

  batch.end();
});
