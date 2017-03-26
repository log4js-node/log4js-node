CHANGES
=======

- no exit listeners defined for appenders by default. users should call log4js.shutdown in their exit listeners.
- context added to loggers (only logstash uses it so far)
- logstash split into two appenders (udp and http)
- no cwd, reload options in config
- configure only by calling configure, no manual adding of appenders, etc
- config format changed a lot, now need to define named appenders and at least one category
- appender format changed, will break any non-core appenders (maybe create adapter?)
- no replacement of console functions
