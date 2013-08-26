"use strict";
var assert = require('assert');

//used for patternLayout tests.
function test(layout, event, tokens, pattern, value) {
  assert.equal(layout(pattern, tokens)(event), value);
}

describe('log4js layouts', function() {
  describe('colouredLayout', function() {
    var layout = require('../lib/layouts').colouredLayout;
    
    it('should apply level colour codes to output', function() {
      var output = layout({
        data: ["nonsense"],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        category: "cheese",
        level: {
          toString: function() { return "ERROR"; }
        }
      });
      assert.equal(output, '\x1B[31m[2010-12-05 14:18:30.045] [ERROR] cheese - \x1B[39mnonsense');
    });

    it('should support the console.log format for the message', function() {
      var output = layout({
        data: ["thing %d", 2],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        category: "cheese",
        level: {
          toString: function() { return "ERROR"; }
        }
      });
      assert.equal(output, '\x1B[31m[2010-12-05 14:18:30.045] [ERROR] cheese - \x1B[39mthing 2');
    });

  });
  
  describe('messagePassThroughLayout', function() {
    var layout = require('../lib/layouts').messagePassThroughLayout;
    
    it('should take a logevent and output only the message', function() {
      assert.equal(layout({
        data: ["nonsense"],
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
        category: "cheese",
        level: {
          colour: "green",
          toString: function() { return "ERROR"; }
        }
      }), "nonsense");
    });

    it('should support the console.log format for the message', function() {
      assert.equal(layout({
        data: ["thing %d", 1, "cheese"], 
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45), 
        category: "cheese", 
        level : {
          colour: "green", 
          toString: function() { return "ERROR"; }
        }
      }), "thing 1 cheese");
    });

    it('should output the first item even if it is not a string', function() {
      assert.equal(layout({
        data: [ { thing: 1} ], 
        startTime: new Date(2010, 11, 5, 14, 18, 30, 45), 
        category: "cheese", 
        level: {
          colour: "green", 
          toString: function() { return "ERROR"; }
        }
      }), "{ thing: 1 }");
    });

    it('should print the stacks of a passed error objects', function() {
      assert.ok(
        Array.isArray(
          layout({
            data: [ new Error() ], 
            startTime: new Date(2010, 11, 5, 14, 18, 30, 45), 
            category: "cheese", 
            level: {
              colour: "green", 
              toString: function() { return "ERROR"; }
            }
          }).match(
              /Error\s+at Context\..*\s+\((.*)test[\\\/]layouts-test\.js\:\d+\:\d+\)\s/
          )
        ), 
        'regexp did not return a match'
      );
    });

    describe('with passed augmented errors', function() { 
      var layoutOutput;

      before(function() {
        var e = new Error("My Unique Error Message");
        e.augmented = "My Unique attribute value";
        e.augObj = { at1: "at2" };
        
        layoutOutput = layout({
          data: [ e ], 
          startTime: new Date(2010, 11, 5, 14, 18, 30, 45), 
          category: "cheese", 
          level: {
            colour: "green", 
            toString: function() { return "ERROR"; }
          }
        });
      });

      it('should print error the contained error message', function() {
        var m = layoutOutput.match(/\{ \[Error: My Unique Error Message\]/);
        assert.ok(Array.isArray(m));
      });

      it('should print error augmented string attributes', function() {
        var m = layoutOutput.match(/augmented:\s'My Unique attribute value'/);
        assert.ok(Array.isArray(m));
      });

      it('should print error augmented object attributes', function() {
        var m = layoutOutput.match(/augObj:\s\{ at1: 'at2' \}/);
        assert.ok(Array.isArray(m));
      });
    });
    
  });
  
  describe('basicLayout', function() {
    var layout = require('../lib/layouts').basicLayout
    , event = {
      data: ['this is a test'],
      startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
      category: "tests",
      level: {
        toString: function() { return "DEBUG"; }
      }
    };
    
    it('should take a logevent and output a formatted string', function() {
      assert.equal(layout(event), "[2010-12-05 14:18:30.045] [DEBUG] tests - this is a test");
    });

    it('should output a stacktrace, message if the event has an error attached', function() {
      var output
      , lines
      , error = new Error("Some made-up error")
      , stack = error.stack.split(/\n/);
      
      event.data = ['this is a test', error];
      output = layout(event);
      lines = output.split(/\n/);
      
      assert.equal(lines.length - 1, stack.length);
      assert.equal(
        lines[0], 
        "[2010-12-05 14:18:30.045] [DEBUG] tests - this is a test [Error: Some made-up error]"
      );
      
      for (var i = 1; i < stack.length; i++) {
        assert.equal(lines[i+2], stack[i+1]);
      }
    });

    it('should output any extra data in the log event as util.inspect strings', function() {
      var output, lines;

      event.data = ['this is a test', {
        name: 'Cheese',
        message: 'Gorgonzola smells.'
      }];
      output = layout(event);

      assert.equal(
        output, 
        "[2010-12-05 14:18:30.045] [DEBUG] tests - this is a test " + 
          "{ name: 'Cheese', message: 'Gorgonzola smells.' }"
      );
    });
  });
  
  describe('patternLayout', function() {
    var event = {
      data: ['this is a test'],
      startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
      category: "multiple.levels.of.tests",
      level: {
        toString: function() { return "DEBUG"; }
      }
    }
    , layout = require('../lib/layouts').patternLayout
    , tokens = {
      testString: 'testStringToken',
      testFunction: function() { return 'testFunctionToken'; },
      fnThatUsesLogEvent: function(logEvent) { return logEvent.level.toString(); }
    };

    event.startTime.getTimezoneOffset = function() { return 0; };
    
    it('should default to "time logLevel loggerName - message"', function() {
      test(layout, event, tokens, null, "14:18:30 DEBUG multiple.levels.of.tests - this is a test\n");
    });

    it('%r should output time only', function() {
      test(layout, event, tokens, '%r', '14:18:30');
    });

    it('%p should output the log level', function() {
      test(layout, event, tokens, '%p', 'DEBUG');
    });

    it('%c should output the log category', function() {
      test(layout, event, tokens, '%c', 'multiple.levels.of.tests');
    });

    it('%m should output the log data', function() {
      test(layout, event, tokens, '%m', 'this is a test');
    });

    it('%n should output a new line', function() {
      test(layout, event, tokens, '%n', '\n');
    });

    it('%h should output hostname', function() {
      test(layout, event, tokens, '%h', require('os').hostname().toString());
    });

    it('%c should handle category names like java-style package names', function() {
      test(layout, event, tokens, '%c{1}', 'tests');
      test(layout, event, tokens, '%c{2}', 'of.tests');
      test(layout, event, tokens, '%c{3}', 'levels.of.tests');
      test(layout, event, tokens, '%c{4}', 'multiple.levels.of.tests');
      test(layout, event, tokens, '%c{5}', 'multiple.levels.of.tests');
      test(layout, event, tokens, '%c{99}', 'multiple.levels.of.tests');
    });

    it('%d should output the date in ISO8601 format', function() {
      test(layout, event, tokens, '%d', '2010-12-05 14:18:30.045');
    });

    it('%d should allow for format specification', function() {
      test(layout, event, tokens, '%d{ISO8601_WITH_TZ_OFFSET}', '2010-12-05T14:18:30-0000');
      test(layout, event, tokens, '%d{ISO8601}', '2010-12-05 14:18:30.045');
      test(layout, event, tokens, '%d{ABSOLUTE}', '14:18:30.045');
      test(layout, event, tokens, '%d{DATE}', '05 12 2010 14:18:30.045');
      test(layout, event, tokens, '%d{yy MM dd hh mm ss}', '10 12 05 14 18 30');
      test(layout, event, tokens, '%d{yyyy MM dd}', '2010 12 05');
      test(layout, event, tokens, '%d{yyyy MM dd hh mm ss SSS}', '2010 12 05 14 18 30 045');
    });

    it('%% should output %', function() {
      test(layout, event, tokens, '%%', '%');
    });

    it('should output anything not preceded by % as literal', function() {
      test(layout, event, tokens, 'blah blah blah', 'blah blah blah');
    });

    it('should output the original string if no replacer matches the token', function() {
      test(layout, event, tokens, '%a{3}', 'a{3}');
    });

    it('should handle complicated patterns', function() {
      test(layout, event, tokens,
           '%m%n %c{2} at %d{ABSOLUTE} cheese %p%n',
           'this is a test\n of.tests at 14:18:30.045 cheese DEBUG\n'
          );
    });

    it('should truncate fields if specified', function() {
      test(layout, event, tokens, '%.4m', 'this');
      test(layout, event, tokens, '%.7m', 'this is');
      test(layout, event, tokens, '%.9m', 'this is a');
      test(layout, event, tokens, '%.14m', 'this is a test');
      test(layout, event, tokens, '%.2919102m', 'this is a test');
    });

    it('should pad fields if specified', function() {
      test(layout, event, tokens, '%10p', '     DEBUG');
      test(layout, event, tokens, '%8p', '   DEBUG');
      test(layout, event, tokens, '%6p', ' DEBUG');
      test(layout, event, tokens, '%4p', 'DEBUG');
      test(layout, event, tokens, '%-4p', 'DEBUG');
      test(layout, event, tokens, '%-6p', 'DEBUG ');
      test(layout, event, tokens, '%-8p', 'DEBUG   ');
      test(layout, event, tokens, '%-10p', 'DEBUG     ');
    });

    it('%[%r%] should output colored time', function() {
      test(layout, event, tokens, '%[%r%]', '\x1B[36m14:18:30\x1B[39m');
    });

    it('%x{testString} should output the string stored in tokens', function() {
      test(layout, event, tokens, '%x{testString}', 'testStringToken');
    });

    it('%x{testFunction} should output the result of the function stored in tokens', function() {
      test(layout, event, tokens, '%x{testFunction}', 'testFunctionToken');
    });

    it('%x{doesNotExist} should output the string stored in tokens', function() {
      test(layout, event, tokens, '%x{doesNotExist}', '%x{doesNotExist}');
    });

    it('%x{fnThatUsesLogEvent} should be able to use the logEvent', function() {
      test(layout, event, tokens, '%x{fnThatUsesLogEvent}', 'DEBUG');
    });

    it('%x should output the string stored in tokens', function() {
      test(layout, event, tokens, '%x', '%x');
    });
  });

  describe('layout makers', function() {
    var layouts = require('../lib/layouts');

    it('should have a maker for each layout', function() {
      assert.ok(layouts.layout("messagePassThrough"));
      assert.ok(layouts.layout("basic"));
      assert.ok(layouts.layout("colored"));
      assert.ok(layouts.layout("coloured"));
      assert.ok(layouts.layout("pattern"));
    });
  });
});
