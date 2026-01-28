/**
 * Assessment Context
 *
 * Provides global state management for discontinuation risk assessments.
 * Allows sharing assessment data and results across screens without prop drilling.
 *
 * Usage:
 *   const { assessment, updateAssessment } = useAssessment();
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * User assessment data - contains all 26 required features for ML prediction
 */
export interface AssessmentData {
  // Demographic Features (6)
  age: number;
  education: number;
  working: number;
  urban: number;
  partner_object: number;
  partner_approval: number;

  // Fertility Features (4)
  fertility_want: number;
  fertility_soon: number;
  parity: number;
  son_preference: number;

  // Method & History Features (13)
  method_duration_months: number;
  switching_last_12m: number;
  discontinuation_reason_satisfied: number;
  discontinuation_reason_side_effects: number;
  discontinuation_reason_other: number;
  current_method: number;
  num_previous_methods: number;
  counseling_received: number;
  satisfaction_score: number;
  adherence_score: number;
  accessibility_score: number;
  relationship_status: number;
  previous_discontinuation: number;
}

/**
 * Risk assessment result from ML model
 */
export interface RiskAssessmentResult {
  riskLevel: 'LOW' | 'HIGH';
  confidence: number; // 0-1
  recommendation: string;
  contraceptiveMethod?: string;
  xgbPrediction?: number;
  dtPrediction?: number;
  upgradeFlag?: boolean;
  timestamp: string; // ISO timestamp of assessment
}

/**
 * Complete assessment state
 */
export interface AssessmentState {
  // Assessment data
  assessmentData: AssessmentData | null;

  // Results
  assessmentResult: RiskAssessmentResult | null;

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;

  // Timestamp of last assessment
  lastAssessmentTime: string | null;

  // Flag for whether assessment needs to be refreshed
  isDirty: boolean;
}

/**
 * Context value type
 */
export interface AssessmentContextType extends AssessmentState {
  // Assessment data management
  setAssessmentData: (data: AssessmentData) => void;
  updateAssessmentData: (data: Partial<AssessmentData>) => void;
  clearAssessmentData: () => void;

  // Assessment result management
  setAssessmentResult: (result: RiskAssessmentResult) => void;
  clearAssessmentResult: () => void;

  // Loading state
  setIsLoading: (loading: boolean) => void;

  // Error management
  setError: (error: string | null) => void;
  clearError: () => void;

  // Dirty flag (marks data as changed/needing refresh)
  markDirty: () => void;
  markClean: () => void;

  // Utilities
  reset: () => void; // Clear all state
  isAssessmentValid: () => boolean; // Check if all required fields present
}

// ============================================================================
// CONTEXT & PROVIDER
// ============================================================================

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

/**
 * Initial assessment data with default values
 */
const defaultAssessmentData: AssessmentData = {
  age: 25,
  education: 2,
  working: 1,
  urban: 1,
  partner_object: 0,
  partner_approval: 1,
  fertility_want: 1,
  fertility_soon: 0,
  parity: 1,
  son_preference: 0,
  method_duration_months: 6,
  switching_last_12m: 0,
  discontinuation_reason_satisfied: 0,
  discontinuation_reason_side_effects: 0,
  discontinuation_reason_other: 0,
  current_method: 1,
  num_previous_methods: 1,
  counseling_received: 1,
  satisfaction_score: 3,
  adherence_score: 3,
  accessibility_score: 3,
  relationship_status: 1,
  previous_discontinuation: 0,
};

/**
 * Initial state
 */
const initialState: AssessmentState = {
  assessmentData: defaultAssessmentData,
  assessmentResult: null,
  isLoading: false,
  error: null,
  lastAssessmentTime: null,
  isDirty: false,
};

/**
 * Assessment Provider Component
 *
 * Wraps the app to provide assessment context to all screens.
 *
 * Usage in App.tsx:
 *   <AssessmentProvider>
 *     <NavigationContainer>
 *       ...
 *     </NavigationContainer>
 *   </AssessmentProvider>
 */
export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AssessmentState>(initialState);

  // Assessment data management
  const setAssessmentData = (data: AssessmentData) => {
    setState((prev) => ({
      ...prev,
      assessmentData: data,
      isDirty: true,
    }));
  };

  const updateAssessmentData = (data: Partial<AssessmentData>) => {
    setState((prev) => ({
      ...prev,
      assessmentData: prev.assessmentData
        ? { ...prev.assessmentData, ...data }
        : { ...defaultAssessmentData, ...data },
      isDirty: true,
    }));
  };

  const clearAssessmentData = () => {
    setState((prev) => ({
      ...prev,
      assessmentData: { ...defaultAssessmentData },
      isDirty: false,
    }));
  };

  // Assessment result management
  const setAssessmentResult = (result: RiskAssessmentResult) => {
    setState((prev) => ({
      ...prev,
      assessmentResult: result,
      lastAssessmentTime: new Date().toISOString(),
      isDirty: false,
      isLoading: false,
    }));
  };

  const clearAssessmentResult = () => {
    setState((prev) => ({
      ...prev,
      assessmentResult: null,
      lastAssessmentTime: null,
    }));
  };

  // Loading state
  const setIsLoading = (loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  };

  // Error management
  const setError = (error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  };

  const clearError = () => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  };

  // Dirty flag management
  const markDirty = () => {
    setState((prev) => ({
      ...prev,
      isDirty: true,
    }));
  };

  const markClean = () => {
    setState((prev) => ({
      ...prev,
      isDirty: false,
    }));
  };

  // Validation
  const isAssessmentValid = (): boolean => {
    if (!state.assessmentData) return false;

    // Check that all required fields are present and valid
    const requiredFields: (keyof AssessmentData)[] = [
      'age',
      'education',
      'working',
      'urban',
      'partner_object',
      'partner_approval',
      'fertility_want',
      'fertility_soon',
      'parity',
      'son_preference',
      'method_duration_months',
      'switching_last_12m',
      'discontinuation_reason_satisfied',
      'discontinuation_reason_side_effects',
      'discontinuation_reason_other',
      'current_method',
      'num_previous_methods',
      'counseling_received',
      'satisfaction_score',
      'adherence_score',
      'accessibility_score',
      'relationship_status',
      'previous_discontinuation',
    ];

    for (const field of requiredFields) {
      const value = state.assessmentData[field];
      if (value === null || value === undefined) {
        return false;
      }
    }

    // Validate age range (15-55 recommended)
    if (state.assessmentData.age < 15 || state.assessmentData.age > 55) {
      return false;
    }

    return true;
  };

  // Reset everything
  const reset = () => {
    setState(initialState);
  };

  const value: AssessmentContextType = {
    ...state,
    setAssessmentData,
    updateAssessmentData,
    clearAssessmentData,
    setAssessmentResult,
    clearAssessmentResult,
    setIsLoading,
    setError,
    clearError,
    markDirty,
    markClean,
    reset,
    isAssessmentValid,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to use the Assessment Context
 *
 * Usage:
 *   const { assessment, updateAssessment } = useAssessment();
 *
 * @throws Error if used outside AssessmentProvider
 */
export const useAssessment = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);

  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }

  return context;
};

/**
 * Hook to get only assessment data
 */
export const useAssessmentData = (): AssessmentData | null => {
  const { assessmentData } = useAssessment();
  return assessmentData;
};

/**
 * Hook to get only assessment result
 */
export const useAssessmentResult = (): RiskAssessmentResult | null => {
  const { assessmentResult } = useAssessment();
  return assessmentResult;
};

/**
 * Hook to check if assessment is valid
 */
export const useIsAssessmentValid = (): boolean => {
  const { isAssessmentValid } = useAssessment();
  return isAssessmentValid();
};

/**
 * Hook to check if assessment is loading
 */
export const useIsAssessmentLoading = (): boolean => {
  const { isLoading } = useAssessment();
  return isLoading;
};

/**
 * Hook to get assessment error
 */
export const useAssessmentError = (): string | null => {
  const { error } = useAssessment();
  return error;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AssessmentContext;
