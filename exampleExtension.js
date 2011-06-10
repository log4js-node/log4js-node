/**
 * @version 1.0
 * @author Yury Proshchenko <spect.man@gmail.com>
 * @since 2011-05-24
 * @static
 */

// Every module will be loaded on require('log4js')() function call.
// Initialized log4js module will be psssed as an argument of
// our export function
module.exports = function(log4js) {

    /**
     * Example appender do nothing but adding hello message
     * to the end of loggingEvent and pitting result to console
     * 
     * @param options - pass some options to appender
     * @param layout a function that takes a logevent and returns a string (defaults to basicLayout).
     *
     * @example
     * var log4js = require(log4js)();
     * log4js.addAppender(log4js.exampleAppender(options));
     */
	this.exampleAppender = function (useSiffix, suffix, layout) {
		layout = layout || log4js.basicLayout;	

		var suffix = suffix || '\nPS: Hello from newborn appender :)'

		return function(loggingEvent) {
			console.log(layout(loggingEvent) + useSiffix ? suffix : '');
		};
	}

	/**
	 * Allow this appender to be configured using config file
     *
	 * @description
	 * log4js will find out appender congig by field "type" with
	 * value of example (key in log4js.appenderMakers hash array.
	 * 
	 * Whole object from appenders collection will be passed as an
	 * options argument to example appender.
     *
	 * @example
	 * {
	 *   "appenders": [
	 *     {
	 *       "type": "console" 
	 *     }, {
	 *       "type": "example",
	 *       "add suffix": true,
	 *       "suffix": "Kowabunga!"
	 *     }
	 *   ]
	 * }
	 */
	log4js.appenderMakers.example = function(config) {
		var layout;
		if (config.layout)
			layout = layoutMakers[config.layout.type](config.layout);

		return log4js.smtpAppender(config, layout);
    };

	return this;
}

