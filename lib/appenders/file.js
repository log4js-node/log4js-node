const debug = require('debug')('log4js:file');
const path = require('path');
const streams = require('streamroller');
const os = require('os');

const eol = os.EOL;

function openTheStream(file, fileSize, numFiles, options) {
  const stream = new streams.RollingFileStream(
    file,
    fileSize,
    numFiles,
    options
  );
  stream.on('error', (err) => {
    console.error('log4js.fileAppender - Writing to file %s, error happened ', file, err); //eslint-disable-line
  });
  stream.on('drain', () => {
    process.emit("log4js:pause", false);
  });
  return stream;
}


/**
 * File Appender writing the logs to a text file. Supports rolling of logs by size.
 *
 * @param file file log messages will be written to
 * @param layout a function that takes a logEvent and returns a string
 *   (defaults to basicLayout).
 * @param logSize - the maximum size (in bytes) for a log file,
 *   if not provided then logs won't be rotated.
 * @param numBackups - the number of log files to keep after logSize
 *   has been reached (default 5)
 * @param options - options to be passed to the underlying stream
 * @param timezoneOffset - optional timezone offset in minutes (default system local)
 */
function fileAppender(file, layout, logSize, numBackups, options, timezoneOffset) {
  file = path.normalize(file);
  numBackups = numBackups === undefined ? 5 : numBackups;
  // there has to be at least one backup if logSize has been specified
  numBackups = numBackups === 0 ? 1 : numBackups;

  debug(
    'Creating file appender (',
    file, ', ',
    logSize, ', ',
    numBackups, ', ',
    options, ', ',
    timezoneOffset, ')'
  );

  let writer = openTheStream(file, logSize, numBackups, options);

  const app = function (loggingEvent) {
    if (options.removeColor === true) {
      // eslint-disable-next-line no-control-regex
      const regex = /\x1b[[0-9;]*m/g;
      loggingEvent.data = loggingEvent.data.map(d => {
        if (typeof d === 'string') return d.replace(regex, '')
        return d
      })
    }
    if (!writer.write(layout(loggingEvent, timezoneOffset) + eol, "utf8")) {
      process.emit('log4js:pause', true);
    }
  };

  app.reopen = function () {
    writer.end(() => { writer = openTheStream(file, logSize, numBackups, options); });
  };

  app.sighupHandler = function () {
    debug('SIGHUP handler called.');
    app.reopen();
  };

  app.shutdown = function (complete) {
    process.removeListener('SIGHUP', app.sighupHandler);
    writer.end('', 'utf-8', complete);
  };

  // On SIGHUP, close and reopen all files. This allows this appender to work with
  // logrotate. Note that if you are using logrotate, you should not set
  // `logSize`.
  process.on('SIGHUP', app.sighupHandler);

  return app;
}

function configure(config, layouts) {
  let layout = layouts.basicLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

  return fileAppender(
    config.filename,
    layout,
    config.maxLogSize,
    config.backups,
    config,
    config.timezoneOffset
  );
}

module.exports.configure = configure;
