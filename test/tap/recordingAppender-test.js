const { test } = require('tap');
const log4js = require('../../lib/log4js');

test('recording appender', (t) => {
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
