'use strict';

const test = require('tap').test;
const levels = require('../../lib/levels')();

function assertThat(assert, level) {
  function assertForEach(assertion, testFn, otherLevels) {
    otherLevels.forEach((other) => {
      assertion.call(assert, testFn.call(level, other));
    });
  }

  return {
    isLessThanOrEqualTo: function (lvls) {
      assertForEach(assert.ok, level.isLessThanOrEqualTo, lvls);
    },
    isNotLessThanOrEqualTo: function (lvls) {
      assertForEach(assert.notOk, level.isLessThanOrEqualTo, lvls);
    },
    isGreaterThanOrEqualTo: function (lvls) {
      assertForEach(assert.ok, level.isGreaterThanOrEqualTo, lvls);
    },
    isNotGreaterThanOrEqualTo: function (lvls) {
      assertForEach(assert.notOk, level.isGreaterThanOrEqualTo, lvls);
    },
    isEqualTo: function (lvls) {
      assertForEach(assert.ok, level.isEqualTo, lvls);
    },
    isNotEqualTo: function (lvls) {
      assertForEach(assert.notOk, level.isEqualTo, lvls);
    }
  };
}

test('levels', (batch) => {
  batch.test('values', (t) => {
    t.test('should define some levels', (assert) => {
      assert.ok(levels.ALL);
      assert.ok(levels.TRACE);
      assert.ok(levels.DEBUG);
      assert.ok(levels.INFO);
      assert.ok(levels.WARN);
      assert.ok(levels.ERROR);
      assert.ok(levels.FATAL);
      assert.ok(levels.MARK);
      assert.ok(levels.OFF);
      assert.end();
    });

    t.test('ALL', (assert) => {
      const all = levels.ALL;
      assertThat(assert, all).isLessThanOrEqualTo(
        [
          levels.ALL,
          levels.TRACE,
          levels.DEBUG,
          levels.INFO,
          levels.WARN,
          levels.ERROR,
          levels.FATAL,
          levels.MARK,
          levels.OFF
        ]
      );
      assertThat(assert, all).isNotGreaterThanOrEqualTo(
        [
          levels.TRACE,
          levels.DEBUG,
          levels.INFO,
          levels.WARN,
          levels.ERROR,
          levels.FATAL,
          levels.MARK,
          levels.OFF
        ]
      );
      assertThat(assert, all).isEqualTo([levels.getLevel('ALL')]);
      assertThat(assert, all).isNotEqualTo(
        [
          levels.TRACE,
          levels.DEBUG,
          levels.INFO,
          levels.WARN,
          levels.ERROR,
          levels.FATAL,
          levels.MARK,
          levels.OFF
        ]
      );
      assert.end();
    });

    t.test('TRACE', (assert) => {
      const trace = levels.TRACE;
      assertThat(assert, trace).isLessThanOrEqualTo(
        [
          levels.DEBUG,
          levels.INFO,
          levels.WARN,
          levels.ERROR,
          levels.FATAL,
          levels.MARK,
          levels.OFF
        ]
      );
      assertThat(assert, trace).isNotLessThanOrEqualTo([levels.ALL]);
      assertThat(assert, trace).isGreaterThanOrEqualTo([levels.ALL, levels.TRACE]);
      assertThat(assert, trace).isNotGreaterThanOrEqualTo(
        [
          levels.DEBUG,
          levels.INFO,
          levels.WARN,
          levels.ERROR,
          levels.FATAL,
          levels.MARK,
          levels.OFF
        ]
      );
      assertThat(assert, trace).isEqualTo([levels.getLevel('TRACE')]);
      assertThat(assert, trace).isNotEqualTo(
        [
          levels.ALL,
          levels.DEBUG,
          levels.INFO,
          levels.WARN,
          levels.ERROR,
          levels.FATAL,
          levels.MARK,
          levels.OFF
        ]
      );
      assert.end();
    });

    t.test('DEBUG', (assert) => {
      const debug = levels.DEBUG;
      assertThat(assert, debug).isLessThanOrEqualTo(
        [
          levels.INFO,
          levels.WARN,
          levels.ERROR,
          levels.FATAL,
          levels.MARK,
          levels.OFF
        ]
      );
      assertThat(assert, debug).isNotLessThanOrEqualTo([levels.ALL, levels.TRACE]);
      assertThat(assert, debug).isGreaterThanOrEqualTo([levels.ALL, levels.TRACE]);
      assertThat(assert, debug).isNotGreaterThanOrEqualTo(
        [
          levels.INFO,
          levels.WARN,
          levels.ERROR,
          levels.FATAL,
          levels.MARK,
          levels.OFF
        ]
      );
      assertThat(assert, debug).isEqualTo([levels.getLevel('DEBUG')]);
      assertThat(assert, debug).isNotEqualTo(
        [
          levels.ALL,
          levels.TRACE,
          levels.INFO,
          levels.WARN,
          levels.ERROR,
          levels.FATAL,
          levels.MARK,
          levels.OFF
        ]
      );
      assert.end();
    });

    t.test('INFO', (assert) => {
      const info = levels.INFO;
      assertThat(assert, info).isLessThanOrEqualTo([
        levels.WARN,
        levels.ERROR,
        levels.FATAL,
        levels.MARK,
        levels.OFF
      ]);
      assertThat(assert, info).isNotLessThanOrEqualTo([levels.ALL, levels.TRACE, levels.DEBUG]);
      assertThat(assert, info).isGreaterThanOrEqualTo([levels.ALL, levels.TRACE, levels.DEBUG]);
      assertThat(assert, info).isNotGreaterThanOrEqualTo([
        levels.WARN,
        levels.ERROR,
        levels.FATAL,
        levels.MARK,
        levels.OFF
      ]);
      assertThat(assert, info).isEqualTo([levels.getLevel('INFO')]);
      assertThat(assert, info).isNotEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.WARN,
        levels.ERROR,
        levels.FATAL,
        levels.MARK,
        levels.OFF
      ]);
      assert.end();
    });

    t.test('WARN', (assert) => {
      const warn = levels.WARN;
      assertThat(assert, warn).isLessThanOrEqualTo([levels.ERROR, levels.FATAL, levels.MARK, levels.OFF]);
      assertThat(assert, warn).isNotLessThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO
      ]);
      assertThat(assert, warn).isGreaterThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO
      ]);
      assertThat(assert, warn).isNotGreaterThanOrEqualTo([
        levels.ERROR, levels.FATAL, levels.MARK, levels.OFF
      ]);
      assertThat(assert, warn).isEqualTo([levels.getLevel('WARN')]);
      assertThat(assert, warn).isNotEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.ERROR,
        levels.FATAL,
        levels.OFF
      ]);
      assert.end();
    });

    t.test('ERROR', (assert) => {
      const error = levels.ERROR;
      assertThat(assert, error).isLessThanOrEqualTo([levels.FATAL, levels.MARK, levels.OFF]);
      assertThat(assert, error).isNotLessThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN
      ]);
      assertThat(assert, error).isGreaterThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN
      ]);
      assertThat(assert, error).isNotGreaterThanOrEqualTo([levels.FATAL, levels.MARK, levels.OFF]);
      assertThat(assert, error).isEqualTo([levels.getLevel('ERROR')]);
      assertThat(assert, error).isNotEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.FATAL,
        levels.MARK,
        levels.OFF
      ]);
      assert.end();
    });

    t.test('FATAL', (assert) => {
      const fatal = levels.FATAL;
      assertThat(assert, fatal).isLessThanOrEqualTo([levels.MARK, levels.OFF]);
      assertThat(assert, fatal).isNotLessThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.ERROR
      ]);
      assertThat(assert, fatal).isGreaterThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.ERROR
      ]);
      assertThat(assert, fatal).isNotGreaterThanOrEqualTo([levels.MARK, levels.OFF]);
      assertThat(assert, fatal).isEqualTo([levels.getLevel('FATAL')]);
      assertThat(assert, fatal).isNotEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.ERROR,
        levels.MARK,
        levels.OFF
      ]);
      assert.end();
    });

    t.test('MARK', (assert) => {
      const mark = levels.MARK;
      assertThat(assert, mark).isLessThanOrEqualTo([levels.OFF]);
      assertThat(assert, mark).isNotLessThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.FATAL,
        levels.ERROR
      ]);
      assertThat(assert, mark).isGreaterThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.ERROR,
        levels.FATAL
      ]);
      assertThat(assert, mark).isNotGreaterThanOrEqualTo([levels.OFF]);
      assertThat(assert, mark).isEqualTo([levels.getLevel('MARK')]);
      assertThat(assert, mark).isNotEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.ERROR,
        levels.FATAL,
        levels.OFF
      ]);
      assert.end();
    });

    t.test('OFF', (assert) => {
      const off = levels.OFF;
      assertThat(assert, off).isNotLessThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.ERROR,
        levels.FATAL,
        levels.MARK
      ]);
      assertThat(assert, off).isGreaterThanOrEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.ERROR,
        levels.FATAL,
        levels.MARK
      ]);
      assertThat(assert, off).isEqualTo([levels.getLevel('OFF')]);
      assertThat(assert, off).isNotEqualTo([
        levels.ALL,
        levels.TRACE,
        levels.DEBUG,
        levels.INFO,
        levels.WARN,
        levels.ERROR,
        levels.FATAL,
        levels.MARK
      ]);
      assert.end();
    });
    t.end();
  });

  batch.test('isGreaterThanOrEqualTo', (t) => {
    const info = levels.INFO;
    assertThat(t, info).isGreaterThanOrEqualTo(['all', 'trace', 'debug']);
    assertThat(t, info).isNotGreaterThanOrEqualTo(['warn', 'ERROR', 'Fatal', 'MARK', 'off']);
    t.end();
  });

  batch.test('isLessThanOrEqualTo', (t) => {
    const info = levels.INFO;
    assertThat(t, info).isNotLessThanOrEqualTo(['all', 'trace', 'debug']);
    assertThat(t, info).isLessThanOrEqualTo(['warn', 'ERROR', 'Fatal', 'MARK', 'off']);
    t.end();
  });

  batch.test('isEqualTo', (t) => {
    const info = levels.INFO;
    assertThat(t, info).isEqualTo(['info', 'INFO', 'iNfO']);
    t.end();
  });

  batch.test('toLevel', (t) => {
    t.equal(levels.getLevel('debug'), levels.DEBUG);
    t.equal(levels.getLevel('DEBUG'), levels.DEBUG);
    t.equal(levels.getLevel('DeBuG'), levels.DEBUG);
    t.notOk(levels.getLevel('cheese'));
    t.equal(levels.getLevel('cheese', levels.DEBUG), levels.DEBUG);
    t.end();
  });

  batch.end();
});
