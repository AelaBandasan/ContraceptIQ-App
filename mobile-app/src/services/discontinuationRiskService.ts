/**
 * Discontinuation Risk Assessment Service
 * Uses native fetch API - no external dependencies required
 */

import { Platform } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export interface UserAssessmentData {
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
  PARITY: number;
  DESIRE_FOR_MORE_CHILDREN: number | string;
  WANT_LAST_CHILD: number | string;
  WANT_LAST_PREGNANCY: number | string;
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
  method_name?: string;
  xgb_probability?: number;
  upgraded_by_dt?: boolean;
  metadata?: any;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
  missing_features?: string[];
  validation_errors?: string[];
}

// ============================================================================
// SERVICE
// ============================================================================

const DEFAULT_DATA: UserAssessmentData = {
  AGE: 25,
  REGION: 1,
  EDUC_LEVEL: 2,
  RELIGION: 1,
  ETHNICITY: 1,
  MARITAL_STATUS: 1,
  RESIDING_WITH_PARTNER: 1,
  HOUSEHOLD_HEAD_SEX: 1,
  OCCUPATION: 1,
  HUSBANDS_EDUC: 2,
  HUSBAND_AGE: 30,
  PARTNER_EDUC: 2,
  SMOKE_CIGAR: 0,
  PARITY: 1,
  DESIRE_FOR_MORE_CHILDREN: 1,
  WANT_LAST_CHILD: 1,
  WANT_LAST_PREGNANCY: 1,
  CONTRACEPTIVE_METHOD: 1,
  MONTH_USE_CURRENT_METHOD: 6,
  PATTERN_USE: 1,
  TOLD_ABT_SIDE_EFFECTS: 1,
  LAST_SOURCE_TYPE: 1,
  LAST_METHOD_DISCONTINUED: 0,
  REASON_DISCONTINUED: 0,
  HSBND_DESIRE_FOR_MORE_CHILDREN: 1,
};

class DiscontinuationRiskService {
  private readonly baseURL: string;
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000;
  private readonly TIMEOUT = 15000;

  constructor() {
    const env = (typeof process !== 'undefined' ? process.env : {}) as any;
    
    // --- IMPORTANT FOR EXPO GO ON A PHYSICAL DEVICE ---
    // You are using Expo Go on a physical iOS device. It cannot connect to 'localhost'.
    // You MUST replace 'YOUR_COMPUTER_IP_ADDRESS' with your computer's actual local IP address.
    // To find your IP:
    // - On Windows: open Command Prompt and type `ipconfig`
    // - On macOS: open Terminal and type `ifconfig`
    // Make sure your phone and computer are on the same Wi-Fi network.
    // Ensure you include 'http://'
    this.baseURL = `http://192.168.100.4:5000`; // <-- Ensure 'http://' is present

    console.log(`[DiscontinuationRiskService] Initialized with baseURL: ${this.baseURL}`);
  }

  /**
   * Assess discontinuation risk
   */
  async assessDiscontinuationRisk(
    data: UserAssessmentData
  ): Promise<RiskAssessmentResponse> {
    return this.makeRequestWithRetry(data, 0);
  }

  /**
   * Make API request with automatic retry logic
   */
  private async makeRequestWithRetry(
    data: UserAssessmentData,
    attemptNumber: number
  ): Promise<RiskAssessmentResponse> {
    // Merge with defaults to ensure no missing fields
    const sanitizedData = { ...DEFAULT_DATA, ...data };

    try {
      // Validate input
      this.validateData(sanitizedData);

      console.log(`[DiscontinuationRiskService] Making request to: ${this.baseURL}/api/v1/discontinuation-risk (Attempt ${attemptNumber + 1})`);

      // Make request with timeout
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/api/v1/discontinuation-risk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(sanitizedData),
        },
        this.TIMEOUT
      );

      // Parse response
      const responseData = await response.json();

      // Check for HTTP errors
      if (!response.ok) {
        throw this.createHttpError(response.status, responseData);
      }

      // Validate and normalize response
      return this.normalizeResponse(responseData);

    } catch (error) {
      // Handle retry logic
      if (this.shouldRetry(error, attemptNumber)) {
        const delay = this.RETRY_DELAY * (attemptNumber + 1);
        await this.sleep(delay);
        return this.makeRequestWithRetry(data, attemptNumber + 1);
      }

      // Throw user-friendly error
      throw this.createUserError(error);
    }
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error: any) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Create HTTP error from response
   */
  private createHttpError(status: number, data: any): Error {
    const error = new Error(`HTTP ${status}`);
    (error as any).status = status;
    (error as any).response = { status, data };
    return error;
  }

  /**
   * Validate assessment data
   */
  private validateData(data: Partial<UserAssessmentData>): void {
    const required: (keyof UserAssessmentData)[] = [
      'AGE', 'REGION', 'EDUC_LEVEL', 'RELIGION', 'ETHNICITY', 
      'MARITAL_STATUS', 'RESIDING_WITH_PARTNER', 'HOUSEHOLD_HEAD_SEX',
      'OCCUPATION', 'HUSBANDS_EDUC', 'HUSBAND_AGE', 'PARTNER_EDUC',
      'SMOKE_CIGAR', 'PARITY', 'DESIRE_FOR_MORE_CHILDREN',
      'WANT_LAST_CHILD', 'WANT_LAST_PREGNANCY', 'CONTRACEPTIVE_METHOD',
      'MONTH_USE_CURRENT_METHOD', 'PATTERN_USE', 'TOLD_ABT_SIDE_EFFECTS',
      'LAST_SOURCE_TYPE', 'LAST_METHOD_DISCONTINUED', 'REASON_DISCONTINUED',
      'HSBND_DESIRE_FOR_MORE_CHILDREN'
    ];

    const missing = required.filter(key => 
      data[key] === undefined || data[key] === null
    );

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (typeof data.AGE === 'number' && (data.AGE < 10 || data.AGE > 100)) {
      throw new Error('Age must be between 10 and 100');
    }
  }

  /**
   * Normalize API response
   */
  private normalizeResponse(data: any): RiskAssessmentResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from server');
    }

    // Normalize risk_level (handle both string and number)
    let riskLevel: 'LOW' | 'HIGH' = 'LOW';
    if (data.risk_level === 'HIGH' || data.risk_level === 1 || data.risk_level === '1') {
      riskLevel = 'HIGH';
    }

    return {
      risk_level: riskLevel,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
      recommendation: data.recommendation || this.getDefaultRecommendation(riskLevel),
      method_name: data.method_name || 'Current Method',
      xgb_probability: data.xgb_probability,
      upgraded_by_dt: data.upgraded_by_dt,
      metadata: data.metadata,
    };
  }

  /**
   * Get default recommendation based on risk level
   */
  private getDefaultRecommendation(riskLevel: 'LOW' | 'HIGH'): string {
    if (riskLevel === 'HIGH') {
      return 'Consider discussing method alternatives with a healthcare provider. Explore options that better match your needs and preferences.';
    }
    return 'Your current contraceptive method appears well-suited to your needs. Continue regular follow-ups with your healthcare provider.';
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any, attemptNumber: number): boolean {
    if (attemptNumber >= this.MAX_RETRIES) {
      return false;
    }

    // Retry on network errors
    if (error.message === 'Request timeout' || 
        error.message === 'Network request failed' ||
        error.message?.includes('fetch')) {
      return true;
    }

    // Retry on 5xx errors
    const status = error.status || error.response?.status;
    if (status && status >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Create user-friendly error
   */
  private createUserError(error: any): Error {
    let message = 'Unable to assess discontinuation risk. Please try again.';

    const status = error.status || error.response?.status;
    const data = error.response?.data as ApiErrorResponse | undefined;

    if (status === 400) {
      message = data?.message || 'Invalid assessment data. Please check your information.';
    } else if (status === 503) {
      message = 'Service temporarily unavailable. Please try again in a moment.';
    } else if (status && status >= 500) {
      message = 'Server error occurred. Please try again later.';
    } else if (error.message === 'Request timeout') {
      message = 'Request timed out. Please check your connection and try again.';
    } else if (error.message === 'Network request failed' || error.message?.includes('fetch')) {
      message = `Connection failed to ${this.baseURL}. If using Expo Go on a physical device, ensure you use your computer's local IP address (e.g., 192.168.x.x) and that both devices are on the same Wi-Fi.`;
    } else if (data?.message) {
      message = data.message;
    } else if (error.message) {
      message = error.message;
    }

    const userError = new Error(message);
    (userError as any).originalError = error;
    return userError;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async checkHealth(): Promise<{ status: string; models_loaded: boolean }> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/api/health`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        },
        this.TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.createUserError(error);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const service = new DiscontinuationRiskService();

export const assessDiscontinuationRisk = (data: UserAssessmentData) =>
  service.assessDiscontinuationRisk(data);

export const checkHealth = () => service.checkHealth();

export default service;