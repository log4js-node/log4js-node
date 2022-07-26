// Type definitions for log4js

type Format =
  | string
  | ((req: any, res: any, formatter: (str: string) => string) => string);

export interface Log4js {
  getLogger(category?: string): Logger;
  configure(filename: string): Log4js;
  configure(config: Configuration): Log4js;
  addLayout(
    name: string,
    config: (a: any) => (logEvent: LoggingEvent) => string
  ): void;
  connectLogger(
    logger: Logger,
    options: { format?: Format; level?: string; nolog?: any }
  ): any; // express.Handler;
  levels: Levels;
  shutdown(cb: (error: Error) => void): void | null;
}

export function getLogger(category?: string): Logger;

export function configure(filename: string): Log4js;
export function configure(config: Configuration): Log4js;

export function addLayout(
  name: string,
  config: (a: any) => (logEvent: LoggingEvent) => any
): void;

export function connectLogger(
  logger: Logger,
  options: {
    format?: Format;
    level?: string;
    nolog?: any;
    statusRules?: any[];
    context?: boolean;
  }
): any; // express.Handler;

export function recording(): Recording;

export const levels: Levels;

export function shutdown(cb?: (error: Error) => void): void | null;

export interface BasicLayout {
  type: 'basic';
}

export interface ColoredLayout {
  type: 'colored' | 'coloured';
}

export interface MessagePassThroughLayout {
  type: 'messagePassThrough';
}

export interface DummyLayout {
  type: 'dummy';
}

export interface Level {
  isEqualTo(other: string): boolean;
  isEqualTo(otherLevel: Level): boolean;
  isLessThanOrEqualTo(other: string): boolean;
  isLessThanOrEqualTo(otherLevel: Level): boolean;
  isGreaterThanOrEqualTo(other: string): boolean;
  isGreaterThanOrEqualTo(otherLevel: Level): boolean;
  colour: string;
  level: number;
  levelStr: string;
}

export interface LoggingEvent {
  categoryName: string; // name of category
  level: Level; // level of message
  data: any[]; // objects to log
  startTime: Date;
  pid: number;
  context: any;
  cluster?: {
    workerId: number;
    worker: number;
  };
  functionName?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  callStack?: string;
  serialise(): string;
}

export type Token = ((logEvent: LoggingEvent) => string) | string;

export interface PatternLayout {
  type: 'pattern';
  // specifier for the output format, using placeholders as described below
  pattern: string;
  // user-defined tokens to be used in the pattern
  tokens?: { [name: string]: Token };
}

export interface CustomLayout {
  [key: string]: any;
  type: string;
}

export type Layout =
  | BasicLayout
  | ColoredLayout
  | MessagePassThroughLayout
  | DummyLayout
  | PatternLayout
  | CustomLayout;

/**
 * Category Filter
 *
 * @see https://log4js-node.github.io/log4js-node/categoryFilter.html
 */
export interface CategoryFilterAppender {
  type: 'categoryFilter';
  // the category (or categories if you provide an array of values) that will be excluded from the appender.
  exclude?: string | string[];
  // the name of the appender to filter. see https://log4js-node.github.io/log4js-node/layouts.html
  appender?: string;
}

/**
 * No Log Filter
 *
 * @see https://log4js-node.github.io/log4js-node/noLogFilter.html
 */
export interface NoLogFilterAppender {
  type: 'noLogFilter';
  // the regular expression (or the regular expressions if you provide an array of values)
  // will be used for evaluating the events to pass to the appender.
  // The events, which will match the regular expression, will be excluded and so not logged.
  exclude: string | string[];
  // the name of an appender, defined in the same configuration, that you want to filter.
  appender: string;
}

/**
 * Console Appender
 *
 * @see https://log4js-node.github.io/log4js-node/console.html
 */
export interface ConsoleAppender {
  type: 'console';
  // (defaults to ColoredLayout)
  layout?: Layout;
}

export interface FileAppender {
  type: 'file';
  // the path of the file where you want your logs written.
  filename: string;
  // (defaults to undefined) the maximum size (in bytes) for the log file. If not specified or 0, then no log rolling will happen.
  maxLogSize?: number | string;
  // (defaults to 5) the number of old log files to keep (excluding the hot file).
  backups?: number;
  // (defaults to BasicLayout)
  layout?: Layout;
  // (defaults to utf-8)
  encoding?: string;
  // (defaults to 0o600)
  mode?: number;
  // (defaults to a)
  flags?: string;
  // (defaults to false) compress the backup files using gzip (backup files will have .gz extension)
  compress?: boolean;
  // (defaults to false) preserve the file extension when rotating log files (`file.log` becomes `file.1.log` instead of `file.log.1`).
  keepFileExt?: boolean;
  // (defaults to .) the filename separator when rolling. e.g.: abc.log`.`1 or abc`.`1.log (keepFileExt)
  fileNameSep?: string;
}

export interface SyncfileAppender {
  type: 'fileSync';
  // the path of the file where you want your logs written.
  filename: string;
  // (defaults to undefined) the maximum size (in bytes) for the log file. If not specified or 0, then no log rolling will happen.
  maxLogSize?: number | string;
  // (defaults to 5) the number of old log files to keep (excluding the hot file).
  backups?: number;
  // (defaults to BasicLayout)
  layout?: Layout;
  // (defaults to utf-8)
  encoding?: string;
  // (defaults to 0o600)
  mode?: number;
  // (defaults to a)
  flags?: string;
}

export interface DateFileAppender {
  type: 'dateFile';
  // the path of the file where you want your logs written.
  filename: string;
  // (defaults to yyyy-MM-dd) the pattern to use to determine when to roll the logs.
  /**
   * The following strings are recognised in the pattern:
   *  - yyyy : the full year, use yy for just the last two digits
   *  - MM   : the month
   *  - dd   : the day of the month
   *  - hh   : the hour of the day (24-hour clock)
   *  - mm   : the minute of the hour
   *  - ss   : seconds
   *  - SSS  : milliseconds (although I'm not sure you'd want to roll your logs every millisecond)
   *  - O    : timezone (capital letter o)
   */
  pattern?: string;
  // (defaults to BasicLayout)
  layout?: Layout;
  // (defaults to utf-8)
  encoding?: string;
  // (defaults to 0o600)
  mode?: number;
  // (defaults to a)
  flags?: string;
  // (defaults to false) compress the backup files using gzip (backup files will have .gz extension)
  compress?: boolean;
  // (defaults to false) preserve the file extension when rotating log files (`file.log` becomes `file.2017-05-30.log` instead of `file.log.2017-05-30`).
  keepFileExt?: boolean;
  // (defaults to .) the filename separator when rolling. e.g.: abc.log`.`2013-08-30 or abc`.`2013-08-30.log (keepFileExt)
  fileNameSep?: string;
  // (defaults to false) include the pattern in the name of the current log file.
  alwaysIncludePattern?: boolean;
  // (defaults to 1) the number of old files that matches the pattern to keep (excluding the hot file).
  numBackups?: number;
}

export interface LogLevelFilterAppender {
  type: 'logLevelFilter';
  // the name of an appender, defined in the same configuration, that you want to filter
  appender: string;
  // the minimum level of event to allow through the filter
  level: string;
  // (defaults to FATAL) the maximum level of event to allow through the filter
  maxLevel?: string;
}

export interface MultiFileAppender {
  type: 'multiFile';
  // the base part of the generated log filename
  base: string;
  // the value to use to split files (see below).
  property: string;
  // the suffix for the generated log filename.
  extension: string;
}

export interface MultiprocessAppender {
  type: 'multiprocess';
  // controls whether the appender listens for log events sent over the network, or is responsible for serialising events and sending them to a server.
  mode: 'master' | 'worker';
  // (only needed if mode == master) the name of the appender to send the log events to
  appender?: string;
  // (defaults to 5000) the port to listen on, or send to
  loggerPort?: number;
  // (defaults to localhost) the host/IP address to listen on, or send to
  loggerHost?: string;
}

export interface RecordingAppender {
  type: 'recording';
}

export interface StandardErrorAppender {
  type: 'stderr';
  // (defaults to ColoredLayout)
  layout?: Layout;
}

export interface StandardOutputAppender {
  type: 'stdout';
  // (defaults to ColoredLayout)
  layout?: Layout;
}

/**
 * TCP Appender
 *
 * @see https://log4js-node.github.io/log4js-node/tcp.html
 */
export interface TCPAppender {
  type: 'tcp';
  // (defaults to 5000)
  port?: number;
  // (defaults to localhost)
  host?: string;
  // (defaults to __LOG4JS__)
  endMsg?: string;
  // (defaults to a serialized log event)
  layout?: Layout;
}

export interface CustomAppender {
  type: string | AppenderModule;
  [key: string]: any;
}

/**
 * Mapping of all Appenders to allow for declaration merging
 * @example
 * declare module 'log4js' {
 *   interface Appenders {
 *     StorageTestAppender: {
 *       type: 'storageTest';
 *       storageMedium: 'dvd' | 'usb' | 'hdd';
 *     };
 *   }
 * }
 */
export interface Appenders {
  CategoryFilterAppender: CategoryFilterAppender;
  ConsoleAppender: ConsoleAppender;
  FileAppender: FileAppender;
  SyncfileAppender: SyncfileAppender;
  DateFileAppender: DateFileAppender;
  LogLevelFilterAppender: LogLevelFilterAppender;
  NoLogFilterAppender: NoLogFilterAppender;
  MultiFileAppender: MultiFileAppender;
  MultiprocessAppender: MultiprocessAppender;
  RecordingAppender: RecordingAppender;
  StandardErrorAppender: StandardErrorAppender;
  StandardOutputAppender: StandardOutputAppender;
  TCPAppender: TCPAppender;
  CustomAppender: CustomAppender;
}

export interface AppenderModule {
  configure: (
    config?: Config,
    layouts?: LayoutsParam,
    findAppender?: () => AppenderFunction,
    levels?: Levels
  ) => AppenderFunction;
}

export type AppenderFunction = (loggingEvent: LoggingEvent) => void;

// TODO: Actually add types here...
// It's supposed to be the full config element
export type Config = any;

export interface LayoutsParam {
  basicLayout: LayoutFunction;
  messagePassThroughLayout: LayoutFunction;
  patternLayout: LayoutFunction;
  colouredLayout: LayoutFunction;
  coloredLayout: LayoutFunction;
  dummyLayout: LayoutFunction;
  addLayout: (name: string, serializerGenerator: LayoutFunction) => void;
  layout: (name: string, config: PatternToken) => LayoutFunction;
}

export interface PatternToken {
  pattern: string; // TODO type this to enforce good pattern...
  tokens: { [tokenName: string]: () => any };
}

export type LayoutFunction = (loggingEvent: LoggingEvent) => string;

export type Appender = Appenders[keyof Appenders];

export interface Levels {
  ALL: Level;
  MARK: Level;
  TRACE: Level;
  DEBUG: Level;
  INFO: Level;
  WARN: Level;
  ERROR: Level;
  FATAL: Level;
  OFF: Level;
  levels: Level[];
  getLevel(level: Level | string, defaultLevel?: Level): Level;
  addLevels(customLevels: object): void;
}

export interface Configuration {
  appenders: { [name: string]: Appender };
  categories: {
    [name: string]: {
      appenders: string[];
      level: string;
      enableCallStack?: boolean;
    };
  };
  pm2?: boolean;
  pm2InstanceVar?: string;
  levels?: Levels;
  disableClustering?: boolean;
}

export interface Recording {
  configure(): AppenderFunction;
  replay(): LoggingEvent[];
  playback(): LoggingEvent[];
  reset(): void;
  erase(): void;
}

export interface Logger {
  new (name: string): Logger;

  readonly category: string;
  level: Level | string;

  log(level: Level | string, ...args: any[]): void;

  isLevelEnabled(level?: string): boolean;

  isTraceEnabled(): boolean;
  isDebugEnabled(): boolean;
  isInfoEnabled(): boolean;
  isWarnEnabled(): boolean;
  isErrorEnabled(): boolean;
  isFatalEnabled(): boolean;

  _log(level: Level, data: any): void;

  addContext(key: string, value: any): void;

  removeContext(key: string): void;

  clearContext(): void;

  setParseCallStackFunction(parseFunction: Function): void;

  trace(message: any, ...args: any[]): void;

  debug(message: any, ...args: any[]): void;

  info(message: any, ...args: any[]): void;

  warn(message: any, ...args: any[]): void;

  error(message: any, ...args: any[]): void;

  fatal(message: any, ...args: any[]): void;

  mark(message: any, ...args: any[]): void;
}
