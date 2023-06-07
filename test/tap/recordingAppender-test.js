const { test } = require('tap');
const log4js = require('../../lib/log4js');

test('recording appender', (batch) => {
  batch.test('should store logs in memory until cleared', (t) => {
    log4js.configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'debug' } },
    });

    const logger = log4js.getLogger();
    logger.level = 'debug';
    logger.debug('This will go to the recording!');
    logger.debug('Another one');

    const recording = log4js.recording();
    const loggingEvents = recording.playback();

    t.equal(loggingEvents.length, 2, 'There should be 2 recorded events');
    t.equal(loggingEvents[0].data[0], 'This will go to the recording!');
    t.equal(loggingEvents[1].data[0], 'Another one');

    recording.reset();
    const loggingEventsPostReset = recording.playback();

    t.equal(
      loggingEventsPostReset.length,
      0,
      'There should be 0 recorded events'
    );

    t.end();
  });

  batch.test('should store 2 rolling logs in memory until cleared', (t) => {
    log4js.configure({
      appenders: { rec2: { type: 'recording', maxLength: 2 } },
      categories: { default: { appenders: ['rec2'], level: 'debug' } },
    });

    const logger = log4js.getLogger();
    logger.level = 'debug';
    logger.debug('First log entry');
    logger.debug('Second log entry');

    const recording = log4js.recording();

    t.equal(
      recording.playback().length,
      2,
      'There should be 2 recorded events'
    );
    t.equal(recording.playback()[0].data[0], 'First log entry');
    t.equal(recording.playback()[1].data[0], 'Second log entry');

    logger.debug('Third log entry');

    t.equal(
      recording.playback().length,
      2,
      'There should still be 2 recording events'
    );
    t.equal(recording.playback()[0].data[0], 'Second log entry');
    t.equal(recording.playback()[1].data[0], 'Third log entry');

    recording.reset();
    const loggingEventsPostReset = recording.playback();

    t.equal(
      loggingEventsPostReset.length,
      0,
      'There should be 0 recorded events'
    );

    t.end();
  });

  batch.end();
});
