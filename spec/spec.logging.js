describe 'log4js'
  before
      extend(context, {
          log4js : require("log4js")()
      });
  end

  before_each 
    log4js.clearAppenders();
    event = '';
    logger = log4js.getLogger('tests');
    logger.setLevel("TRACE");
    logger.addListener("log", function (logEvent) { event = logEvent; });    
  end
    
  describe 'addAppender'
    before_each
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
        
        otherEvent = undefined;
        appenderEvent = undefined;
        log4js.getLogger('pants').debug("this should not be propagated to otherEvent");
        otherEvent.should.be undefined
        appenderEvent.should.not.be undefined
        appenderEvent.message.should.be "this should not be propagated to otherEvent"
        
        cheeseLogger = null;
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
    
    describe 'with multiple categories'
      it 'should register the function as a listener for all the categories'
        log4js.addAppender(appender, 'tests', 'biscuits');
        
        logger.debug('this is a test');
        appenderEvent.should.be event
        appenderEvent = undefined;
        
        var otherLogger = log4js.getLogger('biscuits');
        otherLogger.debug("mmm... garibaldis");
        appenderEvent.should.not.be undefined
        appenderEvent.message.should.be "mmm... garibaldis"
        appenderEvent = undefined;
        
        otherLogger = null;
        
        log4js.getLogger("something else").debug("pants");
        appenderEvent.should.be undefined
      end
      
      it 'should register the function when the list of categories is an array'
        log4js.addAppender(appender, ['tests', 'pants']);
        
        logger.debug('this is a test');
        appenderEvent.should.be event
        appenderEvent = undefined;
        
        var otherLogger = log4js.getLogger('pants');
        otherLogger.debug("big pants");
        appenderEvent.should.not.be undefined
        appenderEvent.message.should.be "big pants"
        appenderEvent = undefined;
        
        otherLogger = null;
        
        log4js.getLogger("something else").debug("pants");
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
  
  
  describe 'logLevelFilter'
  
    it 'should only pass log events greater than or equal to its own level'
      var logEvent;
      log4js.addAppender(log4js.logLevelFilter('ERROR', function(evt) { logEvent = evt; }));
      logger.debug('this should not trigger an event');
      logEvent.should.be undefined
      
      logger.warn('neither should this');
      logEvent.should.be undefined
      
      logger.error('this should, though');
      logEvent.should.not.be undefined
      logEvent.message.should.be 'this should, though'
      
      logger.fatal('so should this')
      logEvent.message.should.be 'so should this'
    end
    
  end
  
  
end

