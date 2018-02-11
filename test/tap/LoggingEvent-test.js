const test = require('tap').test;
const LoggingEvent = require('../../lib/LoggingEvent');
const levels = require('../../lib/levels');

test('LoggingEvent', (batch) => {
  batch.test('should serialise to JSON', (t) => {
    const event = new LoggingEvent('cheese', levels.DEBUG, ['log message'], { user: 'bob' });
    // set the event date to a known value
    event.startTime = new Date(Date.UTC(2018, 1, 4, 18, 30, 23, 10));
    const rehydratedEvent = JSON.parse(event.serialise());
    t.equal(rehydratedEvent.startTime, '2018-02-04T18:30:23.010Z');
    t.equal(rehydratedEvent.categoryName, 'cheese');
    t.equal(rehydratedEvent.level.levelStr, 'DEBUG');
    t.equal(rehydratedEvent.data.length, 1);
    t.equal(rehydratedEvent.data[0], 'log message');
    t.equal(rehydratedEvent.context.user, 'bob');
    t.end();
  });

  batch.test('should deserialise from JSON', (t) => {
    const dehydratedEvent = `{
      "startTime": "2018-02-04T10:25:23.010Z",
      "categoryName": "biscuits",
      "level": {
        "levelStr": "INFO"
      },
      "data": [ "some log message", { "x": 1 } ],
      "context": { "thing": "otherThing" }
    }`;
    const event = LoggingEvent.deserialise(dehydratedEvent);
    t.type(event, LoggingEvent);
    t.same(event.startTime, new Date(Date.UTC(2018, 1, 4, 10, 25, 23, 10)));
    t.equal(event.categoryName, 'biscuits');
    t.same(event.level, levels.INFO);
    t.equal(event.data[0], 'some log message');
    t.equal(event.data[1].x, 1);
    t.equal(event.context.thing, 'otherThing');
    t.end();
  });

  batch.end();
});
