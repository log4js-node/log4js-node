posix = require('posix');

waitForWriteAndThenRead = function(filename) {
  //here's the tricky part - writes are asynchronous
  //so I'm going to make a promise, wait a bit and then
  //try to read the file.
  var content, promise = new process.Promise();
  setTimeout(function() {
    promise.emitSuccess();
  }, 50);
  promise.addCallback(function() {
    posix.cat(filename).addCallback(
      function(fileContents) { content = fileContents; }
    ).wait();
  }).wait();

  return content;
}

describe 'log4js'
  before_each 
    log4js.clearAppenders();
    event = '';
    logger = log4js.getLogger('tests');
    logger.setLevel("TRACE");
    logger.addListener("log", function (logEvent) { event = logEvent; });    
  end
  
  it 'should have a version'
    log4js.version.should.not.be undefined
  end

  describe 'getLogger'
          
    it 'should take a category and return a Logger'
      logger.category.should.be 'tests'
      logger.level.should.be log4js.levels.TRACE
      logger.should.respond_to 'debug'
      logger.should.respond_to 'info'
      logger.should.respond_to 'warn'
      logger.should.respond_to 'error'
      logger.should.respond_to 'fatal'
    end
    
    it 'should emit log events'
      logger.trace("Trace event");
      
      event.level.toString().should.be 'TRACE'
      event.message.should.be 'Trace event'
      event.startTime.should.not.be undefined
    end
    
    it 'should not emit events of a lower level than the minimum'
      logger.setLevel("DEBUG");
      event = undefined;
      logger.trace("This should not generate a log message");
      event.should.be undefined
    end
  end
  
  describe 'addAppender'
    before_each
      log4js.clearAppenders();
      appenderEvent = undefined;
      appender = function(logEvent) { appenderEvent = logEvent; };
    end
        
    describe 'without a category'
      it 'should register the function as a listener for all loggers'
        log4js.addAppender(appender);
        logger.debug("This is a test");
        appenderEvent.should.be event
      end
      
      it 'should also register as an appender for loggers if an appender for that category is defined'
        var otherEvent;
        log4js.addAppender(appender);
        log4js.addAppender(function (evt) { otherEvent = evt; }, 'cheese');
        
        var cheeseLogger = log4js.getLogger('cheese');
        cheeseLogger.addListener("log", function (logEvent) { event = logEvent; });    

        cheeseLogger.debug('This is a test');
        
        appenderEvent.should.be event
        otherEvent.should.be event
      end
    end
    
    describe 'with a category'
      it 'should only register the function as a listener for that category'
        log4js.addAppender(appender, 'tests');
        
        logger.debug('this is a test');
        appenderEvent.should.be event
        
        appenderEvent = undefined;
        log4js.getLogger('some other category').debug('Cheese');
        appenderEvent.should.be undefined
      end
    end
    
  end
  
  describe 'basicLayout'
    it 'should take a logevent and output a formatted string'
      logger.debug('this is a test');
      var output = log4js.basicLayout(event);
      output.should.match /\[.*?\] \[DEBUG\] tests - this is a test/
    end
    
    it 'should output a stacktrace, message if the event has an error attached'
      var error = new Error("Some made-up error");
      var stack = error.stack.split(/\n/);
      
      logger.debug('this is a test', error);

      var output = log4js.basicLayout(event);
      var lines = output.split(/\n/);
      lines.length.should.be stack.length+1 
      lines[0].should.match /\[.*?\] \[DEBUG\] tests - this is a test/
      lines[1].should.match /\[.*?\] \[DEBUG\] tests - Error: Some made-up error/
      for (var i = 1; i < stack.length; i++) {
        lines[i+1].should.eql stack[i]
      }
    end
    
    it 'should output a name and message if the event has something that pretends to be an error'
      logger.debug('this is a test', { name: 'Cheese', message: 'Gorgonzola smells.' });
      var output = log4js.basicLayout(event);
      var lines = output.split(/\n/);
      lines.length.should.be 2 
      lines[0].should.match /\[.*?\] \[DEBUG\] tests - this is a test/
      lines[1].should.match /\[.*?\] \[DEBUG\] tests - Cheese: Gorgonzola smells./
    end
  end
  
  describe 'messagePassThroughLayout'
    it 'should take a logevent and output only the message'
      logger.debug('this is a test');
      log4js.messagePassThroughLayout(event).should.be 'this is a test'
    end
  end
  
  describe 'fileAppender'
    before
      log4js.clearAppenders();
      try {
        posix.unlink('./tmp-tests.log').wait();
      } catch(e) {
        print('Could not delete tmp-tests.log: '+e.message);
      }
    end
    
    it 'should write log events to a file'
      log4js.addAppender(log4js.fileAppender('./tmp-tests.log', log4js.messagePassThroughLayout), 'tests');
      logger.debug('this is a test');
      
      var content = waitForWriteAndThenRead('./tmp-tests.log');      
      content.should.be 'this is a test\n'
    end
  end
  
  describe 'configure'    
    before
      log4js.clearAppenders();
      try {
        posix.unlink('./tmp-tests.log').wait();
      } catch(e) {
        print('Could not delete tmp-tests.log: '+e.message);
      }
    end

    it 'should load appender configuration from a json file'
      //this config file defines one file appender (to ./tmp-tests.log)
      //and sets the log level for "tests" to WARN
      log4js.configure('spec/fixtures/log4js.json');
      event = undefined;
      
      logger.info('this should not fire an event');
      event.should.be undefined
      
      logger.warn('this should fire an event');
      event.message.should.be 'this should fire an event'
      waitForWriteAndThenRead('./tmp-tests.log').should.be 'this should fire an event\n'
    end
  end
end

describe 'Date'
  describe 'toFormattedString'
    it 'should add a toFormattedString method to Date'
      var date = new Date();
      date.should.respond_to 'toFormattedString'
    end
    
    it 'should default to a format'
      var date = new Date(2010, 0, 11, 14, 31, 30, 5);
      date.toFormattedString().should.be '2010-01-11 14:31:30.005'
    end
  end
end
