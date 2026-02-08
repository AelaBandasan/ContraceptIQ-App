/**
 * Error Message Mapper
 * 
 * Maps technical error types and codes to user-friendly messages
 * and appropriate UI actions for the mobile app.
 */

import { AppError } from './errorHandler';

export interface ErrorDisplay {
  title: string;
  message: string;
  userAction?: string;
  icon: 'warning' | 'error' | 'info' | 'offline';
  severity: 'critical' | 'warning' | 'info';
  actionLabel?: string;
  actionType?: 'retry' | 'settings' | 'dismiss';
  showDetails?: boolean;
}

/**
 * Map AppError to user-friendly display message
 * 
 * @param error - AppError object or string
 * @returns ErrorDisplay with user-friendly content
 */
export function getErrorDisplay(error: AppError | string | Error): ErrorDisplay {
  if (typeof error === 'string') {
    return {
      title: 'Error',
      message: error,
      icon: 'error',
      severity: 'warning',
      actionType: 'dismiss'
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message,
      icon: 'error',
      severity: 'warning',
      actionType: 'dismiss'
    };
  }

  // Handle AppError objects
  const appError = error as AppError;

  // Offline errors
  if (appError.type === 'OfflineError') {
    return {
      title: 'No Internet Connection',
      message: appError.userMessage || 'Your device is offline. Please check your internet connection and try again.',
      icon: 'offline',
      severity: 'critical',
      actionLabel: 'Retry',
      actionType: 'retry',
      userAction: 'Please check your WiFi or mobile data connection'
    };
  }

  // Timeout errors
  if (appError.type === 'TimeoutError') {
    return {
      title: 'Request Timeout',
      message: appError.userMessage || 'The request took too long. Please check your connection and try again.',
      icon: 'warning',
      severity: 'warning',
      actionLabel: 'Retry',
      actionType: 'retry',
      userAction: 'This might be due to a slow connection'
    };
  }

  // Network errors
  if (appError.type === 'NetworkError') {
    return {
      title: 'Connection Failed',
      message: appError.userMessage || 'Unable to connect to the assessment service. Please try again.',
      icon: 'error',
      severity: 'warning',
      actionLabel: 'Retry',
      actionType: 'retry',
      userAction: 'Check your internet connection'
    };
  }

  // Validation errors
  if (appError.type === 'ValidationError') {
    return {
      title: 'Invalid Input',
      message: appError.userMessage || 'Please check your answers and ensure all fields are filled correctly.',
      icon: 'warning',
      severity: 'warning',
      actionLabel: 'Review',
      actionType: 'dismiss',
      userAction: 'Some information is missing or invalid'
    };
  }

  // Unauthorized errors
  if (appError.type === 'UnauthorizedError') {
    return {
      title: 'Authentication Required',
      message: appError.userMessage || 'Please log in again to continue.',
      icon: 'warning',
      severity: 'warning',
      actionLabel: 'Login',
      actionType: 'dismiss',
      userAction: 'Your session has expired'
    };
  }

  // Forbidden errors
  if (appError.type === 'ForbiddenError') {
    return {
      title: 'Access Denied',
      message: appError.userMessage || 'You do not have permission to perform this action.',
      icon: 'warning',
      severity: 'warning',
      actionType: 'dismiss'
    };
  }

  // Not found errors
  if (appError.type === 'NotFoundError') {
    return {
      title: 'Resource Not Found',
      message: appError.userMessage || 'The requested resource could not be found.',
      icon: 'warning',
      severity: 'warning',
      actionType: 'dismiss'
    };
  }

  // Conflict errors (duplicate request, etc.)
  if (appError.type === 'ConflictError') {
    return {
      title: 'Action Could Not Be Completed',
      message: appError.userMessage || 'This action conflicts with existing data. Please try again.',
      icon: 'warning',
      severity: 'warning',
      actionLabel: 'Retry',
      actionType: 'retry'
    };
  }

  // Too many requests (rate limit)
  if (appError.type === 'TooManyRequestsError') {
    return {
      title: 'Too Many Requests',
      message: appError.userMessage || 'Please wait a moment before trying again.',
      icon: 'warning',
      severity: 'info',
      actionLabel: 'Retry',
      actionType: 'retry',
      userAction: 'You\'ve made too many requests too quickly'
    };
  }

  // Server errors
  if (appError.type === 'InternalServerError' || appError.type === 'ServiceUnavailableError') {
    return {
      title: 'Service Unavailable',
      message: appError.userMessage || 'The assessment service is temporarily unavailable. Please try again later.',
      icon: 'error',
      severity: 'critical',
      actionLabel: 'Retry',
      actionType: 'retry',
      userAction: 'The service might be under maintenance'
    };
  }

  // Bad gateway errors
  if (appError.type === 'BadGatewayError') {
    return {
      title: 'Service Error',
      message: appError.userMessage || 'Unable to reach the assessment service. Please try again.',
      icon: 'error',
      severity: 'warning',
      actionLabel: 'Retry',
      actionType: 'retry'
    };
  }

  // Default unknown error
  return {
    title: 'Something Went Wrong',
    message: appError.userMessage || 'An unexpected error occurred. Please try again.',
    icon: 'error',
    severity: 'warning',
    actionLabel: 'Retry',
    actionType: 'retry',
    showDetails: true
  };
}

/**
 * Get retry-appropriate error display
 * Determines if error should show retry button
 * 
 * @param error - AppError object
 * @returns Boolean indicating if retry is appropriate
 */
export function shouldShowRetry(error: AppError | string | Error): boolean {
  if (typeof error === 'string' || error instanceof Error) {
    return false;
  }

  const appError = error as AppError;
  return appError.shouldRetry ?? false;
}

/**
 * Get suggested delay before retry (in milliseconds)
 * 
 * @param error - AppError object
 * @param attemptNumber - Attempt number (1, 2, 3...)
 * @returns Delay in milliseconds
 */
export function getRetryDelay(error: AppError | string | Error, attemptNumber: number = 1): number {
  if (typeof error === 'string' || error instanceof Error) {
    return 0;
  }

  const appError = error as AppError;

  // Rate limit errors: wait longer
  if (appError.type === 'TooManyRequestsError') {
    return 5000 + (attemptNumber * 2000); // 5s + 2s per attempt
  }

  // Service unavailable: exponential backoff
  if (appError.type === 'ServiceUnavailableError') {
    return 2000 * Math.pow(2, attemptNumber - 1); // 2s, 4s, 8s...
  }

  // Network errors: exponential backoff
  if (appError.type === 'NetworkError' || appError.type === 'TimeoutError') {
    return 1000 * Math.pow(2, attemptNumber - 1); // 1s, 2s, 4s...
  }

  return 0;
}

/**
 * Get error category for analytics/logging
 * 
 * @param error - AppError object
 * @returns Error category string
 */
export function getErrorCategory(error: AppError | string | Error): string {
  if (typeof error === 'string' || error instanceof Error) {
    return 'unknown';
  }

  const appError = error as AppError;

  if (appError.type === 'OfflineError' || appError.type === 'NetworkError' || appError.type === 'TimeoutError') {
    return 'network';
  }

  if (appError.type === 'ValidationError') {
    return 'validation';
  }

  if (
    appError.type === 'UnauthorizedError' ||
    appError.type === 'ForbiddenError'
  ) {
    return 'auth';
  }

  if (
    appError.type === 'InternalServerError' ||
    appError.type === 'ServiceUnavailableError' ||
    appError.type === 'BadGatewayError'
  ) {
    return 'server';
  }

  if (appError.type === 'TooManyRequestsError') {
    return 'rate_limit';
  }

  return 'unknown';
}
