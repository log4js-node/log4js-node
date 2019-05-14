# log4js-node changelog

## 4.2.0
* [Feature: add appender and level inheritance](https://github.com/log4js-node/log4js-node/pull/863) - thanks [@pharapiak](https://github.com/pharapiak)
* [Feature: add response to context for connectLogger](https://github.com/log4js-node/log4js-node/pull/862) - thanks [@leak4mk0](https://github.com/leak4mk0)
* [Fix for broken sighup handler](https://github.com/log4js-node/log4js-node/pull/873)
* [Add missing types for Level](https://github.com/log4js-node/log4js-node/pull/872) - thanks [@Ivkaa](https://github.com/Ivkaa)
* [Typescript fixes for connect logger context](https://github.com/log4js-node/log4js-node/pull/876) - thanks [@leak4mk0](https://github.com/leak4mk0)
* [Upgrade to streamroller-1.0.5 to fix log rotation bug](https://github.com/log4js-node/log4js-node/pull/878)

## 4.1.1
* [Various test fixes for node v12](https://github.com/log4js-node/log4js-node/pull/870)
* [Fix layout problem in node v12](https://github.com/log4js-node/log4js-node/pull/860) - thanks [@bjornstar](https://github.com/bjornstar)
* [Add missing types for addLevels](https://github.com/log4js-node/log4js-node/pull/867) - thanks [@Ivkaa](https://github.com/Ivkaa)
* [Allow any return type for layout function](https://github.com/log4js-node/log4js-node/pull/845) - thanks [@xinbenlv](https://github.com/xinbenlv)

## 4.1.0

* Updated streamroller to 1.0.4, to fix a bug where the inital size of an existing file was ignored when appending
* [Updated streamroller to 1.0.3](https://github.com/log4js-node/log4js-node/pull/841), to fix a crash bug if the date pattern was all digits.
* [Updated dependencies](https://github.com/log4js-node/log4js-node/pull/840)

## Previous versions
Change information for older versions can be found by looking at the milestones in github.
