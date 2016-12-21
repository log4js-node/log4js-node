'use strict';

// This test shows unexpected behaviour for log4js.configure() in log4js-node@0.4.3 and earlier:
// 1) log4js.configure(), log4js.configure(null),
// log4js.configure({}), log4js.configure(<some object with no levels prop>)
// all set all loggers levels to trace, even if they were previously set to something else.
// 2) log4js.configure({levels:{}}), log4js.configure({levels: {foo:
// bar}}) leaves previously set logger levels intact.
//

// Basic set up
const vows = require('vows');
const assert = require('assert');

// uncomment one or other of the following to see progress (or not) while running the tests
// var showProgress = console.log;
const showProgress = function () {
};


// Define the array of levels as string to iterate over.
const strLevels = ['Trace', 'Debug', 'Info', 'Warn', 'Error', 'Fatal'];

// setup the configurations we want to test
const configs = {
  nop: 'nop', // special case where the iterating vows generator will not call log4js.configure
  'is undefined': undefined,
  'is null': null,
  'is empty': {},
  'has no levels': { foo: 'bar' },
  'has null levels': { levels: null },
  'has empty levels': { levels: {} },
  'has random levels': { levels: { foo: 'bar' } },
  'has some valid levels': { levels: { A: 'INFO' } }
};

// Set up the basic vows batches for this test
const batches = [];


function getLoggerName(level) {
  return `${level}-logger`;
}

// the common vows top-level context, whether log4js.configure is called or not
// just making sure that the code is common,
// so that there are no spurious errors in the tests themselves.
function getTopLevelContext(nop, configToTest) {
  return {
    topic: function () {
      const log4js = require('../../lib/log4js');
      // create loggers for each level,
      // keeping the level in the logger's name for traceability
      strLevels.forEach((l) => {
        log4js.getLogger(getLoggerName(l)).setLevel(l);
      });

      if (!nop) {
        showProgress('** Configuring log4js with', configToTest);
        log4js.configure(configToTest);
      } else {
        showProgress('** Not configuring log4js');
      }
      return log4js;
    }
  };
}

showProgress('Populating batch object...');

function checkForMismatch(topic) {
  const er = topic.log4js.levels.toLevel(topic.baseLevel)
    .isLessThanOrEqualTo(topic.log4js.levels.toLevel(topic.comparisonLevel));

  assert.equal(
    er,
    topic.expectedResult,
    `Mismatch: for setLevel(${topic.baseLevel}) was expecting a comparison with ${topic.comparisonLevel} to be ${topic.expectedResult}`
  );
}

function checkExpectedResult(topic) {
  const result = topic.log4js
    .getLogger(getLoggerName(topic.baseLevel))
    .isLevelEnabled(topic.log4js.levels.toLevel(topic.comparisonLevel));

  assert.equal(
    result,
    topic.expectedResult,
    `Failed: ${getLoggerName(topic.baseLevel)}.isLevelEnabled( ${topic.comparisonLevel} ) returned ${result}`
  );
}

function setupBaseLevelAndCompareToOtherLevels(baseLevel) {
  const baseLevelSubContext = `and checking the logger whose level was set to ${baseLevel}`;
  const subContext = { topic: baseLevel };
  batch[context][baseLevelSubContext] = subContext;

  // each logging level has strLevels sub-contexts,
  // to exhaustively test all the combinations of
  // setLevel(baseLevel) and isLevelEnabled(comparisonLevel) per config
  strLevels.forEach(compareToOtherLevels(subContext));
}

function compareToOtherLevels(subContext) {
  const baseLevel = subContext.topic;

  return function (comparisonLevel) {
    const comparisonLevelSubContext = `with isLevelEnabled(${comparisonLevel})`;

    // calculate this independently of log4js, but we'll add a vow
    // later on to check that we're not mismatched with log4js
    const expectedResult = strLevels.indexOf(baseLevel) <= strLevels.indexOf(comparisonLevel);

    // the topic simply gathers all the parameters for the vow
    // into an object, to simplify the vow's work.
    subContext[comparisonLevelSubContext] = {
      topic: function (baseLvl, log4js) {
        return {
          comparisonLevel: comparisonLevel,
          baseLevel: baseLvl,
          log4js: log4js,
          expectedResult: expectedResult
        };
      }
    };

    const vow = `should return ${expectedResult}`;
    subContext[comparisonLevelSubContext][vow] = checkExpectedResult;

    // the extra vow to check the comparison between baseLevel and
    // comparisonLevel we performed earlier matches log4js'
    // comparison too
    const subSubContext = subContext[comparisonLevelSubContext];
    subSubContext['finally checking for comparison mismatch with log4js'] = checkForMismatch;
  };
}

// Populating the batches programmatically, as there are
// (configs.length x strLevels.length x strLevels.length) = 324
// possible test combinations

// todo: WARNING, here the batch and context is used globally, should be redesigned
let context;
let batch;
for (const cfg in configs) { // eslint-disable-line
  const configToTest = configs[cfg];
  const nop = configToTest === 'nop';

  if (nop) {
    context = 'Setting up loggers with initial levels, then NOT setting a configuration,';
  } else {
    context = `Setting up loggers with initial levels, then setting a configuration which ${cfg},`;
  }

  showProgress(`Setting up the vows batch and context for ${context}`);
  // each config to be tested has its own vows batch with a single top-level context
  batch = {};
  batch[context] = getTopLevelContext(nop, configToTest, context);
  batches.push(batch);

  // each top-level context has strLevels sub-contexts, one per logger
  // which has set to a specific level in the top-level context's topic
  strLevels.forEach(setupBaseLevelAndCompareToOtherLevels);
}

showProgress('Running tests');
let v = vows.describe('log4js.configure(), with or without a "levels" property');

batches.forEach((btc) => {
  v = v.addBatch(btc);
});

v.export(module);

