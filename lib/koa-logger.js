"use strict";
var levels = require("./levels");
var DEFAULT_FORMAT = ':remote-addr - -' +
  ' ":method :url HTTP/:http-version"' +
  ' :status :content-length ":referrer"' +
  ' ":user-agent"';
/**
 * Log requests with the given `options` or a `format` string.
 * Use for Koa v1
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

function getKoaLogger(logger4js, options) {
	if ('object' == typeof options) {
		options = options || {};
	} else if (options) {
		options = { format: options };
	} else {
		options = {};
	}

	var thislogger = logger4js
  , level = levels.toLevel(options.level, levels.INFO)
  , fmt = options.format || DEFAULT_FORMAT
  , nolog = options.nolog ? createNoLogCondition(options.nolog) : null;

  return function *(next) {
    var ctx = this;
    // mount safety
    if (ctx.request._logging) return yield next;

		// nologs
		if (nolog && nolog.test(ctx.originalUrl)) return yield next;
		if (thislogger.isLevelEnabled(level) || options.level === 'auto') {

			var start = new Date
			, statusCode
			, writeHead = ctx.response.writeHead
			, url = ctx.originalUrl;

			// flag as logging
			ctx.request._logging = true;

			// proxy for statusCode.
			ctx.response.writeHead = function(code, headers){
				ctx.response.writeHead = writeHead;
				ctx.response.writeHead(code, headers);
				ctx.response.__statusCode = statusCode = code;
				ctx.response.__headers = headers || {};

				//status code response level handling
				if(options.level === 'auto'){
					level = levels.INFO;
					if(code >= 300) level = levels.WARN;
					if(code >= 400) level = levels.ERROR;
				} else {
					level = levels.toLevel(options.level, levels.INFO);
				}
			};
      yield next;
			//hook on end request to emit the log entry of the HTTP request.
			ctx.response.responseTime = new Date - start;
			//status code response level handling
      if(ctx.res.statusCode && options.level === 'auto'){
        level = levels.INFO;
        if(ctx.res.statusCode >= 300) level = levels.WARN;
        if(ctx.res.statusCode >= 400) level = levels.ERROR;
      }
      if (thislogger.isLevelEnabled(level)) {
        var combined_tokens = assemble_tokens(ctx, options.tokens || []);
        if (typeof fmt === 'function') {
          var line = fmt(ctx, function(str){ return format(str, combined_tokens); });
          if (line) thislogger.log(level, line);
        } else {
          thislogger.log(level, format(fmt, combined_tokens));
        }
      }
		}

    //ensure next gets always called
    yield next;
  };
}

/**
 * Adds custom {token, replacement} objects to defaults, overwriting the defaults if any tokens clash
 *
 * @param  {Koa Context} ctx
 * @param  {Array} custom_tokens [{ token: string-or-regexp, replacement: string-or-replace-function }]
 * @return {Array}
 */
function assemble_tokens(ctx, custom_tokens) {
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
  default_tokens.push({ token: ':url', replacement: ctx.originalUrl });
  default_tokens.push({ token: ':protocol', replacement: ctx.protocol });
  default_tokens.push({ token: ':hostname', replacement: ctx.hostname });
  default_tokens.push({ token: ':method', replacement: ctx.method });
  default_tokens.push({ token: ':status', replacement: ctx.response.status ||
      ctx.response.__statusCode || ctx.res.statusCode });
  default_tokens.push({ token: ':response-time', replacement: ctx.response.responseTime });
  default_tokens.push({ token: ':date', replacement: new Date().toUTCString() });
  default_tokens.push({ token: ':referrer', replacement: ctx.headers.referer || '' });
  default_tokens.push({ token: ':http-version', replacement: ctx.req.httpVersionMajor + '.' + ctx.req.httpVersionMinor });
  default_tokens.push({ token: ':remote-addr', replacement: ctx.headers['X-Forwarded-For'] || ctx.ip || ctx.ips ||
      (ctx.socket && (ctx.socket.remoteAddress || (ctx.socket.socket && ctx.socket.socket.remoteAddress))) });
  default_tokens.push({ token: ':user-agent', replacement: ctx.headers['user-agent'] });
  default_tokens.push({ token: ':content-length', replacement: (ctx.response._headers && ctx.response._headers['content-length']) ||
      (ctx.response.__headers && ctx.response.__headers['Content-Length']) ||
      ctx.response.length || '-' });
  default_tokens.push({ token: /:req\[([^\]]+)\]/g, replacement: function(_, field) {
    return ctx.headers[field.toLowerCase()];
  } });
  default_tokens.push({ token: /:res\[([^\]]+)\]/g, replacement: function(_, field) {
    return ctx.response._headers ?
      (ctx.response._headers[field.toLowerCase()] || ctx.response.__headers[field])
      : (ctx.response.__headers && ctx.response.__headers[field]);
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
  for (var i = 0; i < tokens.length; i++) {
    str = str.replace(tokens[i].token, tokens[i].replacement);
  }
  return str;
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

exports.koaLogger = getKoaLogger;
// exports.koa2 = getKoa2Logger;
