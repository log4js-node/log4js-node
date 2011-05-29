/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jsl:option explicit*/

/**
 * @version 1.0
 * @author Yury Proshchenko <spect.man@gmail.com>
 * @since 2011-05-24
 * @static
 */

var nodemailer = require('nodemailer');

module.exports = function(log4js) {
	/**
	 * SMTP Appender writing the logs to a smtp server file. 
	 * 
	 * @param smtp SMTP server settings (host, port, ssl, credentials, etc...)
	 * @param mail Mail template (sender, subject, etc)
	 * @param layout a function that takes a logevent and returns a string (defaults to basicLayout).
	 */
	this.smtpAppender = log4js.smtpAppender = function (smtp, mail, layout) {
		layout = layout || log4js.basicLayout;	


		//nodemailer.SMTP = smtp;
		// or nodemailer.sendmail = true;
		// or nodemailer.sendmail = "/path/to/sendmail";
		var mail = new nodemailer.EmailMessage({
			server: smtp,
			sender: mail.sender || smtp.user, 
			to: mail.recipients.join(', ')
		});

		return function(loggingEvent) {
			mail.subject = 'WHOISWITH.ME ' + loggingEvent.level.toString() + ' ' + loggingEvent.categoryName;
			mail.body = layout(loggingEvent);
			mail.send();
		};
	}
	/**
	 * Allow smtp appender to be configured using log4js.json config file
	 *
	 * @example
	 * {
	 *   "appenders": [
	 *     {
	 *       "type": "smtp",
	 *       "smtp": {
	 *       	"host": "smtp.gmail.com",
	 *       	"port": "465",
	 *       	"ssl": "true",
	 *       	"use_authentication": "true",
	 *       	"user": "username@gmail.com",
	 *       	"pass": "very very very strong password"
	 *       },
	 *       "mail": {
	 *       	"sender": "log4js mailer <username@gmail.com>",
	 *       	"recipients": [
	 *       		"log4js log archive <archive@gmail.com>",
	 *       		"admin <your.username@example.com>"
	 *       	]
	 *       }
	 *     }
	 *   ]
	 * }
	 */
	log4js.appenderMakers.smtp = function(config) {
		var layout;
		if (config.layout)
			layout = layoutMakers[config.layout.type](config.layout);

		return log4js.smtpAppender(config.smtp, config.mail, layout);
    };

	return this;
}

