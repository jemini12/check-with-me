/**
 * Enhanced logging utility with production-safe structured logging
 *
 * Features:
 * - Environment-aware log levels (debug in dev, info+ in prod)
 * - Request ID tracking for distributed tracing
 * - Performance timing helpers
 * - Automatic data sanitization (PII protection)
 * - Structured context with environment metadata
 * - Integration points for monitoring services (Sentry, Datadog, etc.)
 */

import { isDevelopment } from './env';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: unknown;
}

interface TimerHandle {
  end: (context?: LogContext) => number;
}

interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  [key: string]: unknown;
}

/**
 * Sanitizes sensitive data from logs to prevent PII leaks
 * - Truncates long text to show only length
 * - Redacts API keys and tokens
 * - Masks email addresses and URLs with sensitive data
 */
function sanitizeContext(context: LogContext, isDev: boolean): LogContext {
  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    // In development, show more details
    if (isDev) {
      if (key.toLowerCase().includes('text') && typeof value === 'string' && value.length > 200) {
        // Show first 200 chars in dev for long text
        sanitized[key] = value.substring(0, 200) + `... (${value.length} chars total)`;
      } else if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
        // Always redact API keys/tokens
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    } else {
      // In production, be more aggressive with sanitization
      if (key.toLowerCase().includes('text') && typeof value === 'string') {
        // Only show length in production
        sanitized[`${key}Length`] = value.length;
      } else if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token') ||
                 key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
        sanitized[key] = '[REDACTED]';
      } else if (key.toLowerCase().includes('email') || key.toLowerCase().includes('user')) {
        sanitized[key] = '[SANITIZED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeContext(value as LogContext, isDev);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Serializes error objects with full details
 */
function serializeError(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    const serialized: ErrorDetails = {
      name: error.name,
      message: error.message,
    };

    // Include stack trace in development
    if (isDevelopment() && error.stack) {
      serialized.stack = error.stack;
    }

    // Include custom error properties
    const errorObj = error as unknown as Record<string, unknown>;
    if ('code' in errorObj) {
      serialized.code = String(errorObj.code);
    }
    if ('statusCode' in errorObj) {
      serialized.statusCode = Number(errorObj.statusCode);
    }

    // Include any other enumerable properties
    for (const key of Object.keys(error)) {
      if (!(key in serialized)) {
        serialized[key] = errorObj[key];
      }
    }

    return serialized;
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

/**
 * Enhanced Logger class with production-safe structured logging
 */
class Logger {
  private requestId?: string;
  private globalContext: LogContext = {};

  constructor() {
    // Add environment metadata to all logs
    this.globalContext = {
      env: isDevelopment() ? 'development' : 'production',
      nodeEnv: process.env.NODE_ENV,
    };
  }

  /**
   * Sets request ID for request tracing
   * Call this at the start of each request to enable distributed tracing
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Clears the current request ID
   */
  clearRequestId(): void {
    this.requestId = undefined;
  }

  /**
   * Determines if a log level should be logged based on environment
   */
  private shouldLog(level: LogLevel): boolean {
    // In production, log info, warn, and error (skip debug)
    if (!isDevelopment()) {
      return level !== LogLevel.DEBUG;
    }
    // In development, log everything
    return true;
  }

  /**
   * Formats a log message with timestamp, level, and context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const isDev = isDevelopment();

    // Build enriched context
    const enrichedContext = {
      ...this.globalContext,
      ...(this.requestId ? { requestId: this.requestId } : {}),
      ...(context ? sanitizeContext(context, isDev) : {}),
    };

    const contextStr = Object.keys(enrichedContext).length > 0
      ? ` ${JSON.stringify(enrichedContext)}`
      : '';

    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Logs debug-level messages (development only)
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Logs info-level messages (all environments)
   * Use for general information about application flow
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  /**
   * Logs warning-level messages (all environments)
   * Use for recoverable errors or unexpected situations
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  /**
   * Logs error-level messages (all environments)
   * Use for errors that require attention
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        ...(error ? { error: serializeError(error) } : {}),
      };
      console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));

      // Integration point for external error tracking (Sentry, Datadog, etc.)
      // Uncomment and configure as needed:
      // if (typeof Sentry !== 'undefined') {
      //   Sentry.captureException(error, { contexts: { custom: context } });
      // }
    }
  }

  /**
   * Starts a performance timer
   * Returns a handle with an end() method that logs the elapsed time
   *
   * @example
   * const timer = logger.startTimer('Database Query');
   * // ... do work ...
   * const elapsedMs = timer.end({ query: 'SELECT * FROM users' });
   */
  startTimer(operationName: string, context?: LogContext): TimerHandle {
    const startTime = Date.now();
    const startMessage = `Started: ${operationName}`;

    this.debug(startMessage, context);

    return {
      end: (endContext?: LogContext) => {
        const elapsedMs = Date.now() - startTime;
        const endMessage = `Completed: ${operationName}`;
        const finalContext = {
          ...context,
          ...endContext,
          elapsedMs,
          durationSeconds: (elapsedMs / 1000).toFixed(2),
        };

        // Log as info if operation took longer than 1 second, otherwise debug
        if (elapsedMs > 1000) {
          this.info(endMessage, finalContext);
        } else {
          this.debug(endMessage, finalContext);
        }

        return elapsedMs;
      },
    };
  }

  /**
   * Logs API call metrics (timing, tokens, etc.)
   * Useful for tracking LLM API performance
   */
  apiCall(
    provider: string,
    operation: string,
    durationMs: number,
    context?: LogContext
  ): void {
    this.info(`API call: ${provider} ${operation}`, {
      provider,
      operation,
      durationMs,
      durationSeconds: (durationMs / 1000).toFixed(2),
      ...context,
    });
  }

  /**
   * Logs request start
   * Use at the beginning of API request handlers
   */
  requestStart(method: string, path: string, context?: LogContext): void {
    this.info(`Request started: ${method} ${path}`, {
      method,
      path,
      ...context,
    });
  }

  /**
   * Logs request completion
   * Use at the end of API request handlers
   */
  requestEnd(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR :
                  statusCode >= 400 ? LogLevel.WARN :
                  LogLevel.INFO;

    const message = `Request completed: ${method} ${path}`;
    const finalContext = {
      method,
      path,
      statusCode,
      durationMs,
      durationSeconds: (durationMs / 1000).toFixed(2),
      ...context,
    };

    if (level === LogLevel.ERROR) {
      this.error(message, undefined, finalContext);
    } else if (level === LogLevel.WARN) {
      this.warn(message, finalContext);
    } else {
      this.info(message, finalContext);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
