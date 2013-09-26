"use strict";
var assert = require('assert');
var vows = require('vows');
var layouts = require('../lib/layouts');
var sandbox = require('sandboxed-module');
var LoggingEvent = require('../lib/logger').LoggingEvent;
var cluster = require('cluster');

vows.describe('log4js cluster appender').addBatch({
	'when in master mode': {
		topic: function() {

			var registeredClusterEvents = [];
			var loggingEvents = [];
			
			// Fake cluster module, so no cluster listeners be really added 
			var fakeCluster = {
			
				on: function(event, callback) {
					registeredClusterEvents.push(event);
				},
				
				isMaster: true,
				isWorker: false,
				
			};
		
			var fakeActualAppender = function(loggingEvent) {
				loggingEvents.push(loggingEvent);
			}
			
			// Load appender and fake modules in it
			var appenderModule = sandbox.require('../lib/appenders/clustered', {
				requires: {
					'cluster': fakeCluster,
				}
			});
		
			var masterAppender = appenderModule.appender({
				actualAppenders: [ fakeActualAppender ]
			});

			// Actual test - log message using masterAppender
			masterAppender(new LoggingEvent('wovs', 'Info', ['masterAppender test']));
			
			var returnValue = {
				registeredClusterEvents: registeredClusterEvents,
				loggingEvents: loggingEvents,
			};
		
			return returnValue;
		}, 
		
		"should register 'fork' event listener on 'cluster'": function(topic) { 
			assert.equal(topic.registeredClusterEvents[0], 'fork');
		},
		
		"should log using actual appender": function(topic) {
			assert.equal(topic.loggingEvents[0].data[0], 'masterAppender test');
		},
		
	},
	
	'when in worker mode': {
		
		topic: function() {
			
			var registeredProcessEvents = [];
			
			// Fake cluster module, to fake we're inside a worker process
			var fakeCluster = {
			
				isMaster: false,
				isWorker: true,
				
			};
			
			var fakeProcess = {
			
				send: function(data) {
					registeredProcessEvents.push(data);
				},
				
			};
			
			// Load appender and fake modules in it
			var appenderModule = sandbox.require('../lib/appenders/clustered', {
				requires: {
					'cluster': fakeCluster,
				},
				globals: {
					'process': fakeProcess,
				}
			});
			
			var workerAppender = appenderModule.appender();

			// Actual test - log message using masterAppender
			workerAppender(new LoggingEvent('wovs', 'Info', ['workerAppender test']));
			workerAppender(new LoggingEvent('wovs', 'Info', [new Error('Error test')]));
			
			var returnValue = {
				registeredProcessEvents: registeredProcessEvents,
			};
			
			return returnValue;
		
		},
		
		"worker appender should call process.send" : function(topic) {
			assert.equal(topic.registeredProcessEvents[0].type, '::log-message');
			assert.equal(JSON.parse(topic.registeredProcessEvents[0].event).data[0], "workerAppender test");
		},
		
		"worker should serialize an Error correctly" : function(topic) {
			var expected = { stack: 'Error: Error test\n    at Object.vows.describe.addBatch.when in worker mode.topic (/home/vagrant/log4js-node/test/clusteredAppender-test.js:100:53)\n    at run (/home/vagrant/log4js-node/node_modules/vows/lib/vows/suite.js:134:35)\n    at EventEmitter.Suite.runBatch.callback (/home/vagrant/log4js-node/node_modules/vows/lib/vows/suite.js:234:40)\n    at EventEmitter.emit (events.js:126:20)\n    at EventEmitter.vows.describe.options.Emitter.emit (/home/vagrant/log4js-node/node_modules/vows/lib/vows.js:237:24)\n    at Suite.runBatch.topic (/home/vagrant/log4js-node/node_modules/vows/lib/vows/suite.js:169:45)\n    at process.startup.processNextTick.process._tickCallback (node.js:245:9)' };
			assert.equal(topic.registeredProcessEvents[1].type, '::log-message');
			assert.equal(JSON.stringify(JSON.parse(topic.registeredProcessEvents[1].event).data[0]), JSON.stringify(expected));
		}
		
	}

}).exportTo(module);
