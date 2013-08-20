"use strict";
var assert = require('assert')
, should = require('should')
, levels = require('../lib/levels');

function assertThat(level) {
  function assertForEach(val, test, otherLevels) {
    otherLevels.forEach(function(other) {
      test.call(level, other).should.eql(val);
    });
  }

  return {
    isLessThanOrEqualTo: function(levels) {
      assertForEach(true, level.isLessThanOrEqualTo, levels);
    },
    isNotLessThanOrEqualTo: function(levels) {
      assertForEach(false, level.isLessThanOrEqualTo, levels);
    },
    isGreaterThanOrEqualTo: function(levels) {
      assertForEach(true, level.isGreaterThanOrEqualTo, levels);
    },
    isNotGreaterThanOrEqualTo: function(levels) {
      assertForEach(false, level.isGreaterThanOrEqualTo, levels);
    },
    isEqualTo: function(levels) {
      assertForEach(true, level.isEqualTo, levels);
    },
    isNotEqualTo: function(levels) {
      assertForEach(false, level.isEqualTo, levels);
    }
  };
}

describe('../lib/levels', function() {
  it('should define some levels', function() {
    should.exist(levels.ALL);
    should.exist(levels.TRACE);
    should.exist(levels.DEBUG);
    should.exist(levels.INFO);
    should.exist(levels.WARN);
    should.exist(levels.ERROR);
    should.exist(levels.FATAL);
    should.exist(levels.OFF);
  });

  describe('ALL', function() {
    var all = levels.ALL;
    
    it('should be less than the other levels', function() {
      assertThat(all).isLessThanOrEqualTo(
        [ 
          levels.ALL, 
          levels.TRACE, 
          levels.DEBUG, 
          levels.INFO, 
          levels.WARN, 
          levels.ERROR, 
          levels.FATAL, 
          levels.OFF
        ]
      );
    });

    it('should be greater than no levels', function() {
      assertThat(all).isNotGreaterThanOrEqualTo(
        [
          levels.TRACE, 
          levels.DEBUG, 
          levels.INFO, 
          levels.WARN, 
          levels.ERROR, 
          levels.FATAL, 
          levels.OFF
        ]
      );
    });

    it('should only be equal to ALL', function() {
      assertThat(all).isEqualTo([levels.toLevel("ALL")]);
      assertThat(all).isNotEqualTo(
        [
          levels.TRACE, 
          levels.DEBUG, 
          levels.INFO, 
          levels.WARN, 
          levels.ERROR, 
          levels.FATAL, 
          levels.OFF
        ]
      );
    });
  });

  describe('TRACE', function() {
    var trace = levels.TRACE;

    it('should be less than DEBUG', function() {
      assertThat(trace).isLessThanOrEqualTo(
        [
          levels.DEBUG, 
          levels.INFO, 
          levels.WARN, 
          levels.ERROR, 
          levels.FATAL, 
          levels.OFF
        ]
      );
      assertThat(trace).isNotLessThanOrEqualTo([levels.ALL]);
    });

    it('should be greater than ALL', function() {
      assertThat(trace).isGreaterThanOrEqualTo([levels.ALL, levels.TRACE]);
      assertThat(trace).isNotGreaterThanOrEqualTo(
        [
          levels.DEBUG, 
          levels.INFO, 
          levels.WARN, 
          levels.ERROR, 
          levels.FATAL, 
          levels.OFF
        ]
      );
    });

    it('should only be equal to TRACE', function() {
      assertThat(trace).isEqualTo([levels.toLevel("TRACE")]);
      assertThat(trace).isNotEqualTo(
        [
          levels.ALL, 
          levels.DEBUG, 
          levels.INFO, 
          levels.WARN, 
          levels.ERROR, 
          levels.FATAL, 
          levels.OFF
        ]
      );
    });

  });

  describe('DEBUG', function() {
    var debug = levels.DEBUG;

    it('should be less than INFO', function() {
      assertThat(debug).isLessThanOrEqualTo(
        [
          levels.INFO, 
          levels.WARN, 
          levels.ERROR, 
          levels.FATAL, 
          levels.OFF
        ]
      );
      assertThat(debug).isNotLessThanOrEqualTo([levels.ALL, levels.TRACE]);
    });

    it('should be greater than TRACE', function() {
      assertThat(debug).isGreaterThanOrEqualTo([levels.ALL, levels.TRACE]);
      assertThat(debug).isNotGreaterThanOrEqualTo(
        [
          levels.INFO, 
          levels.WARN, 
          levels.ERROR, 
          levels.FATAL, 
          levels.OFF
        ]
      );
    });

    it('should only be equal to DEBUG', function() {
      assertThat(debug).isEqualTo([levels.toLevel("DEBUG")]);
      assertThat(debug).isNotEqualTo(
        [
          levels.ALL, 
          levels.TRACE, 
          levels.INFO, 
          levels.WARN, 
          levels.ERROR, 
          levels.FATAL, 
          levels.OFF
        ]
      );
    });
  });

  describe('INFO', function() {
    var info = levels.INFO;

    it('should be less than WARN', function() {
      assertThat(info).isLessThanOrEqualTo([
        levels.WARN, 
        levels.ERROR, 
        levels.FATAL, 
        levels.OFF
      ]);
      assertThat(info).isNotLessThanOrEqualTo([levels.ALL, levels.TRACE, levels.DEBUG]);
    });

    it('should be greater than DEBUG', function() {
      assertThat(info).isGreaterThanOrEqualTo([levels.ALL, levels.TRACE, levels.DEBUG]);
      assertThat(info).isNotGreaterThanOrEqualTo([
        levels.WARN, 
        levels.ERROR, 
        levels.FATAL, 
        levels.OFF
      ]);
    });

    it('should only be equal to INFO', function() {
      assertThat(info).isEqualTo([levels.toLevel("INFO")]);
      assertThat(info).isNotEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.WARN, 
        levels.ERROR, 
        levels.FATAL, 
        levels.OFF
      ]);
    });
  });

  describe('WARN', function() {
    var warn = levels.WARN;

    it('should be less than ERROR', function() {
      assertThat(warn).isLessThanOrEqualTo([levels.ERROR, levels.FATAL, levels.OFF]);
      assertThat(warn).isNotLessThanOrEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO
      ]);
    });

    it('should be greater than INFO', function() {
      assertThat(warn).isGreaterThanOrEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO
      ]);
      assertThat(warn).isNotGreaterThanOrEqualTo([levels.ERROR, levels.FATAL, levels.OFF]);
    });

    it('should only be equal to WARN', function() {
      assertThat(warn).isEqualTo([levels.toLevel("WARN")]);
      assertThat(warn).isNotEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.ERROR, 
        levels.FATAL, 
        levels.OFF
      ]);
    });
  });

  describe('ERROR', function() {
    var error = levels.ERROR;

    it('should be less than FATAL', function() {
      assertThat(error).isLessThanOrEqualTo([levels.FATAL, levels.OFF]);
      assertThat(error).isNotLessThanOrEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.WARN
      ]);
    });
    
    it('should be greater than WARN', function() {
      assertThat(error).isGreaterThanOrEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.WARN
      ]);
      assertThat(error).isNotGreaterThanOrEqualTo([levels.FATAL, levels.OFF]);
    });

    it('should only be equal to ERROR', function() {
      assertThat(error).isEqualTo([levels.toLevel("ERROR")]);
      assertThat(error).isNotEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.WARN, 
        levels.FATAL, 
        levels.OFF
      ]);
    });
  });

  describe('FATAL', function() {
    var fatal = levels.FATAL;

    it('should be less than OFF', function() {
      assertThat(fatal).isLessThanOrEqualTo([levels.OFF]);
      assertThat(fatal).isNotLessThanOrEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.WARN, 
        levels.ERROR
      ]);
    });

    it('should be greater than ERROR', function() {
      assertThat(fatal).isGreaterThanOrEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.WARN, 
        levels.ERROR
      ]);
      assertThat(fatal).isNotGreaterThanOrEqualTo([levels.OFF]);
    });

    it('should only be equal to FATAL', function() {
      assertThat(fatal).isEqualTo([levels.toLevel("FATAL")]);
      assertThat(fatal).isNotEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.WARN, 
        levels.ERROR, 
        levels.OFF
      ]);
    });
  });

  describe('OFF', function() {
    var off = levels.OFF;

    it('should not be less than anything', function() {
      assertThat(off).isNotLessThanOrEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.WARN, 
        levels.ERROR, 
        levels.FATAL
      ]);
    });

    it('should be greater than everything', function() {
      assertThat(off).isGreaterThanOrEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.WARN, 
        levels.ERROR, 
        levels.FATAL
      ]);
    });

    it('should only be equal to OFF', function() {
      assertThat(off).isEqualTo([levels.toLevel("OFF")]);
      assertThat(off).isNotEqualTo([
        levels.ALL, 
        levels.TRACE, 
        levels.DEBUG, 
        levels.INFO, 
        levels.WARN, 
        levels.ERROR, 
        levels.FATAL
      ]);
    });
  });

  describe('isGreaterThanOrEqualTo', function() {
    var info = levels.INFO;
    it('should handle string arguments', function() {
      assertThat(info).isGreaterThanOrEqualTo(["all", "trace", "debug"]);
      assertThat(info).isNotGreaterThanOrEqualTo(['warn', 'ERROR', 'Fatal', 'off']);
    });
  });

  describe('isLessThanOrEqualTo', function() {
    var info = levels.INFO;
    it('should handle string arguments', function() {
      assertThat(info).isNotLessThanOrEqualTo(["all", "trace", "debug"]);
      assertThat(info).isLessThanOrEqualTo(['warn', 'ERROR', 'Fatal', 'off']);
    });
  });

  describe('isEqualTo', function() {
    var info = levels.INFO;
    it('should handle string arguments', function() {
      assertThat(info).isEqualTo(["info", "INFO", "iNfO"]);
    });
  });

  describe('toLevel', function() {
    it('should ignore the case of arguments', function() {
      levels.toLevel("debug").should.eql(levels.DEBUG);
      levels.toLevel("DEBUG").should.eql(levels.DEBUG);
      levels.toLevel("DeBuG").should.eql(levels.DEBUG);
    });

    it('should return undefined when argument is not recognised', function() {
      should.not.exist(levels.toLevel("cheese"));
    });

    it('should return the default value if argument is not recognised', function() {
      levels.toLevel("cheese", levels.DEBUG).should.eql(levels.DEBUG);
    });
  });

});
