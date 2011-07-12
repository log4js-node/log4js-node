var vows = require('vows'),
assert = require('assert');

vows.describe('log4js layouts').addBatch({
    'colouredLayout': {
        topic: function() {
            return require('../lib/layouts').colouredLayout;
        },

        'should apply level colour codes to output': function(layout) {
            var output = layout({
                message: "nonsense",
                startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
                categoryName: "cheese",
                level: {
                    colour: "green",
                    toString: function() { return "ERROR"; }
                }
            });
            assert.equal(output, '\033[90m[2010-12-05 14:18:30.045] \033[39m\033[32m[ERROR] \033[39m\033[90mcheese - \033[39mnonsense');
        }
    },

    'messagePassThroughLayout': {
        topic: function() {
            return require('../lib/layouts').messagePassThroughLayout;
        },
        'should take a logevent and output only the message' : function(layout) {
            assert.equal(layout({
                message: "nonsense",
                startTime: new Date(2010, 11, 5, 14, 18, 30, 45),
                categoryName: "cheese",
                level: {
                    colour: "green",
                    toString: function() { return "ERROR"; }
                }
            }), "nonsense");
        }
    },

    'basicLayout': {
        topic: function() {
            var layout = require('../lib/layouts').basicLayout,
            event = {
                message: 'this is a test',
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

            event.exception = error;
            output = layout(event);
            lines = output.split(/\n/);

            assert.length(lines, stack.length+1);
            assert.equal(lines[0], "[2010-12-05 14:18:30.045] [DEBUG] tests - this is a test");
            assert.equal(lines[1], "[2010-12-05 14:18:30.045] [DEBUG] tests - Error: Some made-up error");
            for (var i = 1; i < stack.length; i++) {
                assert.equal(lines[i+1], stack[i]);
            }
        },
        'should output a name and message if the event has something that pretends to be an error': function(args) {
            var layout = args[0], event = args[1], output, lines;
            event.exception = {
                    name: 'Cheese',
                    message: 'Gorgonzola smells.'
            };
            output = layout(event);
            lines = output.split(/\n/);

            assert.length(lines, 2);
            assert.equal(lines[0], "[2010-12-05 14:18:30.045] [DEBUG] tests - this is a test");
            assert.equal(lines[1], "[2010-12-05 14:18:30.045] [DEBUG] tests - Cheese: Gorgonzola smells.");
        }
    }
}).export(module);

