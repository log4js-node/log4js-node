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
  
  

  
  
  
end

