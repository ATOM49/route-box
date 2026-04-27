type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export interface Logger {
  debug(msg: string, data?: unknown): void;
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
}

export function createLogger(name: string, level: LogLevel = "info"): Logger {
  const minLevel = levels[level];

  function log(logLevel: LogLevel, msg: string, data?: unknown) {
    if (levels[logLevel] < minLevel) return;
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level: logLevel,
      name,
      msg,
    };
    if (data !== undefined) entry["data"] = data;
    process.stdout.write(JSON.stringify(entry) + "\n");
  }

  return {
    debug: (msg, data) => log("debug", msg, data),
    info: (msg, data) => log("info", msg, data),
    warn: (msg, data) => log("warn", msg, data),
    error: (msg, data) => log("error", msg, data),
  };
}
