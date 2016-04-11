'use strict';
var DateRollingFileStream = require('./DateRollingFileStream')
	, debug = require('../debug')('DateRollingFileStreamSync')
	, fs = require('fs')
	, util = require('util');

module.exports = DateRollingFileStreamSync;

function DateRollingFileStreamSync(filename, pattern, options, now) {
	debug('Now is ' + now);
	this.syncer = (options && options.usefsyncSync) ? fs.fsyncSync : fs.fsync;

	DateRollingFileStreamSync.super_.call(this, filename, pattern, options, now);
}
util.inherits(DateRollingFileStreamSync, DateRollingFileStream);

DateRollingFileStreamSync.prototype.write = function write(str, encoding, cb){
	var me = this;
	DateRollingFileStreamSync.super_.prototype.write.call(this, str, encoding, cb);
    try {
	    me.syncer(me.theStream.fd);
    } catch (error) {
        // When the file is closed (For ratation or at the end)
        // then the file descriptor can be undefined
        debug(error);        
    }
}