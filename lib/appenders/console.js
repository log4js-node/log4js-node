"use strict";
var consoleLog = console.log.bind(console);

module.exports = function(layouts, levels) {
  
  function consoleAppender (layout) {
    layout = layout || layouts.colouredLayout;
    return function(loggingEvent) {
      consoleLog(layout(loggingEvent));
    };
  }

  return function configure(config) {
    var layout;
    if (config.layout) {
      layout = layouts.layout(config.layout.type, config.layout);
    }
    return consoleAppender(layout);
  };

};
