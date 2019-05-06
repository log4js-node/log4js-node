// Dummy appender for test purposes; set config.label to identify instances in a test

function createDummyAppender() { // This is the function that generates an appender function
  // This is the appender function itself
  return (/* loggingEvent */) => {
    // do nothing
    // console.log(loggingEvent.data);
  };
}

function configure(config) {
  // create a new appender instance
  const appender = createDummyAppender();
  appender.label = config.label;
  return appender;
}

// export the only function needed
exports.configure = configure;
