/**
 * Custom error types for better error handling and debugging
 */

/**
 * Base error class for application-specific errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when environment configuration is invalid
 */
export class ConfigurationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
  }
}

/**
 * Error thrown when external API calls fail
 */
export class ExternalAPIError extends AppError {
  constructor(
    message: string,
    public readonly service: string,
    details?: unknown
  ) {
    super(message, 'EXTERNAL_API_ERROR', 502, details);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error thrown when parsing or processing data fails
 */
export class ProcessingError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'PROCESSING_ERROR', 500, details);
  }
}

/**
 * Error thrown when web search fails
 */
export class SearchError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'SEARCH_ERROR', 503, details);
  }
}

/**
 * Error thrown when OpenAI API fails
 */
export class APIError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'API_ERROR', 502, details);
  }
}

/**
 * Error thrown when requests timeout
 */
export class TimeoutError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'TIMEOUT_ERROR', 504, details);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Converts any error to an AppError for consistent handling
 */
export function toAppError(error: unknown, fallbackMessage: string): AppError {
  if (isAppError(error)) {
    return error;
  }

  return new AppError(
    getErrorMessage(error) || fallbackMessage,
    'UNKNOWN_ERROR',
    500,
    error
  );
}
