# Writing Appenders for Log4js

Log4js can load appenders from outside its core set. To add a custom appender, the easiest way is to make it a stand-alone module and publish to npm. You can also load appenders from your own application, but they must be defined in a module.

## Loading mechanism

When log4js parses your configuration, it loops through the defined appenders. For each one, it will `require` the appender initially using the `type` value prepended with './appenders' as the module identifier - this is to try loading from the core appenders first. If that fails (the module could not be found in the core appenders), then log4js will try to require the module using just the `type` value. If that fails, an error will be raised.

## Appender Modules

An appender module should export a single function called `configure`. The function should accept the following arguments:
* `config` - `object` - the appender's configuration object
* `layouts` - `module` - gives access to the [layouts](layouts.md) module, which most appenders will need
  * `layout` - `function(type, config)` - this is the main function that appenders will use to find a layout
* `findAppender` - `function(name)` - if your appender is a wrapper around another appender (like the [logLevelFilter](logLevelFilter.md) for example), this function can be used to find another appender by name
* `levels` - `module` - gives access to the [levels](levels.md) module, which most appenders will need

`configure` should return a function which accepts a logEvent, which is the appender itself. One of the simplest examples is the [stdout](stdout.md) appender. Let's run through the code.

## Example
```javascript
// This is the function that generates an appender function
function stdoutAppender(layout, timezoneOffset) {
  // This is the appender function itself
  return (loggingEvent) => {
    process.stdout.write(`${layout(loggingEvent, timezoneOffset)}\n`);
  };
}

// stdout configure doesn't need to use findAppender, or levels
function configure(config, layouts) {
  // the default layout for the appender
  let layout = layouts.colouredLayout;
  // check if there is another layout specified
  if (config.layout) {
    // load the layout
    layout = layouts.layout(config.layout.type, config.layout);
  }
  //create a new appender instance
  return stdoutAppender(layout, config.timezoneOffset);
}

//export the only function needed
exports.configure = configure;
```

# Shutdown functions

It's a good idea to implement a `shutdown` function on your appender instances. This function will get called by `log4js.shutdown` and signals that `log4js` has been asked to stop logging. Usually this is because of a fatal exception, or the application is being stopped. Your shutdown function should make sure that all asynchronous operations finish, and that any resources are cleaned up. The function must be named `shutdown`, take one callback argument, and be a property of the appender instance. Let's add a shutdown function to the `stdout` appender as an example.

## Example (shutdown)
```javascript
// This is the function that generates an appender function
function stdoutAppender(layout, timezoneOffset) {
  // This is the appender function itself
  const appender = (loggingEvent) => {
    process.stdout.write(`${layout(loggingEvent, timezoneOffset)}\n`);
  };

  // add a shutdown function.
  appender.shutdown = (done) => {
    process.stdout.write('', done);
  };

  return appender;
}

// ... rest of the code as above
```
