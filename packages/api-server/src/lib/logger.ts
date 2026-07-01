/* eslint-disable @typescript-eslint/no-explicit-any */
type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

const LOG_LEVELS: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

const currentLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) ?? "info"];

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

function formatMessage(level: LogLevel, ...args: any[]) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
  if (args.length === 0) return prefix;
  const parts = args.map((a) => {
    if (typeof a === "object" && a !== null) {
      try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
  });
  return `${prefix} ${parts.join(" ")}`;
}

type LogFn = (msg: string | Record<string, any>, ...args: any[]) => void;

function makeLogger(level: LogLevel): LogFn {
  return (...args: any[]) => {
    if (!shouldLog(level)) return;
    const fn = level === "fatal" || level === "error" ? console.error
      : level === "warn" ? console.warn
      : level === "info" ? console.info
      : level === "debug" ? console.debug
      : console.trace;
    fn(formatMessage(level, ...args));
  };
}

export const logger = {
  fatal: makeLogger("fatal"),
  error: makeLogger("error"),
  warn: makeLogger("warn"),
  info: makeLogger("info"),
  debug: makeLogger("debug"),
  trace: makeLogger("trace"),
};