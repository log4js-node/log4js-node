const { test } = require("tap");
const log4js = require("../../lib/log4js");
const categories = require("../../lib/categories");

test("log4js category inherit all appenders from direct parent", batch => {
  batch.test("should inherit appenders from direct parent", t => {
    const config = {
      appenders: {
        stdout1: { type: "dummy-appender", label: "stdout1" },
        stdout2: { type: "dummy-appender", label: "stdout2" }
      },
      categories: {
        default: { appenders: ["stdout1"], level: "ERROR" },
        catA: { appenders: ["stdout1", "stdout2"], level: "INFO" },
        "catA.catB": { level: "DEBUG" }
      }
    };

    log4js.configure(config);

    const childCategoryName = "catA.catB";
    const childAppenders = categories.appendersForCategory(childCategoryName);
    const childLevel = categories.getLevelForCategory(childCategoryName);

    t.ok(childAppenders);
    t.isEqual(childAppenders.length, 2, "inherited 2 appenders");
    t.ok(childAppenders.some(a => a.label === "stdout1"), "inherited stdout1");
    t.ok(childAppenders.some(a => a.label === "stdout2"), "inherited stdout2");
    t.isEqual(childLevel.levelStr, "DEBUG", "child level overrides parent");
    t.end();
  });

  batch.test(
    "multiple children should inherit config from shared parent",
    t => {
      const config = {
        appenders: {
          stdout1: { type: "dummy-appender", label: "stdout1" },
          stdout2: { type: "dummy-appender", label: "stdout2" }
        },
        categories: {
          default: { appenders: ["stdout1"], level: "ERROR" },
          catA: { appenders: ["stdout1"], level: "INFO" },
          "catA.catB.cat1": { level: "DEBUG" }, // should get sdtout1, DEBUG
          "catA.catB.cat2": { appenders: ["stdout2"] } // should get sdtout1,sdtout2, INFO
        }
      };

      log4js.configure(config);

      const child1CategoryName = "catA.catB.cat1";
      const child1Appenders = categories.appendersForCategory(
        child1CategoryName
      );
      const child1Level = categories.getLevelForCategory(child1CategoryName);

      t.isEqual(child1Appenders.length, 1, "inherited 1 appender");
      t.ok(
        child1Appenders.some(a => a.label === "stdout1"),
        "inherited stdout1"
      );
      t.isEqual(child1Level.levelStr, "DEBUG", "child level overrides parent");

      const child2CategoryName = "catA.catB.cat2";
      const child2Appenders = categories.appendersForCategory(
        child2CategoryName
      );
      const child2Level = categories.getLevelForCategory(child2CategoryName);

      t.ok(child2Appenders);
      t.isEqual(
        child2Appenders.length,
        2,
        "inherited 1 appenders, plus its original"
      );
      t.ok(
        child2Appenders.some(a => a.label === "stdout1"),
        "inherited stdout1"
      );
      t.ok(child2Appenders.some(a => a.label === "stdout2"), "kept stdout2");
      t.isEqual(child2Level.levelStr, "INFO", "inherited parent level");

      t.end();
    }
  );

  batch.test("should inherit appenders from multiple parents", t => {
    const config = {
      appenders: {
        stdout1: { type: "dummy-appender", label: "stdout1" },
        stdout2: { type: "dummy-appender", label: "stdout2" }
      },
      categories: {
        default: { appenders: ["stdout1"], level: "ERROR" },
        catA: { appenders: ["stdout1"], level: "INFO" },
        "catA.catB": { appenders: ["stdout2"], level: "INFO" }, // should get stdout1 and stdout2
        "catA.catB.catC": { level: "DEBUG" } // should get stdout1 and stdout2
      }
    };

    log4js.configure(config);

    const childCategoryName = "catA.catB.catC";
    const childAppenders = categories.appendersForCategory(childCategoryName);

    t.ok(childAppenders);
    t.isEqual(childAppenders.length, 2, "inherited 2 appenders");
    t.ok(childAppenders.some(a => a.label === "stdout1"), "inherited stdout1");
    t.ok(childAppenders.some(a => a.label === "stdout1"), "inherited stdout1");

    const firstParentName = "catA.catB";
    const firstParentAppenders = categories.appendersForCategory(
      firstParentName
    );

    t.ok(firstParentAppenders);
    t.isEqual(firstParentAppenders.length, 2, "ended up with 2 appenders");
    t.ok(
      firstParentAppenders.some(a => a.label === "stdout1"),
      "inherited stdout1"
    );
    t.ok(firstParentAppenders.some(a => a.label === "stdout2"), "kept stdout2");

    t.end();
  });

  batch.test(
    "should inherit appenders from deep parent with missing direct parent",
    t => {
      const config = {
        appenders: {
          stdout1: { type: "dummy-appender", label: "stdout1" },
          stdout2: { type: "dummy-appender", label: "stdout2" }
        },
        categories: {
          default: { appenders: ["stdout1"], level: "ERROR" },
          catA: { appenders: ["stdout1"], level: "INFO" },
          // no catA.catB, but should get created, with stdout1
          "catA.catB.catC": { level: "DEBUG" } // should get stdout1
        }
      };

      log4js.configure(config);

      const childCategoryName = "catA.catB.catC";
      const childAppenders = categories.appendersForCategory(childCategoryName);

      t.ok(childAppenders);
      t.isEqual(childAppenders.length, 1, "inherited 1 appenders");
      t.ok(
        childAppenders.some(a => a.label === "stdout1"),
        "inherited stdout1"
      );

      const firstParentCategoryName = "catA.catB";
      const firstParentAppenders = categories.appendersForCategory(
        firstParentCategoryName
      );

      t.ok(firstParentAppenders, "catA.catB got created implicitily");
      t.isEqual(
        firstParentAppenders.length,
        1,
        "created with 1 inherited appender"
      );
      t.ok(
        firstParentAppenders.some(a => a.label === "stdout1"),
        "inherited stdout1"
      );

      t.end();
    }
  );

  batch.test("should deal gracefully with missing parent", t => {
    const config = {
      appenders: {
        stdout1: { type: "dummy-appender", label: "stdout1" },
        stdout2: { type: "dummy-appender", label: "stdout2" }
      },
      categories: {
        default: { appenders: ["stdout1"], level: "ERROR" },
        // no catA nor catA.catB, but should get created, with default values
        "catA.catB.catC": { appenders: ["stdout2"], level: "DEBUG" } // should get stdout2, DEBUG
      }
    };

    log4js.configure(config);

    const childCategoryName = "catA.catB.catC";
    const childAppenders = categories.appendersForCategory(childCategoryName);

    t.ok(childAppenders);
    t.isEqual(childAppenders.length, 1);
    t.ok(childAppenders.some(a => a.label === "stdout2"));

    t.end();
  });

  batch.test(
    "should not get duplicate appenders if parent has the same one",
    t => {
      const config = {
        appenders: {
          stdout1: { type: "dummy-appender", label: "stdout1" },
          stdout2: { type: "dummy-appender", label: "stdout2" }
        },
        categories: {
          default: { appenders: ["stdout1"], level: "ERROR" },
          catA: { appenders: ["stdout1", "stdout2"], level: "INFO" },
          "catA.catB": { appenders: ["stdout1"], level: "DEBUG" }
        }
      };

      log4js.configure(config);

      const childCategoryName = "catA.catB";
      const childAppenders = categories.appendersForCategory(childCategoryName);

      t.ok(childAppenders);
      t.isEqual(childAppenders.length, 2, "inherited 1 appender");
      t.ok(
        childAppenders.some(a => a.label === "stdout1"),
        "still have stdout1"
      );
      t.ok(
        childAppenders.some(a => a.label === "stdout2"),
        "inherited stdout2"
      );
      t.end();
    }
  );

  batch.test("inherit:falses should disable inheritance", t => {
    const config = {
      appenders: {
        stdout1: { type: "dummy-appender", label: "stdout1" },
        stdout2: { type: "dummy-appender", label: "stdout2" }
      },
      categories: {
        default: { appenders: ["stdout1"], level: "ERROR" },
        catA: { appenders: ["stdout1"], level: "INFO" },
        "catA.catB": { appenders: ["stdout2"], level: "INFO", inherit: false } // should not inherit from catA
      }
    };

    log4js.configure(config);

    const childCategoryName = "catA.catB";
    const childAppenders = categories.appendersForCategory(childCategoryName);

    t.ok(childAppenders);
    t.isEqual(childAppenders.length, 1, "inherited no appender");
    t.ok(childAppenders.some(a => a.label === "stdout2"), "kept stdout2");

    t.end();
  });

  batch.test("inheritance should stop if direct parent has inherit off", t => {
    const config = {
      appenders: {
        stdout1: { type: "dummy-appender", label: "stdout1" },
        stdout2: { type: "dummy-appender", label: "stdout2" }
      },
      categories: {
        default: { appenders: ["stdout1"], level: "ERROR" },
        catA: { appenders: ["stdout1"], level: "INFO" },
        "catA.catB": { appenders: ["stdout2"], level: "INFO", inherit: false }, // should not inherit from catA
        "catA.catB.catC": { level: "DEBUG" } // should inherit from catB only
      }
    };

    log4js.configure(config);

    const childCategoryName = "catA.catB.catC";
    const childAppenders = categories.appendersForCategory(childCategoryName);

    t.ok(childAppenders);
    t.isEqual(childAppenders.length, 1, "inherited 1 appender");
    t.ok(childAppenders.some(a => a.label === "stdout2"), "inherited stdout2");

    const firstParentCategoryName = "catA.catB";
    const firstParentAppenders = categories.appendersForCategory(
      firstParentCategoryName
    );

    t.ok(firstParentAppenders);
    t.isEqual(firstParentAppenders.length, 1, "did not inherit new appenders");
    t.ok(firstParentAppenders.some(a => a.label === "stdout2"), "kept stdout2");

    t.end();
  });

  batch.test("should inherit level when it is missing", t => {
    const config = {
      appenders: {
        stdout1: { type: "dummy-appender", label: "stdout1" },
        stdout2: { type: "dummy-appender", label: "stdout2" }
      },
      categories: {
        default: { appenders: ["stdout1"], level: "ERROR" },
        catA: { appenders: ["stdout1"], level: "INFO" },
        // no catA.catB, but should get created, with stdout1, level INFO
        "catA.catB.catC": {} // should get stdout1, level INFO
      }
    };

    log4js.configure(config);

    const childCategoryName = "catA.catB.catC";
    const childLevel = categories.getLevelForCategory(childCategoryName);

    t.isEqual(childLevel.levelStr, "INFO", "inherited level");

    const firstParentCategoryName = "catA.catB";
    const firstParentLevel = categories.getLevelForCategory(
      firstParentCategoryName
    );

    t.isEqual(
      firstParentLevel.levelStr,
      "INFO",
      "generate parent inherited level from base"
    );

    t.end();
  });

  batch.end();
});
