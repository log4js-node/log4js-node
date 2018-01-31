'use strict';

const sandbox = require('@log4js-node/sandboxed-module');

sandbox.configure({
  sourceTransformers: {
    nyc: function (source) {
      if (this.filename.indexOf('node_modules') > -1) {
        return source;
      }
      const nyc = new (require('nyc'))();
      return nyc.instrumenter().instrumentSync(source, this.filename);
    }
  }
});
