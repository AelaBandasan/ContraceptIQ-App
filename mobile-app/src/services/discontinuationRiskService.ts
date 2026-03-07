/**
 * Discontinuation Risk Assessment Service
 *
 * Communicates with the backend API to assess contraceptive discontinuation risk.
 * Handles HTTP requests, error handling, validation, and retry logic.
 */

import axios, {
  AxiosInstance,
  AxiosError,
} from 'axios';
import { createModuleLogger } from '../utils/loggerUtils';
import { createAppError } from '../utils/errorHandler';
import { isOnline } from '../utils/networkUtils';
import { assessOffline } from './onDeviceRiskService';

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

export interface PatientIntakeData {
  // --- Phase 1: Guest Input ---
  // Demographics
  AGE: number;
  REGION: number | string;
  EDUC_LEVEL: number | string;
  RELIGION: number | string;
  ETHNICITY: number | string;
  MARITAL_STATUS: number | string;
  RESIDING_WITH_PARTNER: number;
  HOUSEHOLD_HEAD_SEX: number;
  OCCUPATION: number | string;
  // Partner/History
  HUSBANDS_EDUC: number | string;
  HUSBAND_AGE: number;
  PARTNER_EDUC: number | string;
  HSBND_DESIRE_FOR_MORE_CHILDREN: number | string;
  SMOKE_CIGAR: number;
  PARITY: number;
  DESIRE_FOR_MORE_CHILDREN: number | string;
  WANT_LAST_CHILD: number | string;
  WANT_LAST_PREGNANCY: number | string;
  LAST_METHOD_DISCONTINUED: number | string;
  REASON_DISCONTINUED: number | string;

  // Computed Eligibility
  method_eligibility: Record<string, number>;
  mec_recommendations?: string[];
}

export interface ClinicalData extends Pick<UserAssessmentData,
  'CONTRACEPTIVE_METHOD' |
  'MONTH_USE_CURRENT_METHOD' |
  'PATTERN_USE' |
  'TOLD_ABT_SIDE_EFFECTS' |
  'LAST_SOURCE_TYPE'
> { }

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
  private readonly API_TIMEOUT: number = 5000; // 5 seconds — fail fast so ONNX fallback triggers quickly

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
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const logger = createModuleLogger('DiscontinuationRiskService');
    try {
      // Check network connectivity first
      const online = await isOnline();
      if (!online) {
        const offlineError = createAppError(new Error('Device is offline'), 'checkHealth');
        logger.warn('Health check - device offline');
        throw offlineError;
      }

      const response = await this.client.get<HealthCheckResponse>(
        '/api/health'
      );
      logger.info('Health check passed', {
        status: response.data.status,
        modelsLoaded: response.data.models_loaded
      });
      return response.data;
    } catch (error) {
      const appError = error instanceof Error && 'type' in error && 'userMessage' in error
        ? error as any
        : createAppError(error, 'checkHealth');

      logger.error(
        'Health check failed',
        undefined, // error object
        { error: appError } // data
      );
      throw appError;
    }
  }

  /**
   * Submit Patient Intake Data (Guest) and get code.
   */
  async submitPatientIntake(data: PatientIntakeData): Promise<{ code: string; expires_in: string }> {
    const logger = createModuleLogger('DiscontinuationRiskService');
    try {
      const online = await isOnline();
      if (!online) throw createAppError(new Error('Device is offline'), 'submitPatientIntake');

      const response = await this.client.post<{ code: string; expires_in: string }>(
        '/api/v1/patient-intake',
        data
      );

      logger.info('Patient intake submitted', { code: response.data.code });
      return response.data;
    } catch (error) {
      logger.error('Failed to submit patient intake', undefined, { error });
      throw createAppError(error, 'submitPatientIntake');
    }
  }

  /**
   * Retrieve Patient Intake Data by Code (Doctor)
   */
  async getPatientIntake(code: string): Promise<PatientIntakeData> {
    const logger = createModuleLogger('DiscontinuationRiskService');
    try {
      const online = await isOnline();
      if (!online) throw createAppError(new Error('Device is offline'), 'getPatientIntake');

      const response = await this.client.get<PatientIntakeData>(`/api/v1/patient-intake/${code}`);
      logger.info('Patient intake retrieved', { code });
      return response.data;
    } catch (error) {
      logger.error('Failed to retrieve patient intake', undefined, { error });
      throw error;
    }
  }

  /**
   * Fetch Patient Data by Code (Doctor).
   */
  async fetchPatientIntake(code: string): Promise<PatientIntakeData> {
    const logger = createModuleLogger('DiscontinuationRiskService');
    try {
      const online = await isOnline();
      if (!online) throw createAppError(new Error('Device is offline'), 'fetchPatientIntake');

      const response = await this.client.get<PatientIntakeData>(
        `/api/v1/patient-intake/${code}`
      );

      logger.info('Patient data fetched', { code });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch patient data', undefined, { error });
      throw createAppError(error, 'fetchPatientIntake');
    }
  }

  /**
   * Get the list of 26 required features for prediction.
   */
  async getRequiredFeatures(): Promise<RequiredFeaturesResponse> {
    const logger = createModuleLogger('DiscontinuationRiskService');
    try {
      // Check if device is online
      const online = await isOnline();
      if (!online) {
        const appError = createAppError(new Error('No internet connection'), 'getRequiredFeatures');
        logger.error('getRequiredFeatures offline', undefined, { error: appError });
        throw appError;
      }

      const response = await this.client.get<RequiredFeaturesResponse>(
        '/api/v1/features'
      );
      logger.info('Features fetched successfully');
      return response.data;
    } catch (error) {
      const appError = error instanceof Error && 'type' in error && 'userMessage' in error
        ? error as any
        : createAppError(error, 'getRequiredFeatures');

      logger.error(
        'Failed to fetch required features',
        undefined,
        { error: appError }
      );
      throw appError;
    }
  }

  /**
   * Assess discontinuation risk using the on-device ONNX v4 model.
   * Always runs locally — no Flask server required.
   */
  async assessDiscontinuationRisk(
    data: UserAssessmentData,
  ): Promise<RiskAssessmentResponse> {
    const logger = createModuleLogger('DiscontinuationRiskService');
    try {
      logger.info('Running on-device v4 assessment');
      const result = await assessOffline(data as Record<string, any>);
      logger.info('On-device assessment completed', {
        riskLevel: result.risk_level,
        confidence: result.confidence,
      });
      return result;
    } catch (error: any) {
      logger.error('On-device assessment failed', undefined, { error });
      throw createAppError(
        new Error(`On-device model failed: ${error?.message || 'Unknown error'}`),
        'assessDiscontinuationRisk'
      );
    }
  }

  /**
   * Handle axios errors with logging.
   */
  private handleError(error: AxiosError): Promise<never> {
    // Silence console.error to prevent Red Box overlays in development
    // when using on-device fallbacks. Log as warn/debug instead.
    console.warn("API Error (handled):", {
      status: error.response?.status,
      message: error.message,
      code: error.code,
    });

    return Promise.reject(error);
  }
}

// ============================================================================
// SINGLETON INSTANCE & EXPORTS
// ============================================================================

// Create singleton instance
let serviceInstance: DiscontinuationRiskService | null = null;

/**
 * Get or create the singleton service instance.
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
 */
export async function assessDiscontinuationRisk(
  data: UserAssessmentData
): Promise<RiskAssessmentResponse> {
  const service = getDiscontinuationRiskService();
  return service.assessDiscontinuationRisk(data);
}

/**
 * Check if API is healthy (convenience function).
 */
export async function checkApiHealth(): Promise<HealthCheckResponse> {
  const service = getDiscontinuationRiskService();
  return service.checkHealth();
}

/**
 * Get required features list (convenience function).
 */
export async function fetchRequiredFeatures(): Promise<RequiredFeaturesResponse> {
  const service = getDiscontinuationRiskService();
  return service.getRequiredFeatures();
}

/**
 * Submit Patient Intake Data (Guest).
 */
export async function submitPatientIntake(
  data: PatientIntakeData
): Promise<{ code: string; expires_in: string }> {
  const service = getDiscontinuationRiskService();
  return service.submitPatientIntake(data);
}

/**
 * Fetch Patient Data by Code (Doctor).
 */
export async function fetchPatientIntake(
  code: string
): Promise<PatientIntakeData> {
  const service = getDiscontinuationRiskService();
  return service.fetchPatientIntake(code);
}

// Export service class for advanced usage
export { DiscontinuationRiskService };
