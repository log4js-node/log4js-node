const { test } = require("tap");
const net = require("net");
const flatted = require("flatted");
const sandbox = require("@log4js-node/sandboxed-module");
const log4js = require("../../lib/log4js");
const LoggingEvent = require("../../lib/LoggingEvent");

let messages = [];
let server = null;

function makeServer(config) {

  server = net.createServer(socket => {
    socket.setEncoding("utf8");

    socket.on("data", data => {
      data
        .split(config.endMsg)
        .filter(s => s.length)
        .forEach(s => {
          messages.push(config.deserialise(s));
        });
    });
  });

  server.unref();

  return server;
}

function makeFakeNet() {
  return {
    data: [],
    cbs: {},
    createConnectionCalled: 0,
    createConnection(port, host) {
      const fakeNet = this;
      this.port = port;
      this.host = host;
      this.createConnectionCalled += 1;
      return {
        on(evt, cb) {
          fakeNet.cbs[evt] = cb;
        },
        write(data, encoding) {
          fakeNet.data.push(data);
          fakeNet.encoding = encoding;
          return false;
        },
        end() {
          fakeNet.closeCalled = true;
        }
      };
    },
    createServer(cb) {
      const fakeNet = this;
      cb({
        remoteAddress: "1.2.3.4",
        remotePort: "1234",
        setEncoding(encoding) {
          fakeNet.encoding = encoding;
        },
        on(event, cb2) {
          fakeNet.cbs[event] = cb2;
        }
      });

      return {
        listen(port, host) {
          fakeNet.port = port;
          fakeNet.host = host;
        }
      };
    }
  };
}

test("TCP Appender", batch => {

  batch.test("Default Configuration", t => {
    messages = [];

    const serverConfig = {
      endMsg: "__LOG4JS__",
      deserialise: (log) => LoggingEvent.deserialise(log)
    }
    server = makeServer(serverConfig);

    server.listen(() => {
      const { port } = server.address();
      log4js.configure({
        appenders: {
          default: { type: "tcp", port },
        },
        categories: {
          default: { appenders: ["default"], level: "debug" },
        }
      });

      const logger = log4js.getLogger();
      logger.info("This should be sent via TCP.");
      logger.info("This should also be sent via TCP and not break things.");

      log4js.shutdown(() => {
        server.close(() => {
          t.equal(messages.length, 2);
          t.match(messages[0], {
            data: ["This should be sent via TCP."],
            categoryName: "default",
            context: {},
            level: { levelStr: "INFO" }
          });
          t.match(messages[1], {
            data: ["This should also be sent via TCP and not break things."],
            categoryName: "default",
            context: {},
            level: { levelStr: "INFO" }
          });
          t.end();
        });
      });
    });
  });

  batch.test("Custom EndMessage String", t => {
    messages = [];

    const serverConfig = {
      endMsg: "\n",
      deserialise: (log) => LoggingEvent.deserialise(log)
    }
    server = makeServer(serverConfig);

    server.listen(() => {
      const { port } = server.address();
      log4js.configure({
        appenders: {
          customEndMsg: { type: "tcp", port, endMsg: "\n" },
        },
        categories: {
          default: { appenders: ["customEndMsg"], level: "debug" },
        }
      });

      const logger = log4js.getLogger();
      logger.info("This should be sent via TCP using a custom EndMsg string.");
      logger.info("This should also be sent via TCP using a custom EndMsg string and not break things.");

      log4js.shutdown(() => {
        server.close(() => {
          t.equal(messages.length, 2);
          t.match(messages[0], {
            data: ["This should be sent via TCP using a custom EndMsg string."],
            categoryName: "default",
            context: {},
            level: { levelStr: "INFO" }
          });
          t.match(messages[1], {
            data: ["This should also be sent via TCP using a custom EndMsg string and not break things."],
            categoryName: "default",
            context: {},
            level: { levelStr: "INFO" }
          });
          t.end();
        });
      });
    });
  });

  batch.test("Custom Layout", t => {
    messages = [];

    const serverConfig = {
      endMsg: "__LOG4JS__",
      deserialise: (log) => JSON.parse(log)
    }
    server = makeServer(serverConfig);

    log4js.addLayout('json', () => function (logEvent) {
      return JSON.stringify({
        "time": logEvent.startTime,
        "message": logEvent.data[0],
        "level": logEvent.level.toString()
      });
    });

    server.listen(() => {
      const { port } = server.address();
      log4js.configure({
        appenders: {
          customLayout: {
            type: "tcp", port,
            layout: { type: 'json' }
          },
        },
        categories: {
          default: { appenders: ["customLayout"], level: "debug" },
        }
      });

      const logger = log4js.getLogger();
      logger.info("This should be sent as a customized json.");
      logger.info("This should also be sent via TCP as a customized json and not break things.");

      log4js.shutdown(() => {
        server.close(() => {
          t.equal(messages.length, 2);
          t.match(messages[0], {
            message: "This should be sent as a customized json.",
            level: "INFO"
          });
          t.match(messages[1], {
            message: "This should also be sent via TCP as a customized json and not break things.",
            level: "INFO"
          });
          t.end();
        });
      });
    });
  });

  batch.test("when underlying stream errors", t => {
    const fakeNet = makeFakeNet();

    const sandboxedLog4js = sandbox.require("../../lib/log4js", {
      requires: {
        net: fakeNet
      }
    });
    sandboxedLog4js.configure({
      appenders: {
        default: { type: "tcp" },
      },
      categories: {
        default: { appenders: ["default"], level: "debug" },
      }
    });

    const logger = sandboxedLog4js.getLogger();

    logger.info("before connect");
    t.test(
      "should buffer messages written before socket is connected",
      assert => {
        assert.equal(fakeNet.data.length, 0);
        assert.equal(fakeNet.createConnectionCalled, 1);
        assert.end();
      }
    );

    fakeNet.cbs.connect();
    t.test(
      "should flush buffered messages",
      assert => {
        assert.equal(fakeNet.data.length, 1);
        assert.equal(fakeNet.createConnectionCalled, 1);
        assert.match(fakeNet.data[0], "before connect");
        assert.end();
      }
    );

    logger.info("after connect");
    t.test(
      "should write log messages to socket as flatted strings with a terminator string",
      assert => {
        assert.equal(fakeNet.data.length, 2);
        assert.match(fakeNet.data[0], "before connect");
        assert.ok(fakeNet.data[0].endsWith("__LOG4JS__"));
        assert.match(fakeNet.data[1], "after connect");
        assert.ok(fakeNet.data[1].endsWith("__LOG4JS__"));
        assert.equal(fakeNet.encoding, "utf8");
        assert.end();
      }
    );

    fakeNet.cbs.error();
    logger.info("after error, before close");
    fakeNet.cbs.close();
    logger.info("after close, before connect");
    fakeNet.cbs.connect();
    logger.info("after error, after connect");
    t.test("should attempt to re-open the socket on error", assert => {
      assert.equal(fakeNet.data.length, 5);
      assert.equal(fakeNet.createConnectionCalled, 2);
      assert.match(fakeNet.data[2], "after error, before close");
      assert.match(fakeNet.data[3], "after close, before connect");
      assert.match(fakeNet.data[4], "after error, after connect");
      assert.end();
    });

    t.test("should buffer messages until drain", assert => {
      const previousLength = fakeNet.data.length;
      logger.info("should not be flushed");
      assert.equal(fakeNet.data.length, previousLength);
      assert.notMatch(fakeNet.data[fakeNet.data.length - 1], "should not be flushed");

      fakeNet.cbs.drain();
      assert.equal(fakeNet.data.length, previousLength + 1);
      assert.match(fakeNet.data[fakeNet.data.length - 1], "should not be flushed");
      assert.end();
    });

    t.test("should serialize an Error correctly", assert => {
      const previousLength = fakeNet.data.length;
      logger.error(new Error("Error test"));
      fakeNet.cbs.drain();
      assert.equal(fakeNet.data.length, previousLength + 1);
      const raw = fakeNet.data[fakeNet.data.length - 1];
      const offset = raw.indexOf('__LOG4JS__');
      assert.ok(
        flatted.parse(raw.slice(0, offset !== -1 ? offset : 0)).data[0].stack,
        `Expected:\n\n${fakeNet.data[6]}\n\n to have a 'data[0].stack' property`
      );
      const actual = flatted.parse(raw.slice(0, offset !== -1 ? offset : 0)).data[0].stack;
      assert.match(actual, /^Error: Error test/);
      assert.end();
    });

    t.end();
  });

  batch.end();
});
