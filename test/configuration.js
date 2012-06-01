var assert = require('assert'),
    vows = require('vows'),
    sandbox = require('sandboxed-module');

function makeTestAppender() {
    return {
        configure: function(config, options) {
            this.configureCalled = true;
            this.config = config;
            this.options = options;
            return this.appender();
        },
        appender: function() {
            var self = this;
            return function(logEvt) { self.logEvt = logEvt; }
        }
    };
}

vows.describe('log4js configure').addBatch({
    'appenders': {
        'when specified by type': {
            topic: function() {
                var testAppender = makeTestAppender(),
                    log4js = sandbox.require(
                        '../lib/log4js',
                        {
                            requires: {
                                './appenders/cheese': testAppender
                            }
                        }
                    );
                log4js.configure(
                    {
                        appenders: [
                            { type: "cheese", flavour: "gouda" }
                        ]
                    },
                    { pants: "yes" }
                );
                return testAppender;
            },
            'should load appender': function(testAppender) {
                assert.ok(testAppender.configureCalled);
            },
            'should pass config to appender': function(testAppender) {
                assert.equal(testAppender.config.flavour, 'gouda');
            },
            'should pass log4js options to appender': function(testAppender) {
                assert.equal(testAppender.options.pants, 'yes');
            }
        },
        'when core appender loaded via loadAppender': {
            topic: function() {
                var testAppender = makeTestAppender(),
                    log4js = sandbox.require(
                        '../lib/log4js',
                        { requires: { './appenders/cheese': testAppender } }
                    );

                log4js.loadAppender('cheese');
                return log4js;
            },
            'should load appender from ../lib/appenders': function(log4js) {
                assert.ok(log4js.appenders.cheese);
            },
            'should add appender configure function to appenderMakers' : function(log4js) {
                assert.isFunction(log4js.appenderMakers.cheese);
            }
        },
        'when appender in node_modules loaded via loadAppender': {
            topic: function() {
                var testAppender = makeTestAppender(),
                log4js = sandbox.require(
                    '../lib/log4js',
                    { requires: { 'some/other/external': testAppender } }
                );
                log4js.loadAppender('some/other/external');
                return log4js;
            },
            'should load appender via require': function(log4js) {
                assert.ok(log4js.appenders['some/other/external']);
            },
            'should add appender configure function to appenderMakers': function(log4js) {
                assert.isFunction(log4js.appenderMakers['some/other/external']);
            }
        }
    }
}).exportTo(module);
