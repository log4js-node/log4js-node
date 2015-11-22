"use strict";

var levels = require('./levels');
var _ = require('underscore');
var DEFAULT_FORMAT = ':remote-addr - -' +
	' ":method :url HTTP/:http-version"' +
	' ":status :content-length ":referrer"' +
	' ":user-agent"';

/**
 * Log requests with the given `options` or a `format` string.
 *
 * Options:
 *
 *   - `format`        Format string, see below for tokens
 *   - `level`         A log4js levels instance. Supports also 'auto'
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

function getLogger(server, options, next){
	if('Object' == typeof options){
		options = options || {};
	}

	var thisLogger = options.logger4js;
	var level = levels.toLevel(options.level, levels.INFO);
	var fmt = options.format || DEFAULT_FORMAT;
	var nolog = options.nolog ? createNoLogCondition(options.nolog) : null;
	var start;
	server.ext('onRequest', function(request, reply){
		// mount safety
		if(request._logging) return next();

		//nologs
		if(nolog && nolog.test(request.path)) return next();
		if(thisLogger.isLevelEnabled(level) || options.level === 'auto'){
			start = new Date();
			var statusCode;
			var url = request.path;

			request._logging = true;

			var writeHead = function(code, headers){
				response.__statusCode = statusCode = code;
				response.__headers = headers || {};

				if(options.level === 'auto'){
					level = levels.INFO;
					if(code >= 300) level = levels.WARN;
					if(code >= 400) level = levels.ERROR;
				}else{
					level = levels.toLevel(options.level, levels.INFO);
				}
			};
		}
		//ensure next gets always called
		reply.continue();
	});

	server.ext('onPreResponse', function(request, reply){
		var response = request.response;
		//hook on end request emit the log entry of the HTTP request.
		response.on('finish', function(){
			response.responseTime = new Date() - start;
			//status code response level handling
			if(response.statusCode && options.level === 'auto'){
				level = levels.INFO;
				if(response.statusCode >= 300) level = levels.WARN;
				if(response.statusCode >= 400) level = levels.ERROR;
			}
			if(thisLogger.isLevelEnabled(level)){
				var combined_tokens = assemble_tokens(request, response, options.tokens || []);				
				if( typeof fmt === 'function'){
					var line = fmt(request, response, function(str){
						return format(str, combined_tokens);
					});
					if(line) thisLogger.log(level, line);
				}else{
					thisLogger.log(level, format(fmt, combined_tokens));
				}
			}
		});
		return reply.continue();
	});

	server.on('response', function(){
		return next();
	});

	next();
}

/**
 * Adds custom {token, replacement} objects to defaults, overwriting the defaults if any tokens clash
 *
 * @param  {IncomingMessage} req
 * @param  {ServerResponse} res
 * @param  {Array} custom_tokens [{ token: string-or-regexp, replacement: string-or-replace-function }]
 * @return {Array}
 */
function assemble_tokens(request, response, custom_tokens) {
  var array_unique_tokens = function(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
      for(var j=i+1; j<a.length; ++j) {
        if(a[i].token == a[j].token) { // not === because token can be regexp object
          a.splice(j--, 1);
        }
      }
    }
    return a;
  };

  var default_tokens = [];
  default_tokens.push({ token: ':url', replacement: request.path });
  default_tokens.push({ token: ':method', replacement: request.method });
  default_tokens.push({ token: ':status', replacement: response.__statusCode || response.statusCode });
  default_tokens.push({ token: ':response-time', replacement: response.responseTime });
  default_tokens.push({ token: ':date', replacement: new Date().toUTCString() });
  default_tokens.push({ token: ':referrer', replacement: request.info.referrer || request.info.referrer || '' });
  default_tokens.push({ token: ':http-version', replacement: request.raw.res.socket.parser.incoming.httpVersion });
  default_tokens.push({ token: ':remote-addr', replacement: request.info.remoteAddress ||
    (request.raw.req.socket && (request.raw.req.socket.remoteAddress || (request.raw.req.socket.socket && request.raw.req.socket.socket.remoteAddress))) });
  default_tokens.push({ token: ':user-agent', replacement: request.headers['user-agent'] });
  default_tokens.push({ token: ':content-length', replacement: (response.headers && response.headers['content-length']) ||
      (response.__headers && response.__headers['Content-Length']) || '-' });
  default_tokens.push({ token: /:req\[([^\]]+)\]/g, replacement: function(_, field) {
    return request.headers[field.toLowerCase()];
  } });
  default_tokens.push({ token: /:res\[([^\]]+)\]/g, replacement: function(_, field) {
    return response._headers ?
      (response._headers[field.toLowerCase()] || response.__headers[field])
      : (response.__headers && response.__headers[field]);
  } });

  return array_unique_tokens(custom_tokens.concat(default_tokens));
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

function format(str, tokens) {
  return _.reduce(tokens, function(current_string, token) {
    return current_string.replace(token.token, token.replacement);
  }, str);
}

/**
 * Return RegExp Object about nolog
 *
 * @param  {String} nolog
 * @return {RegExp}
 * @api private
 *
 * syntax
 *  1. String
 *   1.1 "\\.gif"
 *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.gif?fuga
 *         LOGGING http://example.com/hoge.agif
 *   1.2 in "\\.gif|\\.jpg$"
 *         NOT LOGGING http://example.com/hoge.gif and
 *           http://example.com/hoge.gif?fuga and http://example.com/hoge.jpg?fuga
 *         LOGGING http://example.com/hoge.agif,
 *           http://example.com/hoge.ajpg and http://example.com/hoge.jpg?hoge
 *   1.3 in "\\.(gif|jpe?g|png)$"
 *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.jpeg
 *         LOGGING http://example.com/hoge.gif?uid=2 and http://example.com/hoge.jpg?pid=3
 *  2. RegExp
 *   2.1 in /\.(gif|jpe?g|png)$/
 *         SAME AS 1.3
 *  3. Array
 *   3.1 ["\\.jpg$", "\\.png", "\\.gif"]
 *         SAME AS "\\.jpg|\\.png|\\.gif"
 */
function createNoLogCondition(nolog) {
  var regexp = null;

	if (nolog) {
    if (nolog instanceof RegExp) {
      regexp = nolog;
    }

    if (typeof nolog === 'string') {
      regexp = new RegExp(nolog);
    }

    if (Array.isArray(nolog)) {
      var regexpsAsStrings = nolog.map(
        function convertToStrings(o) {
          return o.source ? o.source : o;
        }
      );
      regexp = new RegExp(regexpsAsStrings.join('|'));
    }
  }

  return regexp;
}

exports.register = getLogger;

exports.register.attributes = {
	pkg: require('../package.json')
};
