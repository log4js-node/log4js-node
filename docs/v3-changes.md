# Changes in version 3.x of log4js

log4js no longer supports node versions less than 6.

The following appenders have been removed from the core, and moved to their own projects:
* [gelf](https://github.com/log4js-node/gelf)
* [hipchat](https://github.com/log4js-node/hipchat)
* [logFaces-HTTP](https://github.com/log4js-node/logFaces-HTTP)
* [logFaces-UDP](https://github.com/log4js-node/logFaces-UDP)
* [loggly](https://github.com/log4js-node/loggly)
* [logstashHTTP](https://github.com/log4js-node/logstashHTTP)
* [logstashUDP](https://github.com/log4js-node/logstashUDP)
* [mailgun](https://github.com/log4js-node/mailgun)
* [rabbitmq](https://github.com/log4js-node/rabbitmq)
* [redis](https://github.com/log4js-node/redis)
* [slack](https://github.com/log4js-node/slack)
* [smtp](https://github.com/log4js-node/smtp)

If you were using them, you'll need to `npm i @log4js-node/<appender>`.

Removing the optional appenders removed all the security vulnerabilities.

The TCP [client](tcp.md)/[server](tcp-server.md) was introduced to replace the multiprocess appender.

[Issues resolved in 3.0.0](https://github.com/log4js-node/log4js-node/milestone/31?closed=1)

[PR for the code changes](https://github.com/log4js-node/log4js-node/pull/754)
