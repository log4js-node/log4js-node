# log4js-node

This is a conversion of the [log4js](http://log4js.berlios.de/index.html) 
framework to work with [node](http://nodejs.org). I've mainly stripped out the browser-specific code
and tidied up some of the javascript.

NOTE: since v0.2.0 require('log4js') returns a function, so you need to call that function in your code before you can use it. I've done this to make testing easier (allows dependency injection).

## installation

npm install log4js

## tests

Tests now use [vows](http://vowsjs.org), run with `vows test/logging.js`. I am slowly porting the previous tests from jspec (run those with `node tests.js`), since jspec is no longer maintained.

## usage

See example.js:

    var log4js = require('log4js')(); //note the need to call the function
    log4js.addAppender(log4js.consoleAppender());
    log4js.addAppender(log4js.fileAppender('logs/cheese.log'), 'cheese');
    
    var logger = log4js.getLogger('cheese');
    logger.setLevel('ERROR');
    
    logger.trace('Entering cheese testing');
    logger.debug('Got cheese.');
    logger.info('Cheese is Gouda.');  
    logger.warn('Cheese is quite smelly.');
    logger.error('Cheese is too ripe!');
    logger.fatal('Cheese was breeding ground for listeria.');
  
Output
    [2010-01-17 11:43:37.987] [ERROR] cheese - Cheese is too ripe!
    [2010-01-17 11:43:37.990] [FATAL] cheese - Cheese was breeding ground for listeria.

  
## configuration

You can either configure the appenders and log levels manually (as above), or provide a 
configuration file (`log4js.configure('path/to/file.json')`). An example file can be found
in test/log4js.json

## todo

I need to make a RollingFileAppender, which will do log rotation.

patternLayout has no tests. This is mainly because I haven't found a use for it yet, 
and am not entirely sure what it was supposed to do. It is more-or-less intact from 
the original log4js.

## author (of this node version)

Gareth Jones (csausdev - gareth.jones@sensis.com.au)

## License

The original log4js was distributed under the Apache 2.0 License, and so is this. I've tried to
keep the original copyright and author credits in place, except in sections that I have rewritten 
extensively.
