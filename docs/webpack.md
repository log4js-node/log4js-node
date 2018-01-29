# Working with webpack 

Log4js uses dynamic require for loading appenders. Webpack doesn't know at build time which appender will be used at runtime so a small workaround is necessary.

```
const stdout = require('log4js/lib/appenders/stdout');
import * as Configuration from 'log4js/lib/configuration';

Configuration.prototype.loadAppenderModule = function(type) {
	return stdout;
};
```

