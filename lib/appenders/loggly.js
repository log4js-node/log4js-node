/* eslint no-prototype-builtins:1,no-restricted-syntax:[1, "ForInStatement"] */

'use strict';

const layouts = require('../layouts');
const loggly = require('loggly');
const os = require('os');

const passThrough = layouts.messagePassThroughLayout;

let openRequests = 0;
let shutdownCB;

function isAnyObject(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function numKeys(obj) {
  let res = 0;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      res++; // eslint-disable-line no-plusplus
    }
  }
  return res;
}

/**
 * @param msgListArgs
 * @returns Object{ deTaggedMsg: [...], additionalTags: [...] }
 */
function processTags(msgListArgs) {
  const msgList = (msgListArgs.length === 1 ? [msgListArgs[0]] : msgListArgs);

  return msgList.reduce((accumulate, element) => {
    if (isAnyObject(element) && Array.isArray(element.tags) && numKeys(element) === 1) {
      accumulate.additionalTags = accumulate.additionalTags.concat(element.tags);
    } else {
      accumulate.deTaggedData.push(element);
    }
    return accumulate;
  }, { deTaggedData: [], additionalTags: [] });
}

/**
 * Loggly Appender. Sends logging events to Loggly using node-loggly, optionally adding tags.
 *
 * This appender will scan the msg from the logging event, and pull out any argument of the
 * shape `{ tags: [] }` so that it's possible to add tags in a normal logging call.
 *
 * For example:
 *
 * logger.info({ tags: ['my-tag-1', 'my-tag-2'] }, 'Some message', someObj, ...)
 *
 * And then this appender will remove the tags param and append it to the config.tags.
 *
 * @param config object with loggly configuration data
 * {
 *   token: 'your-really-long-input-token',
 *   subdomain: 'your-subdomain',
 *   tags: ['loggly-tag1', 'loggly-tag2', .., 'loggly-tagn']
 * }
 * @param layout a function that takes a logevent and returns a string (defaults to objectLayout).
 */
function logglyAppender(config, layout) {
  const client = loggly.createClient(config);
  if (!layout) layout = passThrough;

  return (loggingEvent) => {
    const result = processTags(loggingEvent.data);
    const deTaggedData = result.deTaggedData;
    const additionalTags = result.additionalTags;

    // Replace the data property with the deTaggedData
    loggingEvent.data = deTaggedData;

    const msg = layout(loggingEvent);

    openRequests += 1;

    client.log({
      msg: msg,
      level: loggingEvent.level.levelStr,
      category: loggingEvent.categoryName,
      hostname: os.hostname().toString(),
    }, additionalTags, (error) => {
      if (error) {
        console.error('log4js.logglyAppender - error occurred: ', error);
      }

      openRequests -= 1;

      if (shutdownCB && openRequests === 0) {
        shutdownCB();

        shutdownCB = undefined;
      }
    });
  };
}

function configure(config) {
  let layout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return logglyAppender(config, layout);
}

function shutdown(cb) {
  if (openRequests === 0) {
    cb();
  } else {
    shutdownCB = cb;
  }
}

module.exports.name = 'loggly';
module.exports.appender = logglyAppender;
module.exports.configure = configure;
module.exports.shutdown = shutdown;
