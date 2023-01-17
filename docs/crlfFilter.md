# CRLF Filter

This is not strictly an appender - it wraps around another appender and to prevent log forging by replacing starting the line with a `>` prefix after line-breaks.

## Configuration

- `type` - `"crlfFilter"`
- `appender` - `string | Array<String>` - the name of the appender to filter. (exists for backward compatibility)
- `appenders` - `string | Array<String>` - the names of the appenders to filter.

## Example

```javascript
log4js.configure({
  appenders: {
    everything: { type: "file", filename: "all-the-logs.log" },
    crlfFilter: {
      type: "crlfFilter",
      appenders: ["everything"],
    },
  },
  categories: {
    default: { appenders: ["crlfFilter"], level: "debug" },
  },
});

const logger = log4js.getLogger();
logger.info(
  "Some debug messages\n[2023-01-17T11:58:38.150] [INFO] default - Log forging"
);
```

```
[2023-01-17T11:58:38.150] [INFO] default - Some debug messages
> [2023-01-17T11:58:38.150] [INFO] default - Log forging
```
