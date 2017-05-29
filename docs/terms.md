## Terminology

`Level` - a log level is the severity or priority of a log event (debug, info, etc). Whether an _appender_ will see the event or not is determined by the _category_'s level. If this is less than or equal to the event's level, it will be sent to the category's appender(s).

`Category` - a label for grouping log events. This can be based on module (e.g. 'auth', 'payment', 'http'), or anything you like. Log events with the same _category_ will go to the same _appenders_. Log4js supports a simple hierarchy for categories, using dots to separate layers - for example, log events in the category 'myapp.submodule' will use the appenders defined for 'myapp' if none are defined for 'myapp.submodule'. The category for log events is defined when you get a _Logger_ from log4js (`log4js.getLogger('somecategory')`).

`Appender` - appenders are responsible for output of log events. They may write events to files, send emails, store them in a database, or anything. Most appenders use _layouts_ to serialise the events to strings for output.

`Logger` - this is your code's main interface with log4js. A logger instance may have an optional _category_, defined when you create the instance. Loggers provide the `info`, `debug`, `error`, etc functions that create _LogEvents_ and pass them on to appenders.

`Layout` - a function for converting a _LogEvent_ into a string representation. Log4js comes with a few different implementations: basic, coloured, and a more configurable pattern based layout.

`LogEvent` - a log event has a timestamp, a level, and optional category, data, and context properties. When you call `logger.info('cheese value:', edam)` the _logger_ will create a log event with the timestamp of now, a _level_ of INFO, a _category_ that was chosen when the logger was created, and a data array with two values (the string 'cheese value:', and the object 'edam'), along with any context data that was added to the logger.
