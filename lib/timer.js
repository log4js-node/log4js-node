"use strict";

function Timer(name, level) {
  this.name = name;
  this.level = level.toLowerCase();
  this.start = Date().getTime();
  return this;
}

Timer.prototype.report = function(logger) {
  var elapsed =  Date().getTime() - this.start;
  logger[this.level].call(logger, this.name + ": " + elapsed + "ms");
};

exports.Timer = Timer;
