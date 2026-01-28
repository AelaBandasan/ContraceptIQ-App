/**
 * Discontinuation Risk Assessment Service
 * 
 * Communicates with the backend API to assess contraceptive discontinuation risk.
 * Handles HTTP requests, error handling, validation, and retry logic.
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
} from 'axios';
import { createModuleLogger } from '../utils/loggerUtils';
import {
  createAppError,
  isRetryableError,
  isOfflineError,
  AppError,
} from '../utils/errorHandler';
import { isOnline } from '../utils/networkUtils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserAssessmentData {
  // Demographic features (13)
  AGE: number;
  REGION: number | string;
  EDUC_LEVEL: number | string;
  RELIGION: number | string;
  ETHNICITY: number | string;
  MARITAL_STATUS: number | string;
  RESIDING_WITH_PARTNER: number;
  HOUSEHOLD_HEAD_SEX: number;
  OCCUPATION: number | string;
  HUSBANDS_EDUC: number | string;
  HUSBAND_AGE: number;
  PARTNER_EDUC: number | string;
  SMOKE_CIGAR: number;
  // Fertility features (4)
  PARITY: number;
  DESIRE_FOR_MORE_CHILDREN: number | string;
  WANT_LAST_CHILD: number | string;
  WANT_LAST_PREGNANCY: number | string;
  // Method/History features (9)
  CONTRACEPTIVE_METHOD: number | string;
  MONTH_USE_CURRENT_METHOD: number | string;
  PATTERN_USE: number | string;
  TOLD_ABT_SIDE_EFFECTS: number;
  LAST_SOURCE_TYPE: number | string;
  LAST_METHOD_DISCONTINUED: number | string;
  REASON_DISCONTINUED: number | string;
  HSBND_DESIRE_FOR_MORE_CHILDREN: number | string;
}

export interface RiskAssessmentResponse {
  risk_level: 'LOW' | 'HIGH';
  confidence: number;
  recommendation: string;
  xgb_probability: number;
  upgraded_by_dt: boolean;
  metadata?: {
    model_version: string;
    threshold: number;
    confidence_margin: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
  missing_features?: string[];
  validation_errors?: string[];
  status?: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  models_loaded: boolean;
  model_directory: string;
  message: string;
}

export interface RequiredFeaturesResponse {
  required_features: string[];
  total_count: number;
  categories: {
    demographic: number;
    fertility: number;
    method_history: number;
  };
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class DiscontinuationRiskService {
  private client: AxiosInstance;
  private readonly API_BASE_URL: string;
  private readonly API_TIMEOUT: number = 30000; // 30 seconds
  private readonly MAX_RETRIES: number = 3;

  constructor(baseURL?: string) {
    // Get API URL from environment variable or use default
    this.API_BASE_URL =
      baseURL ||
      process.env.REACT_APP_API_URL ||
      process.env.EXPO_PUBLIC_API_URL ||
      'http://localhost:5000';

    // Initialize axios instance with configuration
    this.client = axios.create({
      baseURL: this.API_BASE_URL,
      timeout: this.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  /**
   * Check if the API server is healthy and models are loaded.
   * 
   * @returns Promise with health status
   * @throws AppError if server is not accessible
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const logger = createModuleLogger('DiscontinuationRiskService');
    try {
      // Check network connectivity first
      const online = await isOnline();
      if (!online) {
        const offlineError = createAppError(new Error('Device is offline'), {
          operation: 'checkHealth',
          offline: true
        });
        logger.warn('DiscontinuationRiskService', 'Health check - device offline');
        throw offlineError;
      }

      const response = await this.client.get<HealthCheckResponse>(
        '/api/health'
      );
      logger.info('DiscontinuationRiskService', 'Health check passed', {
        status: response.data.status,
        modelsLoaded: response.data.models_loaded
      });
      return response.data;
    } catch (error) {
      const appError = error instanceof Error && 'type' in error && 'userMessage' in error 
        ? error as any
        : createAppError(error, { operation: 'checkHealth' });
      
      logger.error(
        'DiscontinuationRiskService',
        'Health check failed',
        appError as Error
      );
      throw appError;
    }
    }
  }

  /**
   * Get the list of 26 required features for prediction.
   * 
   * @returns Promise with list of required features and categories
   */
  async getRequiredFeatures(): Promise<RequiredFeaturesResponse> {
    const logger = createModuleLogger('DiscontinuationRiskService');
    try {
      // Check if device is online
      const online = await isOnline();
      if (!online) {
        const appError = createAppError(new Error('No internet connection'), {
          operation: 'getRequiredFeatures',
          offline: true
        });
        logger.error('DiscontinuationRiskService', 'getRequiredFeatures offline', appError);
        throw appError;
      }

      const response = await this.client.get<RequiredFeaturesResponse>(
        '/api/v1/features'
      );
      logger.info('DiscontinuationRiskService', 'Features fetched successfully');
      return response.data;
    } catch (error) {
      const appError = error instanceof Error && 'type' in error && 'userMessage' in error 
        ? error as any
        : createAppError(error, { operation: 'getRequiredFeatures' });
      
      logger.error(
        'DiscontinuationRiskService',
        'Failed to fetch required features',
        appError as Error
      );
      throw appError;
    }
  }

  /**
   * Assess discontinuation risk for a user.
   * 
   * Implements retry logic: retries up to 3 times on network errors.
   * Checks network connectivity before attempting request.
   * 
   * @param data - User assessment data (26 features)
   * @returns Promise with risk assessment result
   * @throws AppError if all retries fail or validation fails
   */
  async assessDiscontinuationRisk(
    data: UserAssessmentData,
    retryCount: number = 0
  ): Promise<RiskAssessmentResponse> {
    const logger = createModuleLogger('DiscontinuationRiskService');
    try {
      // Check network connectivity first
      const online = await isOnline();
      if (!online) {
        const offlineError = createAppError(new Error('Device is offline'), {
          operation: 'assessDiscontinuationRisk',
          offline: true
        });
        logger.warn(
          'DiscontinuationRiskService',
          'Assessment attempt while offline',
          { offline: true }
        );
        throw offlineError;
      }

      // Validate input data before sending
      this.validateInputData(data);
      logger.debug('DiscontinuationRiskService', 'Input validation passed', { featureCount: Object.keys(data).length });

      // Make API request with retry logic
      const response = await this.client.post<RiskAssessmentResponse>(
        '/api/v1/discontinuation-risk',
        data
      );

      logger.info(
        'DiscontinuationRiskService',
        'Assessment completed successfully',
        { riskLevel: response.data.risk_level, confidence: response.data.confidence_score }
      );

      return response.data;
    } catch (error) {
      // Handle offline errors
      if (error instanceof Error && 'type' in error) {
        if ((error as any).type === 'OfflineError') {
          logger.error(
            'DiscontinuationRiskService',
            'Device offline - cannot perform assessment',
            error as Error
          );
          throw error;
        }
      }

      // Handle axios errors
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as ApiError | undefined;

        // Validation errors (400) - don't retry, permanent issue
        if (error.response?.status === 400) {
          const validationError = createAppError(error, {
            operation: 'assessDiscontinuationRisk',
            validationFailed: true,
            details: apiError?.error
          });
          logger.error(
            'DiscontinuationRiskService',
            'Validation failed',
            validationError as Error,
            { details: apiError?.error }
          );
          throw validationError;
        }

        // Service unavailable (503) - models not loaded
        if (error.response?.status === 503) {
          const serviceError = createAppError(error, {
            operation: 'assessDiscontinuationRisk',
            serviceUnavailable: true
          });
          logger.error(
            'DiscontinuationRiskService',
            'Service unavailable (models not loaded)',
            serviceError as Error
          );
          
          // Retry on service unavailable
          if (retryCount < this.MAX_RETRIES) {
            logger.info(
              'DiscontinuationRiskService',
              `Retrying after service unavailable (${retryCount + 1}/${this.MAX_RETRIES})`,
              { retryCount: retryCount + 1 }
            );
            await this.delay(1000 * (retryCount + 1));
            return this.assessDiscontinuationRisk(data, retryCount + 1);
          }
          throw serviceError;
        }

        // Network errors - retry with backoff
        if (error.code && ['ECONNABORTED', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error.code)) {
          if (isRetryableError(error as any)) {
            if (retryCount < this.MAX_RETRIES) {
              logger.warn(
                'DiscontinuationRiskService',
                `Network error, retrying (${retryCount + 1}/${this.MAX_RETRIES})`,
                { code: error.code, retryCount: retryCount + 1 }
              );
              await this.delay(1000 * (retryCount + 1));
              return this.assessDiscontinuationRisk(data, retryCount + 1);
            }
          }
        }

        // Other HTTP errors
        const appError = createAppError(error, {
          operation: 'assessDiscontinuationRisk',
          httpStatus: error.response?.status,
          retried: retryCount > 0
        });
        logger.error(
          'DiscontinuationRiskService',
          'Assessment failed after retries',
          appError as Error,
          { retries: retryCount, status: error.response?.status }
        );
        throw appError;
      }

      // Non-axios errors
      const appError = createAppError(error, {
        operation: 'assessDiscontinuationRisk',
        retried: retryCount > 0
      });
      logger.error(
        'DiscontinuationRiskService',
        'Assessment failed with unexpected error',
        appError as Error,
        { retries: retryCount }
      );
      throw appError;
    }
  }

  /**
   * Validate input data before sending to API.
   * Checks for required features and basic type validation.
   * 
   * @param data - User assessment data
   * @throws AppError if validation fails
   */
  private validateInputData(data: Partial<UserAssessmentData>): void {
    const logger = createModuleLogger('DiscontinuationRiskService');
    const requiredKeys: (keyof UserAssessmentData)[] = [
      'AGE',
      'REGION',
      'EDUC_LEVEL',
      'RELIGION',
      'ETHNICITY',
      'MARITAL_STATUS',
      'RESIDING_WITH_PARTNER',
      'HOUSEHOLD_HEAD_SEX',
      'OCCUPATION',
      'HUSBANDS_EDUC',
      'HUSBAND_AGE',
      'PARTNER_EDUC',
      'SMOKE_CIGAR',
      'PARITY',
      'DESIRE_FOR_MORE_CHILDREN',
      'WANT_LAST_CHILD',
      'WANT_LAST_PREGNANCY',
      'CONTRACEPTIVE_METHOD',
      'MONTH_USE_CURRENT_METHOD',
      'PATTERN_USE',
      'TOLD_ABT_SIDE_EFFECTS',
      'LAST_SOURCE_TYPE',
      'LAST_METHOD_DISCONTINUED',
      'REASON_DISCONTINUED',
      'HSBND_DESIRE_FOR_MORE_CHILDREN',
    ];

    // Check for missing features
    const missingFeatures = requiredKeys.filter((key) => !(key in data));
    if (missingFeatures.length > 0) {
      const validationError = createAppError(
        new Error(`Missing required features: ${missingFeatures.join(', ')}`),
        {
          operation: 'validateInputData',
          missingFeatures,
          missingCount: missingFeatures.length
        }
      );
      logger.error(
        'DiscontinuationRiskService',
        'Validation failed - missing features',
        validationError as Error,
        { missingFeatures, count: missingFeatures.length }
      );
      throw validationError;
    }

    // Validate AGE range
    if (typeof data.AGE === 'number' && (data.AGE < 15 || data.AGE > 55)) {
      const validationError = createAppError(
        new Error('AGE must be between 15 and 55'),
        {
          operation: 'validateInputData',
          field: 'AGE',
          value: data.AGE,
          validRange: '15-55'
        }
      );
      logger.error(
        'DiscontinuationRiskService',
        'Validation failed - invalid age',
        validationError as Error,
        { age: data.AGE }
      );
      throw validationError;
    }

    logger.debug('DiscontinuationRiskService', 'Input validation successful', { featureCount: Object.keys(data).length });
  }

  /**
   * Extract error message from various error types.
   * 
   * @param error - Error object
   * @returns Error message string
   */
  private extractErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        return error.response.data.error;
      }
      if (error.message) {
        return error.message;
      }
      if (error.code === 'ECONNABORTED') {
        return 'Request timeout - please check your connection';
      }
      if (error.code === 'ECONNREFUSED') {
        return 'Cannot connect to assessment service';
      }
    }

    return error?.message || 'Unknown error occurred';
  }

  /**
   * Handle axios errors with logging.
   * 
   * @param error - Axios error
   * @returns Rejected promise
   */
  private handleError(error: AxiosError): Promise<never> {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }

  /**
   * Utility function to delay execution (for retry backoff).
   * 
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON INSTANCE & EXPORTS
// ============================================================================

// Create singleton instance
let serviceInstance: DiscontinuationRiskService | null = null;

/**
 * Get or create the singleton service instance.
 * 
 * @param baseURL - Optional custom API base URL
 * @returns Service instance
 */
export function getDiscontinuationRiskService(
  baseURL?: string
): DiscontinuationRiskService {
  if (!serviceInstance) {
    serviceInstance = new DiscontinuationRiskService(baseURL);
  }
  return serviceInstance;
}

/**
 * Convenience function for assessing discontinuation risk.
 * Uses singleton service instance.
 * 
 * @param data - User assessment data
 * @returns Promise with risk assessment
 */
export async function assessDiscontinuationRisk(
  data: UserAssessmentData
): Promise<RiskAssessmentResponse> {
  const service = getDiscontinuationRiskService();
  return service.assessDiscontinuationRisk(data);
}

/**
 * Check if API is healthy (convenience function).
 * 
 * @returns Promise with health status
 */
export async function checkApiHealth(): Promise<HealthCheckResponse> {
  const service = getDiscontinuationRiskService();
  return service.checkHealth();
}

/**
 * Get required features list (convenience function).
 * 
 * @returns Promise with required features
 */
export async function fetchRequiredFeatures(): Promise<RequiredFeaturesResponse> {
  const service = getDiscontinuationRiskService();
  return service.getRequiredFeatures();
}

// Export service class for advanced usage
export { DiscontinuationRiskService };
