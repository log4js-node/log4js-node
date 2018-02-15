// Type definitions for log4js

export interface Log4js {
	getLogger,
	configure,
	addLayout,
	connectLogger,
	levels,
	shutdown
}

export function getLogger(category?: string): Logger;

export function configure(filename: string): Log4js;
export function configure(config: Configuration): Log4js;

export function addLayout(name: string, config: (a: any) => (logEvent: LoggingEvent) => string): void;

export function connectLogger(logger: Logger, options: { format?: string; level?: string; nolog?: any; }): any;	// express.Handler;

export function levels(): Levels;

export function shutdown(cb?: (error: Error) => void): void | null;

export interface BaseLayout {
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
}

export interface LoggingEvent {
	categoryName: string;	// name of category
	level: Level;	// level of message
	data: any[];	// objects to log
	startTime: Date;
	pid: number;
	context: any;
	cluster?: {
		workerId: number;
		worker: number;
	};
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

export type Layout = BaseLayout | ColoredLayout | MessagePassThroughLayout | DummyLayout | PatternLayout | CustomLayout;

/**
 * Category Filter
 *
 * @see https://log4js-node.github.io/log4js-node/categoryFilter.html
 */
export interface CategoryFilterAppender {
	type: "categoryFilter";
	// the category (or categories if you provide an array of values) that will be excluded from the appender.
	exclude?: string | string[];
	// the name of the appender to filter. see https://log4js-node.github.io/log4js-node/layouts.html
	appender?: string;
}

/**
 * Console Appender
 *
 * @see https://log4js-node.github.io/log4js-node/console.html
 */
export interface ConsoleAppender {
	type: 'console';
	// defaults to colouredLayout
	layout?: Layout;
}

export interface FileAppender {
	type: 'file';
	// the path of the file where you want your logs written.
	filename: string;
	// the maximum size (in bytes) for the log file. If not specified, then no log rolling will happen.
	maxLogSize?: number;
	// (default value = 5) - the number of old log files to keep during log rolling.
	backups?: number;
	// defaults to basic layout
	layout?: Layout;
	numBackups?: number;
	compress?: boolean; // compress the backups
  // keep the file extension when rotating logs
  keepFileExt?: boolean;
	encoding?: string;
	mode?: number;
	flags?: string;
}

export interface SyncfileAppender {
	type: 'fileSync';
	// the path of the file where you want your logs written.
	filename: string;
	// the maximum size (in bytes) for the log file. If not specified, then no log rolling will happen.
	maxLogSize?: number;
	// (default value = 5) - the number of old log files to keep during log rolling.
	backups?: number;
	// defaults to basic layout
	layout?: Layout;
}

export interface DateFileAppender {
	type: 'dateFile';
	// the path of the file where you want your logs written.
	filename: string;
	// defaults to basic layout
	layout?: Layout;
	// defaults to .yyyy-MM-dd - the pattern to use to determine when to roll the logs.
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
	// default “utf-8”
	encoding?: string;
	// default 0644
	mode?: number;
	// default ‘a’
	flags?: string;
	// compress the backup files during rolling (backup files will have .gz extension)(default false)
	compress?: boolean;
	// include the pattern in the name of the current log file as well as the backups.(default false)
	alwaysIncludePattern?: boolean;
  // keep the file extension when rotating logs
  keepFileExt?: boolean;
	// if this value is greater than zero, then files older than that many days will be deleted during log rolling.(default 0)
	daysToKeep?: number;
}

export interface GELFAppender {
	'type': 'gelf';
	// (defaults to localhost) - the gelf server hostname
	host?: string;
	// (defaults to 12201) - the port the gelf server is listening on
	port?: number;
	// (defaults to OS.hostname()) - the hostname used to identify the origin of the log messages.
	hostname?: string;
	facility?: string;
	// fields to be added to each log message; custom fields must start with an underscore.
	customFields?: { [field: string]: any };
}

export interface HipchatAppender {
	type: 'hipchat';
	// User token with notification privileges
	hipchat_token: string;
	// Room ID or name
	hipchat_room: string;
	// (defaults to empty string) - a label to say where the message is from
	hipchat_from?: string;
	// (defaults to false) - make hipchat annoy people
	hipchat_notify?: boolean;
	// (defaults to api.hipchat.com) - set this if you have your own hipchat server
	hipchat_host?: string;
	// (defaults to only throwing errors) - implement this function if you want intercept the responses from hipchat
	hipchat_response_callback?(err: Error, response: any): any;
	// (defaults to messagePassThroughLayout)
	layout?: Layout;
}

export interface LogFacesHTTPAppender {
	type: 'logFaces-HTTP';
	// logFaces receiver servlet URL
	url: string;
	// (defaults to empty string) - used to identify your application’s logs
	application?: string;
	// (defaults to 5000ms) - the timeout for the HTTP request.
	timeout?: number;
}

export interface LogFacesUDPAppender {
	type: 'logFaces-UDP';
	// (defaults to ‘127.0.0.1’)- hostname or IP address of the logFaces receiver
	remoteHost?: string;
	// (defaults to 55201) - port the logFaces receiver is listening on
	port?: number;
	// (defaults to empty string) - used to identify your application’s logs
	application?: string;
}

export interface LogglyAppender {
	type: 'loggly';
	// your really long input token
	token: string;
	// your subdomain
	subdomain: string;
	// tags to include in every log message
	tags?: string[];
}

export interface LogLevelFilterAppender {
	type: 'logLevelFilter';
	// the name of an appender, defined in the same configuration, that you want to filter
	appender: string;
	// the minimum level of event to allow through the filter
	level: string;
	// (defaults to FATAL) - the maximum level of event to allow through the filter
	maxLevel?: string;
}

export interface LogstashUDPAppender {
	type: 'logstashUDP';
	// hostname (or IP-address) of the logstash server
	host: string;
	// port of the logstash server
	port: number;
	// used for the type field in the logstash data
	logType?: string;
	// used for the type field of the logstash data if logType is not defined
	category?: string;
	// extra fields to log with each event
	fields?: { [fieldname: string]: any };
	// (defaults to dummyLayout) used for the message field of the logstash data
	layout?: Layout;
}

export interface MailgunAppender {
	type: 'mailgun';
	// your mailgun API key
	apiKey: string;
	// your domain
	domain: string;
	from: string;
	to: string;
	subject: string;
	// (defaults to basicLayout)
	layout?: Layout;
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
	// (only needed if mode == master)- the name of the appender to send the log events to
	appender?: string;
	// (defaults to 5000) - the port to listen on, or send to
	loggerPort?: number;
	// (defaults to localhost) - the host/IP address to listen on, or send to
	loggerHost?: string;
}

export interface RedisAppender {
	type: 'redis';
	// (defaults to 127.0.0.1) - the location of the redis server
	host?: string;
	// (defaults to 6379) - the port the redis server is listening on
	port?: number;
	// password to use when authenticating connection to redis
	pass?: string;
	// the redis channel that log events will be published to
	channel: string;
	// (defaults to messagePassThroughLayout) - the layout to use for log events.
	layout?: Layout;
}

export interface SlackAppender {
	type: 'slack';
	// your Slack API token (see the slack and slack-node docs)
	token: string;
	// the channel to send log messages
	channel_id: string;
	// the icon to use for the message
	icon_url?: string;
	// the username to display with the message
	username: string;
	// (defaults to basicLayout) - the layout to use for the message.
	layout?: Layout;
}

export interface RecordingAppender {
	type: 'recording';
}

export interface SmtpAppender {
	type: 'smtp';
	// (if not present will use transport field)
	SMTP?: {
		// (defaults to localhost)
		host?: string;
		// (defaults to 25)
		port?: number;
		// authentication details
		auth?: {
			user: string;
			pass: string;
		};
	};
	// (if not present will use SMTP) - see nodemailer docs for transport options
	transport?: {
		// (defaults to smtp) - the nodemailer transport plugin to use
		plugin?: string;
		// configuration for the transport plugin
		options?: any;
	} | string;
	// send logs as email attachment
	attachment?: {
		// (defaults to false)
		enable?: boolean;
		// (defaults to See logs as attachment) - message to put in body of email
		message: string;
		// (defaults to default.log) - attachment filename
		filename: string;
	};
	// integer(defaults to 0) - batch emails and send in one email every sendInterval seconds, if 0 then every log message will send an email.
	sendInterval?: number;
	// (defaults to 5) - time in seconds to wait for emails to be sent during shutdown
	shutdownTimeout?: number;
	// email addresses to send the logs to
	recipients: string;
	// (defaults to message from first log event in batch) - subject for email
	subject?: string;
	// who the logs should be sent as
	sender?: string;
	// (defaults to false) - send the email as HTML instead of plain text
	html?: boolean;
	// (defaults to basicLayout)
	layout?: Layout;
}

export interface StandardErrorAppender {
	type: 'stderr';
	// (defaults to colouredLayout)
	layout?: Layout;
}

export interface StandardOutputAppender {
	type: 'stdout';
	// (defaults to colouredLayout)
	layout?: Layout;
}

export interface CustomAppender {
	type: string;
	[key: string]: any;
}

export type Appender = CategoryFilterAppender
	| ConsoleAppender
	| FileAppender
	| SyncfileAppender
	| DateFileAppender
	| GELFAppender
	| HipchatAppender
	| LogFacesHTTPAppender
	| LogFacesUDPAppender
	| LogglyAppender
	| LogLevelFilterAppender
	| LogstashUDPAppender
	| MailgunAppender
	| MultiFileAppender
	| MultiprocessAppender
	| RedisAppender
	| SlackAppender
	| RecordingAppender
	| SmtpAppender
	| StandardErrorAppender
	| StandardOutputAppender
	| CustomAppender;

export interface Levels {
	[index: string]: {
		value: number;
		colour: string;
	};
}

export interface Configuration {
	appenders: { [name: string]: Appender; };
	categories: { [name: string]: { appenders: string[]; level: string; } };
	pm2?: boolean;
	pm2InstanceVar?: string;
	levels?: Levels;
	disableClustering?: boolean;
}

export interface Logger {
	new(dispatch: Function, name: string): Logger;

	level: string;

	log(...args: any[]): void;

	isLevelEnabled(level?: string): boolean;

  isTraceEnabled(): boolean;
	isDebugEnabled(): boolean;
	isInfoEnabled(): boolean;
	isWarnEnabled(): boolean;
	isErrorEnabled(): boolean;
	isFatalEnabled(): boolean;

	_log(level: string, data: any): void;

	addContext(key: string, value: any): void;

	removeContext(key: string): void;

	clearContext(): void;

	trace(message: string, ...args: any[]): void;

	debug(message: string, ...args: any[]): void;

	info(message: string, ...args: any[]): void;

	warn(message: string, ...args: any[]): void;

	error(message: string, ...args: any[]): void;

	fatal(message: string, ...args: any[]): void;
}
