const sandbox = require('@log4js-node/sandboxed-module');

sandbox.configure({
  sourceTransformers: {
    nyc(source) {
      if (this.filename.indexOf('node_modules') > -1) {
        return source;
      }
      const nyc = new (require('nyc'))({});
      return nyc
        .instrumenter()
        .instrumentSync(source, this.filename, { registerMap: () => {} });
    },
  },
});

// polyfill for Node.js <12
Promise.allSettled =
  Promise.allSettled ||
  ((promises) =>
    Promise.all(
      promises.map((p) =>
        p
          .then((value) => ({
            status: 'fulfilled',
            value,
          }))
          .catch((reason) => ({
            status: 'rejected',
            reason,
          }))
      )
    ));

// polyfill for Node.js <10
process.off = process.off || process.removeListener;

// polyfill for Node.js <10
const fs = require('fs'); // eslint-disable-line import/newline-after-import
fs.promises = fs.promises || {};
fs.promises.unlink =
  fs.promises.unlink ||
  ((...args) =>
    new Promise((resolve, reject) => {
      fs.unlink(...args, (err) => (err ? reject(err) : resolve()));
    }));
