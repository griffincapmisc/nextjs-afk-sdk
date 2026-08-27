/**
 * Structured logging utilities for agent-afk API routes.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, context: string, message: string, data?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] [${context}] ${message}`;
  return data ? `${base} ${JSON.stringify(data)}` : base;
}

export function logInfo(context: string, message: string, data?: Record<string, unknown>): void {
  console.log(formatMessage('info', context, message, data));
}

export function logWarn(context: string, message: string, data?: Record<string, unknown>): void {
  console.warn(formatMessage('warn', context, message, data));
}

export function logError(context: string, message: string, data?: Record<string, unknown>): void {
  console.error(formatMessage('error', context, message, data));
}

export function logDebug(context: string, message: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(formatMessage('debug', context, message, data));
  }
}

/** Create a logger scoped to a session/request ID. */
export function createSessionLogger(sessionId: string) {
  const ctx = `session:${sessionId}`;
  return {
    info: (msg: string, data?: Record<string, unknown>) => logInfo(ctx, msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => logWarn(ctx, msg, data),
    error: (msg: string, data?: Record<string, unknown>) => logError(ctx, msg, data),
    debug: (msg: string, data?: Record<string, unknown>) => logDebug(ctx, msg, data),
  };
}
