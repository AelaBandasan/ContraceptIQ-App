/**
 * Assessment Context
 *
 * Provides global state management for discontinuation risk assessments.
 * Allows sharing assessment data and results across screens without prop drilling.
 *
 * Usage:
 *   const { assessment, updateAssessment } = useAssessment();
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import { UserAssessmentData } from "../services/discontinuationRiskService";

// ============================================================================
// TYPES
// ============================================================================

/**
 * User assessment data - contains all 26 required features for ML prediction
 */
export type AssessmentData = UserAssessmentData;

/**
 * Risk assessment result from ML model
 */
export interface RiskAssessmentResult {
  riskLevel: "LOW" | "HIGH";
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

const AssessmentContext = createContext<AssessmentContextType | undefined>(
  undefined,
);

/**
 * Initial assessment data with default values
 */
const defaultAssessmentData: UserAssessmentData = {
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
export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
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
      "AGE", "REGION", "EDUC_LEVEL", "RELIGION", "ETHNICITY", 
      "MARITAL_STATUS", "RESIDING_WITH_PARTNER", "HOUSEHOLD_HEAD_SEX",
      "OCCUPATION", "HUSBANDS_EDUC", "HUSBAND_AGE", "PARTNER_EDUC",
      "SMOKE_CIGAR", "PARITY", "DESIRE_FOR_MORE_CHILDREN",
      "WANT_LAST_CHILD", "WANT_LAST_PREGNANCY", "CONTRACEPTIVE_METHOD",
      "MONTH_USE_CURRENT_METHOD", "PATTERN_USE", "TOLD_ABT_SIDE_EFFECTS",
      "LAST_SOURCE_TYPE", "LAST_METHOD_DISCONTINUED", "REASON_DISCONTINUED",
      "HSBND_DESIRE_FOR_MORE_CHILDREN"
    ];

    for (const field of requiredFields) {
      const value = state.assessmentData[field];
      if (value === null || value === undefined) {
        return false;
      }
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
    throw new Error("useAssessment must be used within an AssessmentProvider");
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
