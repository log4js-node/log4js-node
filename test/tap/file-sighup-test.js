const { test } = require("tap");
const sandbox = require("@log4js-node/sandboxed-module");

// no SIGHUP signals on Windows, so don't run the tests
if (process.platform !== "win32") {
  
  test("file appender SIGHUP", t => {
    let closeCalled = 0;
    let openCalled = 0;

    const appender = sandbox
      .require("../../lib/appenders/file", {
        requires: {
          streamroller: {
            RollingFileStream: class RollingFileStream {
              constructor() {
                openCalled++;
                this.ended = false;
              }

              on() {
                this.dummy = "easier than turning off lint rule";
              }

              end(cb) {
                this.ended = true;
                closeCalled++;
                cb();
              }

              write() {
                if (this.ended) {
                  throw new Error("write after end");
                }
                return true;
              }
            }
          }
        }
      })
      .configure(
        { type: "file", filename: "sighup-test-file" },
        {
          basicLayout() {
            return "whatever";
          }
        }
      );

    appender("something to log");
    process.kill(process.pid, "SIGHUP");

    t.plan(2);
    setTimeout(() => {
      appender("something to log after sighup");
      t.equal(openCalled, 2, "open should be called twice");
      t.equal(closeCalled, 1, "close should be called once");
      t.end();
    }, 100);
  });

  test("file appender SIGHUP handler leak", t => {
    const log4js = require("../../lib/log4js");
    const initialListeners = process.listenerCount("SIGHUP");
    log4js.configure({
      appenders: {
        file: { type: "file", filename: "test.log" }
      },
      categories: { default: { appenders: ["file"], level: "info" } }
    });
    log4js.shutdown(() => {
      t.equal(process.listenerCount("SIGHUP"), initialListeners);
      t.end();
    });
  });

}