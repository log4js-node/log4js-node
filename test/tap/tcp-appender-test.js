const { test } = require("tap");
const net = require("net");
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

test("TCP Appender", batch => {

  batch.test("Default Configuration", t => {
    messages = [];

    const serverConfig = {
      endMsg: "__LOG4JS__",
      deserialise: (log) => { return LoggingEvent.deserialise(log); }
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
      deserialise: (log) => { return LoggingEvent.deserialise(log); }
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
      deserialise: (log) => { return JSON.parse(log); }
    }
    server = makeServer(serverConfig);

    log4js.addLayout('json', function () {
      return function (logEvent) {
        return JSON.stringify({
          "time": logEvent.startTime,
          "message": logEvent.data[0],
          "level": logEvent.level.toString()
        });
      }
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

  batch.end();
});
