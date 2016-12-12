'use strict';

module.exports.ISO8601_FORMAT = 'yyyy-MM-dd hh:mm:ss.SSS';
module.exports.ISO8601_WITH_TZ_OFFSET_FORMAT = 'yyyy-MM-ddThh:mm:ss.SSSO';
module.exports.DATETIME_FORMAT = 'dd MM yyyy hh:mm:ss.SSS';
module.exports.ABSOLUTETIME_FORMAT = 'hh:mm:ss.SSS';

function padWithZeros(vNumber, width) {
  let numAsString = vNumber.toString();
  while (numAsString.length < width) {
    numAsString = `0${numAsString}`;
  }
  return numAsString;
}

function addZero(vNumber) {
  return padWithZeros(vNumber, 2);
}

/**
 * Formats the TimeOffset
 * Thanks to http://www.svendtofte.com/code/date_format/
 * @private
 */
function offset(timezoneOffset) {
  // Difference to Greenwich time (GMT) in hours
  const os = Math.abs(timezoneOffset);
  let h = String(Math.floor(os / 60));
  let m = String(os % 60);
  if (h.length === 1) {
    h = `0${h}`;
  }
  if (m.length === 1) {
    m = `0${m}`;
  }
  return timezoneOffset < 0 ? `+${h}${m}` : `-${h}${m}`;
}

module.exports.asString = function (format, date, timezoneOffset) {
  if (typeof(format) !== 'string') {
    timezoneOffset = date;
    date = format;
    format = module.exports.ISO8601_FORMAT;
  }
  // make the date independent of the system timezone by working with UTC
  if (timezoneOffset === undefined) {
    timezoneOffset = date.getTimezoneOffset();
  }

  date.setUTCMinutes(date.getUTCMinutes() - timezoneOffset);
  const vDay = addZero(date.getUTCDate());
  const vMonth = addZero(date.getUTCMonth() + 1);
  const vYearLong = addZero(date.getUTCFullYear());
  const vYearShort = addZero(date.getUTCFullYear().toString().substring(2, 4));
  const vYear = (format.indexOf('yyyy') > -1 ? vYearLong : vYearShort);
  const vHour = addZero(date.getUTCHours());
  const vMinute = addZero(date.getUTCMinutes());
  const vSecond = addZero(date.getUTCSeconds());
  const vMillisecond = padWithZeros(date.getUTCMilliseconds(), 3);
  const vTimeZone = offset(timezoneOffset);
  date.setUTCMinutes(date.getUTCMinutes() + timezoneOffset);
  const formatted = format
    .replace(/dd/g, vDay)
    .replace(/MM/g, vMonth)
    .replace(/y{1,4}/g, vYear)
    .replace(/hh/g, vHour)
    .replace(/mm/g, vMinute)
    .replace(/ss/g, vSecond)
    .replace(/SSS/g, vMillisecond)
    .replace(/O/g, vTimeZone);
  return formatted;
};
