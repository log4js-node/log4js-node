/* eslint-disable no-plusplus */

'use strict';

const DEFAULT_FORMAT = ':remote-addr - -' +
  ' ":method :url HTTP/:http-version"' +
  ' :status :content-length ":referrer"' +
  ' ":user-agent"';

  /**
   * Return request url path,
   * adding this function prevents the Cyclomatic Complexity,
   * for the assemble_tokens function at low, to pass the tests.
   *
   * @param  {IncomingMessage} req
   * @return {String}
   * @api private
   */

function getUrl(req) {
  return req.originalUrl || req.url;
}


/**
   * Adds custom {token, replacement} objects to defaults,
   * overwriting the defaults if any tokens clash
   *
   * @param  {IncomingMessage} req
   * @param  {ServerResponse} res
   * @param  {Array} customTokens
   *    [{ token: string-or-regexp, replacement: string-or-replace-function }]
   * @return {Array}
   */
function assembleTokens(req, res, customTokens) {
  const arrayUniqueTokens = (array) => {
    const a = array.concat();
    for (let i = 0; i < a.length; ++i) {
      for (let j = i + 1; j < a.length; ++j) {
        // not === because token can be regexp object
        /* eslint eqeqeq:0 */
        if (a[i].token == a[j].token) {
          a.splice(j--, 1);
        }
      }
    }
    return a;
  };

  const defaultTokens = [];
  defaultTokens.push({ token: ':url', replacement: getUrl(req) });
  defaultTokens.push({ token: ':protocol', replacement: req.protocol });
  defaultTokens.push({ token: ':hostname', replacement: req.hostname });
  defaultTokens.push({ token: ':method', replacement: req.method });
  defaultTokens.push({ token: ':status', replacement: res.__statusCode || res.statusCode });
  defaultTokens.push({ token: ':response-time', replacement: res.responseTime });
  defaultTokens.push({ token: ':date', replacement: new Date().toUTCString() });
  defaultTokens.push({
    token: ':referrer',
    replacement: req.headers.referer || req.headers.referrer || ''
  });
  defaultTokens.push({
    token: ':http-version',
    replacement: `${req.httpVersionMajor}.${req.httpVersionMinor}`
  });
  defaultTokens.push({
    token: ':remote-addr',
    replacement: req.headers['x-forwarded-for'] ||
      req.ip ||
      req._remoteAddress ||
      (req.socket &&
        (req.socket.remoteAddress ||
          (req.socket.socket && req.socket.socket.remoteAddress)
        )
      )
  });
  defaultTokens.push({ token: ':user-agent', replacement: req.headers['user-agent'] });
  defaultTokens.push({
    token: ':content-length',
    replacement: (res._headers && res._headers['content-length']) ||
      (res.__headers && res.__headers['Content-Length']) ||
      '-'
  });
  defaultTokens.push({
    token: /:req\[([^\]]+)]/g,
    replacement: function (_, field) {
      return req.headers[field.toLowerCase()];
    }
  });
  defaultTokens.push({
    token: /:res\[([^\]]+)]/g,
    replacement: function (_, field) {
      return res._headers ?
        (res._headers[field.toLowerCase()] || res.__headers[field])
        : (res.__headers && res.__headers[field]);
    }
  });

  return arrayUniqueTokens(customTokens.concat(defaultTokens));
}

/**
   * Return formatted log line.
   *
   * @param  {String} str
   * @param {Array} tokens
   * @return {String}
   * @api private
   */
function format(str, tokens) {
  for (let i = 0; i < tokens.length; i++) {
    str = str.replace(tokens[i].token, tokens[i].replacement);
  }
  return str;
}

/**
   * Return RegExp Object about nolog
   *
   * @param  {String|Array} nolog
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
  let regexp = null;

  if (nolog) {
    if (nolog instanceof RegExp) {
      regexp = nolog;
    }

    if (typeof nolog === 'string') {
      regexp = new RegExp(nolog);
    }

    if (Array.isArray(nolog)) {
      // convert to strings
      const regexpsAsStrings = nolog.map(reg => (reg.source ? reg.source : reg));
      regexp = new RegExp(regexpsAsStrings.join('|'));
    }
  }

  return regexp;
}

module.exports = function (levels) {
  /**
   * Log requests with the given `options` or a `format` string.
   *
   * Options:
   *
   *   - `format`        Format string, see below for tokens
   *   - `level`         A log4js levels instance. Supports also 'auto'
   *   - `nolog`         A string or RegExp to exclude target logs
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
   * @return {Function}
   * @param logger4js
   * @param options
   * @api public
   */
  function getLogger(logger4js, options) {
    /* eslint no-underscore-dangle:0 */
    if (typeof options === 'object') {
      options = options || {};
    } else if (options) {
      options = { format: options };
    } else {
      options = {};
    }

    const thisLogger = logger4js;
    let level = levels.getLevel(options.level, levels.INFO);
    const fmt = options.format || DEFAULT_FORMAT;
    const nolog = options.nolog ? createNoLogCondition(options.nolog) : null;

    return (req, res, next) => {
      // mount safety
      if (req._logging) return next();

      // nologs
      if (nolog && nolog.test(req.originalUrl)) return next();

      if (thisLogger.isLevelEnabled(level) || options.level === 'auto') {
        const start = new Date();
        const writeHead = res.writeHead;

        // flag as logging
        req._logging = true;

        // proxy for statusCode.
        res.writeHead = (code, headers) => {
          res.writeHead = writeHead;
          res.writeHead(code, headers);

          res.__statusCode = code;
          res.__headers = headers || {};

          // status code response level handling
          if (options.level === 'auto') {
            level = levels.INFO;
            if (code >= 300) level = levels.WARN;
            if (code >= 400) level = levels.ERROR;
          } else {
            level = levels.getLevel(options.level, levels.INFO);
          }
        };

        // hook on end request to emit the log entry of the HTTP request.
        res.on('finish', () => {
          res.responseTime = new Date() - start;
          // status code response level handling
          if (res.statusCode && options.level === 'auto') {
            level = levels.INFO;
            if (res.statusCode >= 300) level = levels.WARN;
            if (res.statusCode >= 400) level = levels.ERROR;
          }

          if (thisLogger.isLevelEnabled(level)) {
            const combinedTokens = assembleTokens(req, res, options.tokens || []);

            if (typeof fmt === 'function') {
              const line = fmt(req, res, str => format(str, combinedTokens));
              if (line) thisLogger.log(level, line);
            } else {
              thisLogger.log(level, format(fmt, combinedTokens));
            }
          }
        });
      }

      // ensure next gets always called
      return next();
    };
  }

  return { connectLogger: getLogger };
};
