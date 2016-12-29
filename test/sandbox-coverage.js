'use strict';

const sandbox = require('sandboxed-module');

sandbox.configure({
  sourceTransformers: {
    nyc: function (source) {
      const nyc = new (require('nyc'))();
      return nyc.instrumenter().instrumentSync(source, this.filename);
    }
  }
});
