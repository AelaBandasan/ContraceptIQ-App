/**
 * Navigation Guard Utility
 * 
 * Handles safe navigation with error handling and state cleanup.
 * Prevents navigation issues when errors occur or data is invalid.
 */

import { NavigationProp } from '@react-navigation/native';
import { createModuleLogger } from './loggerUtils';
import { createAppError } from './errorHandler';

const logger = createModuleLogger('NavigationGuard');

interface NavigationGuardOptions {
  /**
   * Screen name to navigate to
   */
  screenName: string;

  /**
   * Optional params to pass to the screen
   */
  params?: Record<string, any>;

  /**
   * Validation function - returns true if navigation should proceed
   */
  validate?: () => boolean | Promise<boolean>;

  /**
   * Cleanup function to run before navigation
   */
  cleanup?: () => void | Promise<void>;

  /**
   * Error handler for validation or cleanup failures
   */
  onError?: (error: Error) => void;

  /**
   * Success callback after navigation
   */
  onSuccess?: () => void;
}

/**
 * Safe navigation with validation and cleanup
 * 
 * Performs validation before navigation and handles errors gracefully.
 * 
 * @param navigation - React Navigation navigation object
 * @param options - Navigation guard options
 * @returns Promise that resolves when navigation completes or rejects on error
 */
export async function guardedNavigate(
  navigation: NavigationProp<any>,
  options: NavigationGuardOptions
): Promise<void> {
  const { screenName, params, validate, cleanup, onError, onSuccess } = options;

  try {
    // Run validation if provided
    if (validate) {
      logger.debug('NavigationGuard', `Validating navigation to ${screenName}`);
      const isValid = await Promise.resolve(validate());
      
      if (!isValid) {
        const error = new Error(`Validation failed for navigation to ${screenName}`);
        logger.warn('NavigationGuard', 'Validation failed', { screenName });
        throw error;
      }
    }

    // Run cleanup if provided
    if (cleanup) {
      logger.debug('NavigationGuard', `Running cleanup before ${screenName}`);
      await Promise.resolve(cleanup());
    }

    // Navigate
    logger.info('NavigationGuard', `Navigating to ${screenName}`, { params });
    navigation.navigate(screenName as never, params as never);

    // Success callback
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    const appError = createAppError(error, {
      operation: 'guardedNavigate',
      screenName,
      params,
    });

    logger.error('NavigationGuard', `Navigation to ${screenName} failed`, appError as Error);

    if (onError) {
      onError(appError as Error);
    } else {
      // Re-throw if no error handler
      throw appError;
    }
  }
}

/**
 * Safe navigation back with cleanup
 * 
 * @param navigation - Navigation object
 * @param cleanup - Optional cleanup function
 * @param onError - Optional error handler
 */
export async function guardedGoBack(
  navigation: NavigationProp<any>,
  cleanup?: () => void | Promise<void>,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    if (cleanup) {
      logger.debug('NavigationGuard', 'Running cleanup before going back');
      await Promise.resolve(cleanup());
    }

    logger.info('NavigationGuard', 'Navigating back');
    navigation.goBack();
  } catch (error) {
    const appError = createAppError(error, {
      operation: 'guardedGoBack',
    });

    logger.error('NavigationGuard', 'Go back failed', appError as Error);

    if (onError) {
      onError(appError as Error);
    } else {
      throw appError;
    }
  }
}

/**
 * Check if navigation can proceed safely
 * 
 * @param navigation - Navigation object
 * @returns True if can navigate
 */
export function canNavigate(navigation: NavigationProp<any>): boolean {
  try {
    // Check if navigation object is valid
    if (!navigation || typeof navigation.navigate !== 'function') {
      logger.warn('NavigationGuard', 'Invalid navigation object');
      return false;
    }

    // Check if current route exists
    const state = navigation.getState();
    if (!state || !state.routes || state.routes.length === 0) {
      logger.warn('NavigationGuard', 'Invalid navigation state');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('NavigationGuard', 'Error checking navigation state', error as Error);
    return false;
  }
}

/**
 * Get current screen name
 * 
 * @param navigation - Navigation object
 * @returns Current screen name or null
 */
export function getCurrentScreenName(navigation: NavigationProp<any>): string | null {
  try {
    const state = navigation.getState();
    if (!state || !state.routes || state.routes.length === 0) {
      return null;
    }

    const currentRoute = state.routes[state.index];
    return currentRoute?.name || null;
  } catch (error) {
    logger.error('NavigationGuard', 'Error getting current screen', error as Error);
    return null;
  }
}

/**
 * Check if currently on a specific screen
 * 
 * @param navigation - Navigation object
 * @param screenName - Screen name to check
 * @returns True if on the specified screen
 */
export function isOnScreen(navigation: NavigationProp<any>, screenName: string): boolean {
  const currentScreen = getCurrentScreenName(navigation);
  return currentScreen === screenName;
}

export default guardedNavigate;
