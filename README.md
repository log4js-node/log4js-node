# log4js-node

NOTE: v0.3.8 of log4js is the last that will work with node versions older than 0.4. To use v0.3.9 you will need node 0.4 or later.

This is a conversion of the [log4js](http://log4js.berlios.de/index.html) 
framework to work with [node](http://nodejs.org). I've mainly stripped out the browser-specific code
and tidied up some of the javascript. It includes a basic file logger, with log rolling based on file size, and also replaces node's console.log functions. 

NOTE: in v0.2.x require('log4js') returned a function, and you needed to call that function in your code before you could use it. This was to make testing easier. v0.3.x make use of [felixge's sandbox-module](https://github.com/felixge/node-sandboxed-module), so we don't need to return a function.

## installation

npm install log4js

## tests

Tests now use [vows](http://vowsjs.org), run with `vows test/*.js`. 

## usage

Minimalist version:

           var log4js = require('log4js');
           var logger = log4js.getLogger();
           logger.debug("Some debug messages");

By default, log4js outputs to stdout with the coloured layout (thanks to [masylum](http://github.com/masylum)), so for the above you would see:

    [2010-01-17 11:43:37.987] [DEBUG] [default] - Some debug messages

See example.js:

    var log4js = require('log4js'); //note the need to call the function
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
  
Output:

    [2010-01-17 11:43:37.987] [ERROR] cheese - Cheese is too ripe!
    [2010-01-17 11:43:37.990] [FATAL] cheese - Cheese was breeding ground for listeria.

  
## configuration

You can either configure the appenders and log levels manually (as above), or provide a 
configuration file (`log4js.configure('path/to/file.json')`) explicitly, or just let log4js look for a file called `log4js.json` (it looks in the current directory first, then the require paths, and finally looks for the default config included in the same directory as the `log4js.js` file). 
An example file can be found in `test/log4js.json`. An example config file with log rolling is in `test/with-log-rolling.json`.
By default, the configuration file is checked for changes every 60 seconds, and if changed, reloaded. This allows changes to logging levels
to occur without restarting the application.

To turn off configuration file change checking, configure with:

    var log4js = require('log4js');
    log4js.configure(undefined, {}); // load 'log4js.json' from NODE_PATH

Or:

    log4js.configure('my_log4js_configuration.json', {});

To specify a different period:

    log4js.configure(undefined, { reloadSecs: 300 }); // load 'log4js.json' from NODE_PATH

You can also pass an object to the configure function, which has the same properties as the json versions.

## connect/express logger

A connect/express logger has been added to log4js, by [danbell](https://github.com/danbell). This allows connect/express servers to log using log4js. See example-connect-logger.js. 

    var log4js = require('./lib/log4js');
    log4js.addAppender(log4js.consoleAppender());
    log4js.addAppender(log4js.fileAppender('cheese.log'), 'cheese');
      
    var logger = log4js.getLogger('cheese');
    
    logger.setLevel('INFO');
    
    var app = require('express').createServer();
    app.configure(function() {
        app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO }));
    });
    app.get('/', function(req,res) {
        res.send('hello world');
    });
    app.listen(5000);

The options object that is passed to log4js.connectLogger supports a format string the same as the connect/express logger. For example:

    app.configure(function() {
        app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO, format: ':method :url' }));
    });

## author (of this node version)

Gareth Jones (csausdev - gareth.jones@sensis.com.au)

## License

The original log4js was distributed under the Apache 2.0 License, and so is this. I've tried to
keep the original copyright and author credits in place, except in sections that I have rewritten 
extensively.
