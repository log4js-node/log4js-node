"use strict";
var fs = require('fs');
var path = require('path');
var osSep = path.sep;

function mkdirSync_p(parts, mode, position) {
  mode = mode || process.umask();
  position = position || 0;
  
  if (position >= parts.length) {
    return;
  }
  
  var directory = parts.slice(0, position + 1).join(osSep) || osSep;
  try {
    fs.statSync(directory);
  } catch (e) {
    try {
      fs.mkdirSync(directory, mode);
    } catch (e) {
      if (e.code != 'EEXIST') {
        throw e;
      }
    }
  }
  mkdirSync_p(parts, mode, position + 1);
}

function mkdirSync(aPath, mode, recursive) {
  if (typeof recursive !== 'boolean') {
    recursive = false;
  }
  
  if (!recursive) {
    fs.mkdirSync(aPath, aMode);
  } else {
    mkdirSync_p(path.normalize(aPath).split(osSep), mode);
  }
}


function createDirectory(aDirectory) {
  var dirExists = false;
  try {
    dirExists = fs.statSync(aDirectory).isDirectory();
  } catch (e) {
  }

  if (!dirExists) {
    try {
      mkdirSync(aDirectory, 777, true);
    } catch (e) {
      return false;
    }
  }
  return true;
}

function removeDirectory(aPath) {
  aPath = path.normalize(aPath);
  var files = [];
  if (fs.existsSync(aPath)) {
    files = fs.readdirSync(aPath);
    files.forEach(function (file, index) {
      var curPath = path.join(aPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        removeDirectory(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(aPath);
  }
};

module.exports = {
  createDirectory: createDirectory,
  removeDirectory: removeDirectory
};