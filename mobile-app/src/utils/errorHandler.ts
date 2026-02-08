/**
 * Error Handler Utility
 *
 * Provides comprehensive error handling for different error types.
 * Maps errors to user-friendly messages.
 */

// ============================================================================
// TYPES
// ============================================================================

export enum ErrorType {
  NetworkError = 'NETWORK_ERROR',
  TimeoutError = 'TIMEOUT_ERROR',
  ValidationError = 'VALIDATION_ERROR',
  ServerError = 'SERVER_ERROR',
  NotFoundError = 'NOT_FOUND_ERROR',
  UnauthorizedError = 'UNAUTHORIZED_ERROR',
  ForbiddenError = 'FORBIDDEN_ERROR',
  ConflictError = 'CONFLICT_ERROR',
  TooManyRequestsError = 'TOO_MANY_REQUESTS_ERROR',
  InternalServerError = 'INTERNAL_SERVER_ERROR',
  ServiceUnavailableError = 'SERVICE_UNAVAILABLE_ERROR',
  BadGatewayError = 'BAD_GATEWAY_ERROR',
  OfflineError = 'OFFLINE_ERROR',
  UnknownError = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode?: number;
  originalError?: Error;
  shouldRetry: boolean;
  timestamp: string;
}

// ============================================================================
// ERROR FACTORY
// ============================================================================

/**
 * Create an AppError from various error sources
 */
export const createAppError = (
  error: any,
  context?: string
): AppError => {
  const timestamp = new Date().toISOString();

  // Handle axios error
  if (error.response) {
    return handleHttpError(error, timestamp);
  }

  // Handle timeout error
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      type: ErrorType.TimeoutError,
      message: `Request timeout after ${error.timeout || 30}s`,
      userMessage: 'The request took too long. Please check your internet connection and try again.',
      statusCode: 0,
      originalError: error,
      shouldRetry: true,
      timestamp,
    };
  }

  // Handle network error
  if (error.code === 'ENOTFOUND' || error.message?.includes('Network Error')) {
    return {
      type: ErrorType.NetworkError,
      message: error.message || 'Network connection failed',
      userMessage: 'Unable to connect to the server. Please check your internet connection.',
      statusCode: 0,
      originalError: error,
      shouldRetry: true,
      timestamp,
    };
  }

  // Handle validation error
  if (error.type === 'VALIDATION_ERROR' || error.code === 'VALIDATION_ERROR') {
    return {
      type: ErrorType.ValidationError,
      message: error.message || 'Validation failed',
      userMessage: error.userMessage || 'Please check your input and try again.',
      statusCode: 400,
      originalError: error,
      shouldRetry: false,
      timestamp,
    };
  }

  // Handle offline error
  if (error.type === 'OFFLINE_ERROR') {
    return {
      type: ErrorType.OfflineError,
      message: 'Device is offline',
      userMessage: 'You appear to be offline. Please check your internet connection.',
      statusCode: 0,
      originalError: error,
      shouldRetry: true,
      timestamp,
    };
  }

  // Unknown error
  return {
    type: ErrorType.UnknownError,
    message: error.message || 'An unexpected error occurred',
    userMessage: 'An unexpected error occurred. Please try again later.',
    statusCode: 0,
    originalError: error,
    shouldRetry: false,
    timestamp,
  };
};

/**
 * Handle HTTP error responses
 */
const handleHttpError = (error: any, timestamp: string): AppError => {
  const status = error.response?.status;
  const data = error.response?.data;

  switch (status) {
    case 400:
      return {
        type: ErrorType.ValidationError,
        message: data?.error || 'Bad request',
        userMessage:
          data?.message ||
          'The information you provided is incomplete or invalid. Please review and try again.',
        statusCode: status,
        originalError: error,
        shouldRetry: false,
        timestamp,
      };

    case 401:
      return {
        type: ErrorType.UnauthorizedError,
        message: 'Unauthorized',
        userMessage: 'Your session has expired. Please log in again.',
        statusCode: status,
        originalError: error,
        shouldRetry: false,
        timestamp,
      };

    case 403:
      return {
        type: ErrorType.ForbiddenError,
        message: 'Forbidden',
        userMessage: 'You do not have permission to perform this action.',
        statusCode: status,
        originalError: error,
        shouldRetry: false,
        timestamp,
      };

    case 404:
      return {
        type: ErrorType.NotFoundError,
        message: 'Resource not found',
        userMessage: 'The requested resource could not be found.',
        statusCode: status,
        originalError: error,
        shouldRetry: false,
        timestamp,
      };

    case 409:
      return {
        type: ErrorType.ConflictError,
        message: 'Conflict',
        userMessage: 'This resource already exists or there is a conflict. Please try again.',
        statusCode: status,
        originalError: error,
        shouldRetry: false,
        timestamp,
      };

    case 429:
      return {
        type: ErrorType.TooManyRequestsError,
        message: 'Too many requests',
        userMessage:
          'You have made too many requests. Please wait a moment and try again.',
        statusCode: status,
        originalError: error,
        shouldRetry: true,
        timestamp,
      };

    case 500:
      return {
        type: ErrorType.InternalServerError,
        message: 'Internal server error',
        userMessage:
          'The server encountered an error. Our team has been notified. Please try again later.',
        statusCode: status,
        originalError: error,
        shouldRetry: true,
        timestamp,
      };

    case 502:
      return {
        type: ErrorType.BadGatewayError,
        message: 'Bad gateway',
        userMessage: 'The server is temporarily unavailable. Please try again later.',
        statusCode: status,
        originalError: error,
        shouldRetry: true,
        timestamp,
      };

    case 503:
      return {
        type: ErrorType.ServiceUnavailableError,
        message: 'Service unavailable',
        userMessage: 'The service is currently unavailable. Please try again later.',
        statusCode: status,
        originalError: error,
        shouldRetry: true,
        timestamp,
      };

    default:
      return {
        type: ErrorType.ServerError,
        message: `Server error: ${status}`,
        userMessage: 'An error occurred on the server. Please try again later.',
        statusCode: status,
        originalError: error,
        shouldRetry: true,
        timestamp,
      };
  }
};

// ============================================================================
// ERROR PREDICATES
// ============================================================================

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: AppError): boolean => {
  return error.shouldRetry;
};

/**
 * Check if error is due to offline status
 */
export const isOfflineError = (error: AppError): boolean => {
  return error.type === ErrorType.OfflineError || error.type === ErrorType.NetworkError;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: AppError): boolean => {
  return error.type === ErrorType.ValidationError;
};

/**
 * Check if error is a timeout
 */
export const isTimeoutError = (error: AppError): boolean => {
  return error.type === ErrorType.TimeoutError;
};

/**
 * Check if error is a server error
 */
export const isServerError = (error: AppError): boolean => {
  return [
    ErrorType.InternalServerError,
    ErrorType.ServiceUnavailableError,
    ErrorType.BadGatewayError,
  ].includes(error.type);
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Get user-friendly error message
 */
export const getUserErrorMessage = (error: AppError): string => {
  return error.userMessage;
};

/**
 * Get technical error message (for debugging)
 */
export const getTechnicalErrorMessage = (error: AppError): string => {
  return error.message;
};

/**
 * Get error details for logging
 */
export const getErrorDetails = (error: AppError): string => {
  return `[${error.type}] ${error.message} (Status: ${error.statusCode || 'N/A'})`;
};
