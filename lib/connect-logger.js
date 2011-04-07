/**
 * Log requests with the given `options` or a `format` string.
 *
 * Options:
 *
 *   - `format`        Format string, see below for tokens
 *   - `level`         A log4js levels instance.
 *
 * Tokens:
 *
 *   - `:req[header]` ex: `:req[Accept]`
 *   - `:res[header]` ex: `:res[Content-Length]`
 *   - `:http-version`
 *   - `:response-time`
 *   - `:remote-addr`
 *   - `:date`
 *   - `:method`
 *   - `:url`
 *   - `:referrer`
 *   - `:user-agent`
 *   - `:status`
 *
 * @param {String|Function|Object} format or options
 * @return {Function}
 * @api public
 */

module.exports = function(log4js_module) {
    var log4js = log4js_module;

    function getLogger(logger4js, options) {
	if ('object' == typeof options) {
	    options = options || {};
	} else if (options) {
	    options = { format: options };
	} else {
	    options = {};
	}
	
	var thislogger = logger4js;
	var level = options.level || log4js.levels.TRACE;
	var fmt = options.format;
	
	return function logger(req, res, next) {

	    // mount safety
	    if (req._logging) return next();
	    
	    if (thislogger.isLevelEnabled(level)) {

		var start = +new Date
		, statusCode
		, writeHead = res.writeHead
		, end = res.end
		, url = req.originalUrl;

		// flag as logging
		req._logging = true;

		// proxy for statusCode.
		res.writeHead = function(code, headers){
		    res.writeHead = writeHead;
		    res.writeHead(code, headers);
		    res.__statusCode = statusCode = code;
		    res.__headers = headers || {};
		};

		// proxy end to output a line to the provided logger.
		if (fmt) {
		    res.end = function(chunk, encoding) {
			res.end = end;
			res.end(chunk, encoding);
			res.responseTime = +new Date - start;
			if ('function' == typeof fmt) {
			    var line = fmt(req, res, function(str){ return format(str, req, res); });
			    if (line) thislogger.log(level, line);
			} else {
			    thislogger.log(level, format(fmt, req, res));
			}
		    };
		} else {
		    res.end = function(chunk, encoding) {
			var contentLength = (res._headers && res._headers['content-length'])
			    || (res.__headers && res.__headers['Content-Length'])
			    || '-';

			res.end = end;
			res.end(chunk, encoding);

			thislogger.log(level, 
				       (req.socket && (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress))) + 
				       ' - - "' + req.method + ' ' + url + 
				       ' HTTP/' + req.httpVersionMajor + '.' + req.httpVersionMinor + '" ' + 
				       (statusCode || res.statusCode) + ' ' + contentLength + ' "' + 
				       (req.headers['referer'] || req.headers['referrer'] || '') + '" "' + 
				       (req.headers['user-agent'] || '') + '"');
		    };
		}

		next();
	    };
	};

	/**
	 * Return formatted log line.
	 *
	 * @param  {String} str
	 * @param  {IncomingMessage} req
	 * @param  {ServerResponse} res
	 * @return {String}
	 * @api private
	 */
	
	function format(str, req, res) {
	    return str
		.replace(':url', req.originalUrl)
		.replace(':method', req.method)
		.replace(':status', res.__statusCode || res.statusCode)
		.replace(':response-time', res.responseTime)
		.replace(':date', new Date().toUTCString())
		.replace(':referrer', req.headers['referer'] || req.headers['referrer'] || '')
		.replace(':http-version', req.httpVersionMajor + '.' + req.httpVersionMinor)
		.replace(':remote-addr', req.socket && (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress)))
		.replace(':user-agent', req.headers['user-agent'] || '')
		.replace(/:req\[([^\]]+)\]/g, function(_, field){ return req.headers[field.toLowerCase()]; })
		.replace(/:res\[([^\]]+)\]/g, function(_, field){
		    return res._headers
			? (res._headers[field.toLowerCase()] || res.__headers[field])
			: (res.__headers && res.__headers[field]);
		});
	}

    }

    return {
	connectLogger: getLogger
    };

}