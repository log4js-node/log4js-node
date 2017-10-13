/**
 * log4js typescript definition for version 2.3.4
 * @name log4js-node
 * @author xialeistudio<xialeistudio@gmail.com>
 * @date 2017/9/26
 * @version 0.0.1
 */
export declare function getLogger(category?: string): Logger;

export declare function configure(configuration: Configuration): void;

export declare function levels(): Levels;

export declare interface Configuration {
  levels?: Levels;
  appenders: { [index: string]: any };
  categories: { [index: string]: { appenders: string[], level: string } };
  pm2?: boolean;
  pm2InstanceVar?: string;
  disableClustering?: boolean;
}

export declare interface Levels {
  [index: string]: {
    value: number;
    colour: string;
  }
}

export declare interface Logger {
  new(dispatch: Function, name: string): Logger;

  level: string;

  log(...args: any[]): void;

  isLevelEnabled(level: string): boolean;

  _log(level: string, data: any): void;

  addContext(key: string, value: any): void;

  removeContext(key: string): void;

  clearContext(): void;

  trace(...args: any[]): void;

  debug(...args: any[]): void;

  info(...args: any[]): void;

  warn(...args: any[]): void;

  error(...args: any[]): void;

  fatal(...args: any[]): void;
}
