var vows = require('vows'),
assert = require('assert');

vows.describe('log4js layouts').addBatch({
    'colouredLayout': {
        topic: function() {
            return require('../lib/layouts').colouredLayout;
        },

        'should apply level colour codes to output': function(layout) {
            var output = layout({
                data: ["nonsense"],
                startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
                categoryName: "cheese",
                level: {
                    colour: "green",
                    toString: function() { return "ERROR"; }
                }
            });
            assert.equal(output, '\033[32m[2010-12-05 14:18:30.045] [ERROR] cheese - \033[39mnonsense');
        },

        'should support the console.log format for the message': function(layout) {
            var output = layout({
                data: ["thing %d", 2],
                startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
                categoryName: "cheese",
                level: {
                    colour: "green",
                    toString: function() { return "ERROR"; }
                }
            });
            assert.equal(output, '\033[32m[2010-12-05 14:18:30.045] [ERROR] cheese - \033[39mthing 2');
        }
    },

    'messagePassThroughLayout': {
        topic: function() {
            return require('../lib/layouts').messagePassThroughLayout;
        },
        'should take a logevent and output only the message' : function(layout) {
            assert.equal(layout({
                data: ["nonsense"],
                startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
                categoryName: "cheese",
                level: {
                    colour: "green",
                    toString: function() { return "ERROR"; }
                }
            }), "nonsense");
        },
        'should support the console.log format for the message' : function(layout) {
              assert.equal(layout({
                  data: ["thing %d", 1]
                , startTime: new Date(2010, 11, 5, 14, 18, 30, 45)
                , categoryName: "cheese"
                , level : {
                    colour: "green"
                  , toString: function() { return "ERROR"; }
                }
              }), "thing 1");
          }
    },

    'basicLayout': {
        topic: function() {
            var layout = require('../lib/layouts').basicLayout,
            event = {
                data: ['this is a test'],
                startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
                categoryName: "tests",
                level: {
                    colour: "green",
                    toString: function() { return "DEBUG"; }
                }
            };
            return [layout, event];
        },
        'should take a logevent and output a formatted string': function(args) {
            var layout = args[0], event = args[1];
            assert.equal(layout(event), "[2010-12-05 14:18:30.045] [DEBUG] tests - this is a test");
        },
        'should output a stacktrace, message if the event has an error attached': function(args) {
            var layout = args[0], event = args[1], output, lines,
            error = new Error("Some made-up error"),
            stack = error.stack.split(/\n/);

            event.data = ['this is a test', error];
            output = layout(event);
            lines = output.split(/\n/);

            assert.length(lines, stack.length+1);
            assert.equal(lines[0], "[2010-12-05 14:18:30.045] [DEBUG] tests - this is a test");
            assert.equal(lines[1], "Error: Some made-up error");
            for (var i = 1; i < stack.length; i++) {
                assert.equal(lines[i+1], stack[i]);
            }
        },
        'should output any extra data in the log event as util.inspect strings': function(args) {
            var layout = args[0], event = args[1], output, lines;
            event.data = ['this is a test', {
                    name: 'Cheese',
                    message: 'Gorgonzola smells.'
            }];
            output = layout(event);
            lines = output.split(/\n/);

            assert.length(lines, 2);
            assert.equal(lines[0], "[2010-12-05 14:18:30.045] [DEBUG] tests - this is a test");
            assert.equal(lines[1], "{ name: 'Cheese', message: 'Gorgonzola smells.' }");
        }
    }
}).export(module);

