const log4js = require('../lib/log4js');

log4js.configure({
  "appenders": {
    "console-appender": {
      "type": "console",
      "layout": {
        "type": "pattern",
        "pattern": "%[[%p]%] - %10.-100f{2} | %7.12l:%7.12o - %[%m%]"
      }
    }
  },
  "categories": {
    "default": {
      "appenders": ["console-appender"],
      "enableCallStack": true,
      "level": "info"
    }
  }
})

log4js.getLogger().info('This should not cause problems');
