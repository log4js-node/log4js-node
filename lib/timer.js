"use strict";

function Timer(name, level) {
  this.name = name;
  this.level = level.toLowerCase();
  this.start = new Date().getTime();
  return this;
}

Timer.prototype.report = function(logger) {
  var elapsed =  new Date().getTime() - this.start;
  logger[this.level].call(logger, this.name + ": " + elapsed + "ms");
};

exports.Timer = Timer;
