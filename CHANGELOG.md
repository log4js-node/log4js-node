# log4js-node changelog

## 6.1.2

- [Handle out-of-order appender loading](https://github.com/log4js-node/log4js-node/pull/986) - thanks [@mvastola](https://github.com/mvastola)

## 6.1.1

- [Add guards for undefined shutdown callback](https://github.com/log4js-node/log4js-node/pull/972) - thanks [@aaron-edwards](https://github.com/aaron-edwards)
- [Ignore .bob files](https://github.com/log4js-node/log4js-node/pull/975) - thanks [@cesine](https://github.com/cesine)
- [Add mark method to type definitions](https://github.com/log4js-node/log4js-node/pull/984) - thanks [@techmunk](https://github.com/techmunk)

## 6.1.0

- [Add pause event to dateFile appender](https://github.com/log4js-node/log4js-node/pull/965) - thanks [@shayantabatabaee](https://github.com/shayantabatabaee)
- [Add pause event to file appender](https://github.com/log4js-node/log4js-node/pull/938) - thanks [@shayantabatabaee](https://github.com/shayantabatabaee)
- [Add pause/resume event to docs](https://github.com/log4js-node/log4js-node/pull/966)

## 6.0.0

- [Update streamroller to fix unhandled promise rejection](https://github.com/log4js-node/log4js-node/pull/962)
- [Updated date-format library](https://github.com/log4js-node/log4js-node/pull/960)

## 5.3.0

- [Padding and truncation changes](https://github.com/log4js-node/log4js-node/pull/956)

## 5.2.2

- [Update streamroller to fix overwriting old files when using date rolling](https://github.com/log4js-node/log4js-node/pull/951)

## 5.2.1

- [Update streamroller to fix numToKeep not working with dateFile pattern that is all digits](https://github.com/log4js-node/log4js-node/pull/949)

## 5.2.0

- [Update streamroller to 2.2.0 (copy and truncate when file is busy)](https://github.com/log4js-node/log4js-node/pull/948)

## 5.1.0

- [Update streamroller to 2.1.0 (windows fixes)](https://github.com/log4js-node/log4js-node/pull/933)

## 5.0.0

- [Update streamroller to 2.0.0 (remove support for node v6)](https://github.com/log4js-node/log4js-node/pull/922)
- [Update dependencies (mostly dev deps)](https://github.com/log4js-node/log4js-node/pull/923)
- [Fix error when cluster not available](https://github.com/log4js-node/log4js-node/pull/930)
- [Test coverage improvements](https://github.com/log4js-node/log4js-node/pull/925)

## 4.5.1

- [Update streamroller 1.0.5 -> 1.0.6 (to fix overwriting old backup log files)](https://github.com/log4js-node/log4js-node/pull/918)
- [Dependency update: lodash 4.17.4 (dependency of a dependency, not log4js)](https://github.com/log4js-node/log4js-node/pull/917) - thanks Github Automated Security Thing.
- [Dependency update: lodash 4.4.0 -> 4.5.0 (dependency of a dependency, not log4js)](https://github.com/log4js-node/log4js-node/pull/915) - thanks Github Automated Security Thing.

## 4.5.0

- [Override call stack parsing](https://github.com/log4js-node/log4js-node/pull/914) - thanks [@rommni](https://github.com/rommni)
- [patternLayout filename depth token](https://github.com/log4js-node/log4js-node/pull/913) - thanks [@rommni](https://github.com/rommni)

## 4.4.0

- [Add option to pass appender module in config](https://github.com/log4js-node/log4js-node/pull/833) - thanks [@kaxelson](https://github.com/kaxelson)
- [Added docs for passing appender module](https://github.com/log4js-node/log4js-node/pull/904)
- [Updated dependencies](https://github.com/log4js-node/log4js-node/pull/900)

## 4.3.2

- [Types for enableCallStack](https://github.com/log4js-node/log4js-node/pull/897) - thanks [@citrusjunoss](https://github.com/citrusjunoss)

## 4.3.1

- [Fix for maxLogSize in dateFile appender](https://github.com/log4js-node/log4js-node/pull/889)

## 4.3.0

- [Feature: line number support](https://github.com/log4js-node/log4js-node/pull/879) - thanks [@victor0801x](https://github.com/victor0801x)
- [Fix for missing core appenders in webpack](https://github.com/log4js-node/log4js-node/pull/882)

## 4.2.0

- [Feature: add appender and level inheritance](https://github.com/log4js-node/log4js-node/pull/863) - thanks [@pharapiak](https://github.com/pharapiak)
- [Feature: add response to context for connectLogger](https://github.com/log4js-node/log4js-node/pull/862) - thanks [@leak4mk0](https://github.com/leak4mk0)
- [Fix for broken sighup handler](https://github.com/log4js-node/log4js-node/pull/873)
- [Add missing types for Level](https://github.com/log4js-node/log4js-node/pull/872) - thanks [@Ivkaa](https://github.com/Ivkaa)
- [Typescript fixes for connect logger context](https://github.com/log4js-node/log4js-node/pull/876) - thanks [@leak4mk0](https://github.com/leak4mk0)
- [Upgrade to streamroller-1.0.5 to fix log rotation bug](https://github.com/log4js-node/log4js-node/pull/878)

## 4.1.1

- [Various test fixes for node v12](https://github.com/log4js-node/log4js-node/pull/870)
- [Fix layout problem in node v12](https://github.com/log4js-node/log4js-node/pull/860) - thanks [@bjornstar](https://github.com/bjornstar)
- [Add missing types for addLevels](https://github.com/log4js-node/log4js-node/pull/867) - thanks [@Ivkaa](https://github.com/Ivkaa)
- [Allow any return type for layout function](https://github.com/log4js-node/log4js-node/pull/845) - thanks [@xinbenlv](https://github.com/xinbenlv)

## 4.1.0

- Updated streamroller to 1.0.4, to fix a bug where the inital size of an existing file was ignored when appending
- [Updated streamroller to 1.0.3](https://github.com/log4js-node/log4js-node/pull/841), to fix a crash bug if the date pattern was all digits.
- [Updated dependencies](https://github.com/log4js-node/log4js-node/pull/840)

## Previous versions

Change information for older versions can be found by looking at the milestones in github.
