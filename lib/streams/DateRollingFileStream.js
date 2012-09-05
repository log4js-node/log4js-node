var BaseRollingFileStream = require('./BaseRollingFileStream'),
    util = require('util');

module.exports = DateRollingFileStream;

function DateRollingFileStream(filename, pattern, options) {
    if (typeof(pattern) === 'object') {
        options = pattern;
        pattern = null;
    }
    this.pattern = pattern || 'yyyy-mm-dd';

    DateRollingFileStream.super_.call(this, filename, options);
}

util.inherits(DateRollingFileStream, BaseRollingFileStream);
