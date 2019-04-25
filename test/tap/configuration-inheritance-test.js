'use strict';

const test = require('tap').test;
// const util = require('util');
// const debug = require('debug')('log4js:test.configuration-inheritance');
const log4js = require('../../lib/log4js');
// const configuration = require('../../lib/configuration');


test('log4js category inherit all appenders from direct parent', (batch) => {
  batch.test('should inherit appenders from direct parent', (t) => {
    const config = {
      appenders: {
        stdout1: { type: 'stdout' },
        stdout2: { type: 'stdout' }
      },
      categories: {
        default: { appenders: ['stdout1'], level: 'ERROR' },
        catA: { appenders: ['stdout1', 'stdout2'], level: 'INFO' },
        'catA.catB': { level: 'DEBUG' }
      }
    };

    log4js.configure(config);

    const child = config.categories['catA.catB'];
    t.ok(child);
    t.ok(child.appenders);
    t.isEqual(child.appenders.length, 2, 'inherited 2 appenders');
    t.ok(child.appenders.includes('stdout1'), 'inherited stdout1');
    t.ok(child.appenders.includes('stdout2'), 'inherited stdout2');
    t.isEqual(child.level, 'DEBUG', 'child level overrides parent');
    t.end();
  });

  batch.test('multiple children should inherit config from shared parent', (t) => {
    const config = {
      appenders: {
        stdout1: { type: 'stdout' },
        stdout2: { type: 'stdout' }
      },
      categories: {
        default: { appenders: ['stdout1'], level: 'ERROR' },
        catA: { appenders: ['stdout1'], level: 'INFO' },
        'catA.catB.cat1': { level: 'DEBUG' }, // should get sdtout1, DEBUG
        'catA.catB.cat2': { appenders: ['stdout2'] } // should get sdtout1,sdtout2, INFO
      }
    };

    log4js.configure(config);

    const child1 = config.categories['catA.catB.cat1'];
    t.ok(child1);
    t.ok(child1.appenders);
    t.isEqual(child1.appenders.length, 1, 'inherited 1 appender');
    t.ok(child1.appenders.includes('stdout1'), 'inherited stdout1');
    t.isEqual(child1.level, 'DEBUG', 'child level overrides parent');

    const child2 = config.categories['catA.catB.cat2'];
    t.ok(child2);
    t.ok(child2.appenders);
    t.isEqual(child2.appenders.length, 2, 'inherited 1 appenders, plus its original');
    t.ok(child2.appenders.includes('stdout1'), 'inherited stdout1');
    t.ok(child2.appenders.includes('stdout2'), 'kept stdout2');
    t.isEqual(child2.level, 'INFO', 'inherited parent level');

    t.end();
  });

  batch.test('should inherit appenders from multiple parents', (t) => {
    const config = {
      appenders: {
        stdout1: { type: 'stdout' },
        stdout2: { type: 'stdout' }
      },
      categories: {
        default: { appenders: ['stdout1'], level: 'ERROR' },
        catA: { appenders: ['stdout1'], level: 'INFO' },
        'catA.catB': { appenders: ['stdout2'], level: 'INFO' }, // should get stdout1 and stdout2
        'catA.catB.catC': { level: 'DEBUG' } // should get stdout1 and stdout2
      }
    };

    log4js.configure(config);

    const child = config.categories['catA.catB.catC'];
    t.ok(child);
    t.ok(child.appenders);
    t.isEqual(child.appenders.length, 2, 'inherited 2 appenders');
    t.ok(child.appenders.includes('stdout1'), 'inherited stdout1');
    t.ok(child.appenders.includes('stdout1'), 'inherited stdout1');

    const firstParent = config.categories['catA.catB'];
    t.ok(firstParent);
    t.ok(firstParent.appenders);
    t.isEqual(firstParent.appenders.length, 2, 'ended up with 2 appenders');
    t.ok(firstParent.appenders.includes('stdout1'), 'inherited stdout1');
    t.ok(firstParent.appenders.includes('stdout2'), 'kept stdout2');


    t.end();
  });

  batch.test('should inherit appenders from deep parent with missing direct parent', (t) => {
    const config = {
      appenders: {
        stdout1: { type: 'stdout' },
        stdout2: { type: 'stdout' }
      },
      categories: {
        default: { appenders: ['stdout1'], level: 'ERROR' },
        catA: { appenders: ['stdout1'], level: 'INFO' },
        // no catA.catB, but should get created, with stdout1
        'catA.catB.catC': { level: 'DEBUG' } // should get stdout1
      }
    };

    log4js.configure(config);

    const child = config.categories['catA.catB.catC'];
    t.ok(child);
    t.ok(child.appenders);
    t.isEqual(child.appenders.length, 1, 'inherited 1 appenders');
    t.ok(child.appenders.includes('stdout1'), 'inherited stdout1');

    const firstParent = config.categories['catA.catB'];
    t.ok(firstParent);
    t.ok(firstParent.appenders, 'catA.catB got created implicitily');
    t.isEqual(firstParent.appenders.length, 1, 'created with 1 inherited appender');
    t.ok(firstParent.appenders.includes('stdout1'), 'inherited stdout1');

    t.end();
  });


  batch.test('should not get duplicate appenders if parent has the same one', (t) => {
    const config = {
      appenders: {
        stdout1: { type: 'stdout' },
        stdout2: { type: 'stdout' }
      },
      categories: {
        default: { appenders: ['stdout1'], level: 'ERROR' },
        catA: { appenders: ['stdout1', 'stdout2'], level: 'INFO' },
        'catA.catB': { appenders: ['stdout1'], level: 'DEBUG' }
      }
    };

    log4js.configure(config);

    const child = config.categories['catA.catB'];
    t.ok(child);
    t.ok(child.appenders);
    t.isEqual(child.appenders.length, 2, 'inherited 1 appender');
    t.ok(child.appenders.includes('stdout1'), 'still have stdout1');
    t.ok(child.appenders.includes('stdout2'), 'inherited stdout2');
    t.end();
  });

  batch.test('inherit:falses should disable inheritance', (t) => {
    const config = {
      appenders: {
        stdout1: { type: 'stdout' },
        stdout2: { type: 'stdout' }
      },
      categories: {
        default: { appenders: ['stdout1'], level: 'ERROR' },
        catA: { appenders: ['stdout1'], level: 'INFO' },
        'catA.catB': { appenders: ['stdout2'], level: 'INFO', inherit: false }, // should not inherit from catA
      }
    };

    log4js.configure(config);

    const child = config.categories['catA.catB'];
    t.ok(child);
    t.ok(child.appenders);
    t.isEqual(child.appenders.length, 1, 'inherited no appender');
    t.ok(child.appenders.includes('stdout2'), 'kept stdout2');

    t.end();
  });


  batch.test('inheritance should stop if direct parent has inherit off', (t) => {
    const config = {
      appenders: {
        stdout1: { type: 'stdout' },
        stdout2: { type: 'stdout' }
      },
      categories: {
        default: { appenders: ['stdout1'], level: 'ERROR' },
        catA: { appenders: ['stdout1'], level: 'INFO' },
        'catA.catB': { appenders: ['stdout2'], level: 'INFO', inherit: false }, // should not inherit from catA
        'catA.catB.catC': { level: 'DEBUG' } // should inherit from catB only
      }
    };

    log4js.configure(config);

    const child = config.categories['catA.catB.catC'];
    t.ok(child);
    t.ok(child.appenders);
    t.isEqual(child.appenders.length, 1, 'inherited 1 appender');
    t.ok(child.appenders.includes('stdout2'), 'inherited stdout2');

    const firstParent = config.categories['catA.catB'];
    t.ok(firstParent);
    t.ok(firstParent.appenders);
    t.isEqual(firstParent.appenders.length, 1, 'did not inherit new appenders');
    t.ok(firstParent.appenders.includes('stdout2'), 'kept stdout2');

    t.end();
  });

  batch.test('should inherit level when it is missing', (t) => {
    const config = {
      appenders: {
        stdout1: { type: 'stdout' },
        stdout2: { type: 'stdout' }
      },
      categories: {
        default: { appenders: ['stdout1'], level: 'ERROR' },
        catA: { appenders: ['stdout1'], level: 'INFO' },
        // no catA.catB, but should get created, with stdout1, level INFO
        'catA.catB.catC': {} // should get stdout1, level INFO
      }
    };

    log4js.configure(config);

    const child = config.categories['catA.catB.catC'];
    t.ok(child);
    t.isEqual(child.level, 'INFO', 'inherited level');

    const firstParent = config.categories['catA.catB'];
    t.ok(firstParent);
    t.isEqual(firstParent.level, 'INFO', 'generate parent inherited level from base');

    t.end();
  });

  batch.end();
});
