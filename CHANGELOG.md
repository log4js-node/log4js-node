# log4js-node Changelog

## 6.5.2

- [fix(types): add LogEvent.serialise](https://github.com/log4js-node/log4js-node/pull/1260) - thanks [@marrowleaves](https://github.com/marrowleaves)

## 6.5.1

- [fix: fs.appendFileSync should use flag instead of flags](https://github.com/log4js-node/log4js-node/pull/1257) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1258) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps): bump streamroller from 3.1.0 to 3.1.1
  - chore(deps): updated package-lock.json

## 6.5.0

- [feat: logger.log() to be synonym of logger.info()](https://github.com/log4js-node/log4js-node/pull/1254) - thanks [@peteriman](https://github.com/peteriman)
- [feat: tilde expansion for filename](https://github.com/log4js-node/log4js-node/pull/1252) - thanks [@peteriman](https://github.com/peteriman)
- [fix: better file validation](https://github.com/log4js-node/log4js-node/pull/1251) - thanks [@peteriman](https://github.com/peteriman)
- [fix: fallback for logger.log outputs nothing](https://github.com/log4js-node/log4js-node/pull/1247) - thanks [@peteriman](https://github.com/peteriman)
- [docs: updated fileAppender maxLogSize documentation](https://github.com/log4js-node/log4js-node/pull/1248) - thanks [@peteriman](https://github.com/peteriman)
- [ci: enforced 100% test coverage tests](https://github.com/log4js-node/log4js-node/pull/1253) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1256) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps-dev): bump eslint from 8.15.0 to 8.16.0
  - chore(deps): bump streamroller from 3.0.9 to 3.1.0
  - chore(deps): updated package-lock.json

## 6.4.7

- [fix: dateFileAppender unable to use units in maxLogSize](https://github.com/log4js-node/log4js-node/pull/1243) - thanks [@peteriman](https://github.com/peteriman)
- [type: added fileNameSep for FileAppender and DateFileAppender](https://github.com/log4js-node/log4js-node/pull/1241) - thanks [@peteriman](https://github.com/peteriman)
- [docs: updated usage of units for maxLogSize](https://github.com/log4js-node/log4js-node/pull/1242) - thanks [@peteriman](https://github.com/peteriman)
- [docs: updated comments in typescript def](https://github.com/log4js-node/log4js-node/pull/1240) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1244) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps-dev): bump eslint from 8.14.0 to 8.15.0
  - chore(deps-dev): bump husky from 7.0.4 to 8.0.1
  - chore(deps-dev): bump tap from 16.1.0 to 16.2.0
  - chore(deps-dev): bump typescript from 4.6.3 to 4.6.4
  - chore(deps): bump date-format from 4.0.9 to 4.0.10
  - chore(deps): bump streamroller from 3.0.8 to 3.0.9
  - chore(deps): updated package-lock.json
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1238) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps-dev): bump tap from 16.0.1 to 16.1.0
  - chore(deps-dev): updated package-lock.json

## 6.4.6

- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1236) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps-dev): bump eslint from 8.13.0 to 8.14.0
  - chore(deps): bump date-format from 4.0.7 to 4.0.9
  - chore(deps): bump streamroller from 3.0.7 to 3.0.8
    - fix: [#1216](https://github.com/log4js-node/log4js-node/issues/1216) where promise rejection is not handled ([streamroller@3.0.8 changelog](https://github.com/log4js-node/streamroller/blob/master/CHANGELOG.md))
  - chore(deps): updated package-lock.json
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1234) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps): bump fs-extra from 10.0.1 to 10.1.0
  - chore(deps): updated package-lock.json

## 6.4.5

- [fix: deserialise for enableCallStack features: filename, lineNumber, columnNumber, callStack](https://github.com/log4js-node/log4js-node/pull/1230) - thanks [@peteriman](https://github.com/peteriman)
- [fix: fileDepth for ESM](https://github.com/log4js-node/log4js-node/pull/1224) - thanks [@peteriman](https://github.com/peteriman)
- [refactor: replace deprecated String.prototype.substr()](https://github.com/log4js-node/log4js-node/pull/1223) - thanks [@CommanderRoot](https://github.com/CommanderRoot)
- [type: LogEvent types](https://github.com/log4js-node/log4js-node/pull/1231) - thanks [@peteriman](https://github.com/peteriman)
- [docs: updated typescript usage](https://github.com/log4js-node/log4js-node/pull/1229) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1232) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps): bump date-format from 4.0.6 to 4.0.7
  - chore(deps): bump streamroller from 3.0.6 to 3.0.7
    - fix: [#1225](https://github.com/log4js-node/log4js-node/issues/1225) where fs-extra throws error when fs.realpath.native is undefined ([streamroller@3.0.7 changelog](https://github.com/log4js-node/streamroller/blob/master/CHANGELOG.md))
  - chore(deps): updated package-lock.json
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1228) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps-dev): bump eslint from 8.11.0 to 8.13.0
  - chore(deps-dev): bump eslint-plugin-import from 2.25.4 to 2.26.0
  - chore(deps-dev): bump tap from 16.0.0 to 16.0.1
  - chore(deps-dev): bump typescript from 4.6.2 to 4.6.3
  - chore(deps-dev): updated package-lock.json
- [chore(deps-dev): bump minimist from 1.2.5 to 1.2.6](https://github.com/log4js-node/log4js-node/pull/1227) - thanks [@Dependabot](https://github.com/dependabot)

## 6.4.4

- [fix: set logger.level on runtime will no longer wrongly reset useCallStack](https://github.com/log4js-node/log4js-node/pull/1217)  - thanks [@peteriman](https://github.com/peteriman)
- [docs: updated docs for broken links and inaccessible pages](https://github.com/log4js-node/log4js-node/pull/1219) - thanks [@peteriman](https://github.com/peteriman)
- [docs: broken link to gelf appender](https://github.com/log4js-node/log4js-node/pull/1218) - thanks [@mattalexx](https://github.com/mattalexx)
- [docs: updated docs for appenders module loading](https://github.com/log4js-node/log4js-node/pull/985) - thanks [@leonimurilo](https://github.com/leonimurilo)
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1221) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps): bump streamroller from 3.0.5 to 3.0.6
  - chore(deps): bump debug from 4.3.3 to 4.3.4
  - chore(deps): bump date-format from 4.0.5 to 4.0.6
  - chore(deps-dev): bump prettier from 2.5.1 to 2.6.0
  - chore(deps): updated package-lock.json

## 6.4.3


- [fix: added filename validation](https://github.com/log4js-node/log4js-node/pull/1201) - thanks [@peteriman](https://github.com/peteriman)
- [refactor: do not initialise default appenders as it will be done again by configure()](https://github.com/log4js-node/log4js-node/pull/1210) - thanks [@peteriman](https://github.com/peteriman)
- [refactor: defensive coding for cluster=null if require('cluster') fails in try-catch ](https://github.com/log4js-node/log4js-node/pull/1199) - thanks [@peteriman](https://github.com/peteriman)
- [refactor: removed redundant logic in tcp-serverAppender](https://github.com/log4js-node/log4js-node/pull/1198) - thanks [@peteriman](https://github.com/peteriman)
- [refactor: removed redundant logic in multiprocessAppender](https://github.com/log4js-node/log4js-node/pull/1197) - thanks [@peteriman](https://github.com/peteriman)
- test: 100% test coverage - thanks [@peteriman](https://github.com/peteriman)
  - test: part 1 of 3: https://github.com/log4js-node/log4js-node/pull/1200
  - test: part 2 of 3: https://github.com/log4js-node/log4js-node/pull/1204
  - test: part 3 of 3: https://github.com/log4js-node/log4js-node/pull/1205
  - [test: improved test cases](https://github.com/log4js-node/log4js-node/pull/1211)
- [docs: updated README.md with badges](https://github.com/log4js-node/log4js-node/pull/1209) - thanks [@peteriman](https://github.com/peteriman)
- [docs: added docs for istanbul ignore](https://github.com/log4js-node/log4js-node/pull/1208) - thanks [@peteriman](https://github.com/peteriman)
- [docs: updated logger api docs](https://github.com/log4js-node/log4js-node/pull/1203) - thanks [@peteriman](https://github.com/peteriman)
- [docs: updated file and fileSync appender docs](https://github.com/log4js-node/log4js-node/pull/1202) - thanks [@peteriman](https://github.com/peteriman)
- [chore(lint): improve eslint rules](https://github.com/log4js-node/log4js-node/pull/1206) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1207) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps-dev): bump eslint from 8.10.0 to 8.11.0
  - chore(deps-dev): bump eslint-config-airbnb-base from 13.2.0 to 15.0.0
  - chore(deps-dev): bump eslint-config-prettier from 8.4.0 to 8.5.0
  - chore(deps-dev): bump tap from 15.1.6 to 16.0.0
  - chore(deps): bump date-format from 4.0.4 to 4.0.5
  - chore(deps): bump streamroller from 3.0.4 to 3.0.5
  - chore(deps): updated package-lock.json

## 6.4.2

- [fix: fileSync appender to create directory recursively](https://github.com/log4js-node/log4js-node/pull/1191) - thanks [@peteriman](https://github.com/peteriman)
- [fix: serialise() for NaN, Infinity, -Infinity and undefined](https://github.com/log4js-node/log4js-node/pull/1188) - thanks [@peteriman](https://github.com/peteriman)
- [fix: connectLogger not logging on close](https://github.com/log4js-node/log4js-node/pull/1179) - thanks [@peteriman](https://github.com/peteriman)
- [refactor: defensive coding](https://github.com/log4js-node/log4js-node/pull/1183) - thanks [@peteriman](https://github.com/peteriman)
- [type: fixed Logger constructor](https://github.com/log4js-node/log4js-node/pull/1177) - thanks [@peteriman](https://github.com/peteriman)
- [test: improve test coverage](https://github.com/log4js-node/log4js-node/pull/1184) - thanks [@peteriman](https://github.com/peteriman)
- [test: refactor and replaced tap deprecation in preparation for tap v15](https://github.com/log4js-node/log4js-node/pull/1172) - thanks [@peteriman](https://github.com/peteriman)
- [test: added e2e test for multiprocess Appender](https://github.com/log4js-node/log4js-node/pull/1170) - thanks [@nicojs](https://github.com/nicojs)
- [docs: updated file appender docs](https://github.com/log4js-node/log4js-node/pull/1182) - thanks [@peteriman](https://github.com/peteriman)
- [docs: updated dateFile appender docs](https://github.com/log4js-node/log4js-node/pull/1181) - thanks [@peteriman](https://github.com/peteriman)
- [docs: corrected typo in sample code for multiFile appender](https://github.com/log4js-node/log4js-node/pull/1180) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): updated deps-dev](https://github.com/log4js-node/log4js-node/pull/1194) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps): bump date-format from 4.0.3 to 4.0.4
  - chore(deps): bump streamroller from 3.0.2 to 3.0.4
    - fix: [#1189](https://github.com/log4js-node/log4js-node/issues/1189) for an compatibility issue with directory creation for NodeJS < 10.12.0 ([streamroller@3.0.3 changelog](https://github.com/log4js-node/streamroller/blob/master/CHANGELOG.md))
  - chore(deps-dev): bump eslint from 8.8.0 to 8.10.0
  - chore(deps-dev): bump eslint-config-prettier from 8.3.0 to 8.4.0
  - chore(deps-dev): bump fs-extra from 10.0.0 to 10.0.1
  - chore(deps-dev): bump typescript from 4.5.5 to 4.6.2
- [chore(deps): updated deps-dev](https://github.com/log4js-node/log4js-node/pull/1185) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps): bump flatted from 3.2.4 to 3.2.5
  - chore(deps-dev): bump eslint from 8.7.0 to 8.8.0
- [chore(deps): updated package-lock.json](https://github.com/log4js-node/log4js-node/pull/1174) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps-dev): bump tap from 14.10.7 to 15.1.6](https://github.com/log4js-node/log4js-node/pull/1173) - thanks [@peteriman](https://github.com/peteriman)

## 6.4.1

- [fix: startup multiprocess even when no direct appenders](https://github.com/log4js-node/log4js-node/pull/1162) - thanks [@nicojs](https://github.com/nicojs)
  - [refactor: fixed eslint warnings](https://github.com/log4js-node/log4js-node/pull/1165) - thanks [@peteriman](https://github.com/peteriman)
- [refactor: additional alias for date patterns](https://github.com/log4js-node/log4js-node/pull/1163) - thanks [@peteriman](https://github.com/peteriman)
- [refactor: added emitWarning for deprecation](https://github.com/log4js-node/log4js-node/pull/1164) - thanks [@peteriman](https://github.com/peteriman)
- [type: Fixed wrong types from 6.4.0 regression](https://github.com/log4js-node/log4js-node/pull/1158) - thanks [@glasser](https://github.com/glasser)
- [docs: changed author to contributors in package.json](https://github.com/log4js-node/log4js-node/pull/1153) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): bump node-fetch from 2.6.6 to 2.6.7](https://github.com/log4js-node/log4js-node/pull/1167) - thanks [@Dependabot](https://github.com/dependabot)
- [chore(deps-dev): bump typescript from 4.5.4 to 4.5.5](https://github.com/log4js-node/log4js-node/pull/1166) - thanks [@peteriman](https://github.com/peteriman)

## 6.4.0 - BREAKING CHANGE 💥
New default file permissions may cause external applications unable to read logs.
A [manual code/configuration change](https://github.com/log4js-node/log4js-node/pull/1141#issuecomment-1076224470) is required.

- [feat: added warnings when log() is used with invalid levels before fallbacking to INFO](https://github.com/log4js-node/log4js-node/pull/1062) - thanks [@abernh](https://github.com/abernh)
- [feat: exposed Recording](https://github.com/log4js-node/log4js-node/pull/1103) - thanks [@polo-language](https://github.com/polo-language)
- [fix: default file permission to be 0o600 instead of 0o644](https://github.com/log4js-node/log4js-node/pull/1141) - thanks [ranjit-git](https://www.huntr.dev/users/ranjit-git) and [@peteriman](https://github.com/peteriman)
  - [docs: updated fileSync.md and misc comments](https://github.com/log4js-node/log4js-node/pull/1148) - thanks [@peteriman](https://github.com/peteriman)
- [fix: file descriptor leak if repeated configure()](https://github.com/log4js-node/log4js-node/pull/1113) - thanks [@peteriman](https://github.com/peteriman)
- [fix: MaxListenersExceededWarning from NodeJS](https://github.com/log4js-node/log4js-node/pull/1110) - thanks [@peteriman](https://github.com/peteriman)
  - [test: added assertion for increase of SIGHUP listeners on log4js.configure()](https://github.com/log4js-node/log4js-node/pull/1142) - thanks [@peteriman](https://github.com/peteriman)
- [fix: missing TCP appender with Webpack and Typescript](https://github.com/log4js-node/log4js-node/pull/1028) - thanks [@techmunk](https://github.com/techmunk)
- [fix: dateFile appender exiting NodeJS on error](https://github.com/log4js-node/log4js-node/pull/1097) - thanks [@4eb0da](https://github.com/4eb0da)
  - [refactor: using writer.writable instead of alive for checking](https://github.com/log4js-node/log4js-node/pull/1144) - thanks [@peteriman](https://github.com/peteriman)
- [fix: TCP appender exiting NodeJS on error](https://github.com/log4js-node/log4js-node/pull/1089) - thanks [@jhonatanTeixeira](https://github.com/jhonatanTeixeira)
- [fix: multiprocess appender exiting NodeJS on error](https://github.com/log4js-node/log4js-node/pull/529) - thanks [@harlentan](https://github.com/harlentan)
- [test: update fakeFS.read as graceful-fs uses it](https://github.com/log4js-node/log4js-node/pull/1127) - thanks [@peteriman](https://github.com/peteriman)
- [test: update fakeFS.realpath as fs-extra uses it](https://github.com/log4js-node/log4js-node/pull/1128) - thanks [@peteriman](https://github.com/peteriman)
- test: added tap.tearDown() to clean up test files
  - test: [#1143](https://github.com/log4js-node/log4js-node/pull/1143) - thanks [@peteriman](https://github.com/peteriman)
  - test: [#1022](https://github.com/log4js-node/log4js-node/pull/1022) - thanks [@abetomo](https://github.com/abetomo)
- [type: improved @types for AppenderModule](https://github.com/log4js-node/log4js-node/pull/1079) - thanks [@nicobao](https://github.com/nicobao)
- [type: Updated fileSync appender types](https://github.com/log4js-node/log4js-node/pull/1116) - thanks [@peteriman](https://github.com/peteriman)
- [type: Removed erroneous type in file appender](https://github.com/log4js-node/log4js-node/pull/1031) - thanks [@vdmtrv](https://github.com/vdmtrv)
- [type: Updated Logger.log type](https://github.com/log4js-node/log4js-node/pull/1115) - thanks [@ZLundqvist](https://github.com/ZLundqvist)
- [type: Updated Logger.\_log type](https://github.com/log4js-node/log4js-node/pull/1117) - thanks [@peteriman](https://github.com/peteriman)
- [type: Updated Logger.level type](https://github.com/log4js-node/log4js-node/pull/1118) - thanks [@peteriman](https://github.com/peteriman)
- [type: Updated Levels.getLevel type](https://github.com/log4js-node/log4js-node/pull/1072) - thanks [@saulzhong](https://github.com/saulzhong)
- [chore(deps): bump streamroller from 3.0.1 to 3.0.2](https://github.com/log4js-node/log4js-node/pull/1147) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): bump date-format from 4.0.2 to 4.0.3](https://github.com/log4js-node/log4js-node/pull/1146) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps-dev): bump eslint from from 8.6.0 to 8.7.0](https://github.com/log4js-node/log4js-node/pull/1145) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps-dev): bump nyc from 14.1.1 to 15.1.0](https://github.com/log4js-node/log4js-node/pull/1140) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps-dev): bump eslint from 5.16.0 to 8.6.0](https://github.com/log4js-node/log4js-node/pull/1138) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): bump flatted from 2.0.2 to 3.2.4](https://github.com/log4js-node/log4js-node/pull/1137) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps-dev): bump fs-extra from 8.1.0 to 10.0.0](https://github.com/log4js-node/log4js-node/pull/1136) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): bump streamroller from 2.2.4 to 3.0.1](https://github.com/log4js-node/log4js-node/pull/1135) - thanks [@peteriman](https://github.com/peteriman)
  - [fix: compressed file ignores dateFile appender "mode"](https://github.com/log4js-node/streamroller/pull/65) - thanks [@rnd-debug](https://github.com/rnd-debug)
  - fix: [#1039](https://github.com/log4js-node/log4js-node/issues/1039) where there is an additional separator in filename ([streamroller@3.0.0 changelog](https://github.com/log4js-node/streamroller/blob/master/CHANGELOG.md))
  - fix: [#1035](https://github.com/log4js-node/log4js-node/issues/1035), [#1080](https://github.com/log4js-node/log4js-node/issues/1080) for daysToKeep naming confusion ([streamroller@3.0.0 changelog](https://github.com/log4js-node/streamroller/blob/master/CHANGELOG.md))
  - [refactor: migrated from daysToKeep to numBackups due to streamroller@^3.0.0](https://github.com/log4js-node/log4js-node/pull/1149) - thanks [@peteriman](https://github.com/peteriman)
  - [feat: allows for zero backups](https://github.com/log4js-node/log4js-node/pull/1151) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): bump date-format from 3.0.0 to 4.0.2](https://github.com/log4js-node/log4js-node/pull/1134) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1130) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps-dev): bump eslint-config-prettier from 6.15.0 to 8.3.0
  - chore(deps-dev): bump eslint-plugin-prettier from 3.4.1 to 4.0.0
  - chore(deps-dev): bump husky from 3.1.0 to 7.0.4
  - chore(deps-dev): bump prettier from 1.19.0 to 2.5.1
  - chore(deps-dev): bump typescript from 3.9.10 to 4.5.4 
- [chore(deps-dev): bump eslint-config-prettier from 6.15.0 to 8.3.0](https://github.com/log4js-node/log4js-node/pull/1129) - thanks [@peteriman](https://github.com/peteriman)
- [chore(deps): updated dependencies](https://github.com/log4js-node/log4js-node/pull/1121) - thanks [@peteriman](https://github.com/peteriman)
  - chore(deps-dev): bump codecov from 3.6.1 to 3.8.3
  - chore(deps-dev): bump eslint-config-prettier from 6.5.0 to 6.15.0
  - chore(deps-dev): bump eslint-import-resolver-node from 0.3.2 to 0.3.6
  - chore(deps-dev): bump eslint-plugin-import" from 2.18.2 to 2.25.4
  - chore(deps-dev): bump eslint-plugin-prettier from 3.1.1 to 3.4.1
  - chore(deps-dev): bump husky from 3.0.9 to 3.1.0
  - chore(deps-dev): bump prettier from 1.18.2 to 1.19.1
  - chore(deps-dev): bump typescript from 3.7.2 to 3.9.10
- [chore(deps): bump path-parse from 1.0.6 to 1.0.7](https://github.com/log4js-node/log4js-node/pull/1120) - thanks [@Dependabot](https://github.com/dependabot)
- [chore(deps): bump glob-parent from 5.1.1 to 5.1.2](https://github.com/log4js-node/log4js-node/pull/1084) - thanks [@Dependabot](https://github.com/dependabot)
- [chore(deps): bump hosted-git-info from 2.7.1 to 2.8.9](https://github.com/log4js-node/log4js-node/pull/1076) - thanks [@Dependabot](https://github.com/dependabot)
- [chore(deps): bump lodash from 4.17.14 to 4.17.21](https://github.com/log4js-node/log4js-node/pull/1075) - thanks [@Dependabot](https://github.com/dependabot)
- [chore(deps): bump y18n from 4.0.0 to 4.0.1](https://github.com/log4js-node/log4js-node/pull/1070) - thanks [@Dependabot](https://github.com/dependabot)
- [chore(deps): bump node-fetch from 2.6.0 to 2.6.1](https://github.com/log4js-node/log4js-node/pull/1047) - thanks [@Dependabot](https://github.com/dependabot)
- [chore(deps): bump yargs-parser from 13.1.1 to 13.1.2](https://github.com/log4js-node/log4js-node/pull/1045) - thanks [@Dependabot](https://github.com/dependabot)
- [chore(deps-dev): bump codecov from 3.6.5 to 3.7.1](https://github.com/log4js-node/log4js-node/pull/1033) - thanks [@Dependabot](https://github.com/dependabot)

## 6.3.0

- [Add option to file appender to remove ANSI colours](https://github.com/log4js-node/log4js-node/pull/1001) - thanks [@BlueCocoa](https://github.com/BlueCocoa)
- [Do not create appender if no categories use it](https://github.com/log4js-node/log4js-node/pull/1002) - thanks [@rnd-debug](https://github.com/rnd-debug)
- [Docs: better categories inheritance description](https://github.com/log4js-node/log4js-node/pull/1003) - thanks [@rnd-debug](https://github.com/rnd-debug)
- [Better jsdoc docs](https://github.com/log4js-node/log4js-node/pull/1004) - thanks [@wataash](https://github.com/wataash)
- [Typescript: access category field in Logger](https://github.com/log4js-node/log4js-node/pull/1006) - thanks [@rtvd](https://github.com/rtvd)
- [Docs: influxdb appender](https://github.com/log4js-node/log4js-node/pull/1014) - thanks [@rnd-debug](https://github.com/rnd-debug)
- [Support for fileSync appender in webpack](https://github.com/log4js-node/log4js-node/pull/1015) - thanks [@lauren-li](https://github.com/lauren-li)
- [Docs: UDP appender](https://github.com/log4js-node/log4js-node/pull/1018) - thanks [@iassasin](https://github.com/iassasin)
- [Style: spaces and tabs](https://github.com/log4js-node/log4js-node/pull/1016) - thanks [@abetomo](https://github.com/abetomo)

## 6.2.1

- [Update streamroller to 2.2.4 to fix incorrect filename matching during log rotation](https://github.com/log4js-node/log4js-node/pull/996)

## 6.2.0

- [Add custom message end token to TCP appender](https://github.com/log4js-node/log4js-node/pull/994) - thanks [@rnd-debug](https://github.com/rnd-debug)
- [Update acorn (dev dep of a dep)](https://github.com/log4js-node/log4js-node/pull/992) - thanks Github Robots.

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
