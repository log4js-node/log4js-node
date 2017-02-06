'use strict';

const test = require('tap').test;
const sandbox = require('sandboxed-module');
const realLayouts = require('../../lib/layouts');

const setupLogging = function (options, category, compressedLength) {
  const fakeDgram = {
    sent: false,
    socket: {
      packetLength: 0,
      closed: false,
      close: function (cb) {
        this.closed = true;
        if (cb) cb();
      },
      send: function (pkt, offset, pktLength, port, host) {
        fakeDgram.sent = true;
        this.packet = pkt;
        this.offset = offset;
        this.packetLength = pktLength;
        this.port = port;
        this.host = host;
      }
    },
    createSocket: function (type) {
      this.type = type;
      return this.socket;
    }
  };

  const fakeZlib = {
    gzip: function (objectToCompress, callback) {
      fakeZlib.uncompressed = objectToCompress;
      if (this.shouldError) {
        callback({ stack: 'oh noes' });
        return;
      }

      if (compressedLength) {
        callback(null, { length: compressedLength });
      } else {
        callback(null, "I've been compressed");
      }
    }
  };

  let exitHandler;

  const fakeConsole = {
    error: function (message) {
      this.message = message;
    }
  };

  const fakeLayouts = {
    layout: function (type, opt) {
      this.type = type;
      this.options = opt;
      return realLayouts.messagePassThroughLayout;
    },
    messagePassThroughLayout: realLayouts.messagePassThroughLayout
  };

  const log4js = sandbox.require('../../lib/log4js', {
    // singleOnly: true,
    requires: {
      dgram: fakeDgram,
      zlib: fakeZlib,
      './layouts': fakeLayouts
    },
    globals: {
      process: {
        on: function (evt, handler) {
          if (evt === 'exit') {
            exitHandler = handler;
          }
        },
        env: {}
      },
      console: fakeConsole
    }
  });

  options = options || {};
  options.type = 'gelf';

  log4js.configure({
    appenders: { gelf: options },
    categories: { default: { appenders: ['gelf'], level: 'debug' } }
  });

  return {
    dgram: fakeDgram,
    compress: fakeZlib,
    exitHandler: exitHandler,
    console: fakeConsole,
    layouts: fakeLayouts,
    logger: log4js.getLogger(category || 'gelf-test'),
    log4js: log4js
  };
};

test('log4js gelfAppender', (batch) => {
  batch.test('with default gelfAppender settings', (t) => {
    const setup = setupLogging();
    setup.logger.info('This is a test');

    const dgram = setup.dgram;

    t.test('dgram packet should be sent via udp to the localhost gelf server', (assert) => {
      assert.equal(dgram.type, 'udp4');
      assert.equal(dgram.socket.host, 'localhost');
      assert.equal(dgram.socket.port, 12201);
      assert.equal(dgram.socket.offset, 0);
      assert.ok(dgram.socket.packetLength > 0, 'Received blank message');
      assert.equal(dgram.socket.packet, "I've been compressed");
      assert.end();
    });

    const message = JSON.parse(setup.compress.uncompressed);
    t.test('the uncompressed log message should be in the gelf format', (assert) => {
      assert.equal(message.version, '1.1');
      assert.equal(message.host, require('os').hostname());
      assert.equal(message.level, 6); // INFO
      assert.equal(message.short_message, 'This is a test');
      assert.end();
    });
    t.end();
  });

  batch.test('with a message longer than 8k', (t) => {
    const setup = setupLogging(undefined, undefined, 10240);
    setup.logger.info('Blah.');

    t.equal(setup.dgram.sent, false, 'the dgram packet should not be sent');
    t.end();
  });

  batch.test('with non-default options', (t) => {
    const setup = setupLogging({
      host: 'somewhere',
      port: 12345,
      hostname: 'cheese',
      facility: 'nonsense'
    });
    setup.logger.debug('Just testing.');

    const dgram = setup.dgram;
    t.test('the dgram packet should pick up the options', (assert) => {
      assert.equal(dgram.socket.host, 'somewhere');
      assert.equal(dgram.socket.port, 12345);
      assert.end();
    });

    const message = JSON.parse(setup.compress.uncompressed);
    t.test('the uncompressed packet should pick up the options', (assert) => {
      assert.equal(message.host, 'cheese');
      assert.equal(message._facility, 'nonsense');
      assert.end();
    });

    t.end();
  });

  batch.test('on process.exit should close open sockets', (t) => {
    const setup = setupLogging();
    setup.exitHandler();

    t.ok(setup.dgram.socket.closed);
    t.end();
  });

  batch.test('on shutdown should close open sockets', (t) => {
    const setup = setupLogging();
    setup.log4js.shutdown(() => {
      t.ok(setup.dgram.socket.closed);
      t.end();
    });
  });

  batch.test('on zlib error should output to console.error', (t) => {
    const setup = setupLogging();
    setup.compress.shouldError = true;
    setup.logger.info('whatever');

    t.equal(setup.console.message, 'oh noes');
    t.end();
  });

  batch.test('with layout in configuration', (t) => {
    const setup = setupLogging({
      layout: {
        type: 'madeuplayout',
        earlgrey: 'yes, please'
      }
    });

    t.test('should pass options to layout', (assert) => {
      assert.equal(setup.layouts.type, 'madeuplayout');
      assert.equal(setup.layouts.options.earlgrey, 'yes, please');
      assert.end();
    });
    t.end();
  });

  batch.test('with custom fields options', (t) => {
    const setup = setupLogging({
      host: 'somewhere',
      port: 12345,
      hostname: 'cheese',
      facility: 'nonsense',
      customFields: {
        _every1: 'Hello every one',
        _every2: 'Hello every two'
      }
    });
    const myFields = {
      GELF: true,
      _every2: 'Overwritten!',
      _myField: 'This is my field!'
    };
    setup.logger.debug(myFields, 'Just testing.');

    const dgram = setup.dgram;
    t.test('the dgram packet should pick up the options', (assert) => {
      assert.equal(dgram.socket.host, 'somewhere');
      assert.equal(dgram.socket.port, 12345);
      assert.end();
    });

    const message = JSON.parse(setup.compress.uncompressed);
    t.test('the uncompressed packet should pick up the options', (assert) => {
      assert.equal(message.host, 'cheese');
      assert.notOk(message.GELF); // make sure flag was removed
      assert.equal(message._facility, 'nonsense');
      assert.equal(message._every1, 'Hello every one'); // the default value
      assert.equal(message._every2, 'Overwritten!'); // the overwritten value
      assert.equal(message._myField, 'This is my field!'); // the value for this message only
      assert.equal(message.short_message, 'Just testing.'); // skip the field object
      assert.end();
    });
    t.end();
  });

  batch.end();
});
