# SHAP Feature Importance: V4 Implementation Summary

This document outlines the implementation of dynamic feature importance (SHAP) for the ContraceptIQ-App (V4), replacing previously hardcoded "Key Factors" in the risk assessment results.

## Overview
The goal was to provide data-driven explanations for why a patient is predicted to be at LOW or HIGH risk of contraception discontinuation. This was achieved by calculating global feature importance using SHAP values from the XGBoost model and integrating them into the mobile app's front-end.

## Technical Implementation

### 1. Data Generation (Python/ML)
- **Dependency**: Installed `shap` library in the local Python environment.
- **Runner Script**: Created `machine-learning/src/preprocessing/feature_importance_runner_v4.py`.
    - Pointed to V4 model (`xgb_high_recall.joblib`) and V2 processed data.
    - Configured to output V4-specific artifacts.
- **Execution**: Ran the SHAP explainer on a sampled dataset to calculate Mean Absolute SHAP values for each One-Hot Encoded (OHE) feature.
- **Artifact**: Generated `feature_importance_v4_shap_values.csv`.

### 2. Asset Conversion
- **JSON Transformation**: Converted the CSV data into a key-value JSON mapping (`risk_factors_v4.json`).
- **Mapping Strategy**: Retained OHE feature names (e.g., `cat__PATTERN_USE_Consistent`) as keys to allow direct lookup from the mobile app's feature encoder.
- **Destination**: Saved to `mobile-app/assets/models/risk_factors_v4.json`.

### 3. Mobile Integration
- **Dynamic Logic**: Modified `RiskAssessmentCard.tsx`'s `generateKeyFactors` function.
    - **Active Feature Identification**: The function now looks up the SHAP importance of the specific values selected by the patient in the current assessment.
    - **Ranking**: It sorts the active features by their global SHAP importance.
    - **Humanization**: Maps internal feature IDs (like `num__PARITY` or `cat__SMOKE_CIGAR_Yes`) to student-friendly labels (e.g., "Number of children" or "Smoking habits").
- **UI Update**: The "Key Factors" section now displays the top 3 most impactful factors specific to that patient's health profile.

### 4. Patient History & Navigation
- **Decluttered History**: Refactored `ObHistoryScreen.tsx` to remove obsolete V3 fields (Region, Marital Status, etc.) and ensure V4-specific data (Partner Age, HH Head Sex, etc.) is displayed accurately.
- **MEC Visibility**: Integrated Medical Eligibility Criteria (MEC) conditions directly into the history cards.
- **Improved Flow**: Updated `DoctorDashboardScreen.tsx` such that "Recent Assessments" redirect to the **History** tab with **Auto-Expansion** of the selected record, preventing accidental re-editing of saved consultations.

## Summary of Files Created/Modified
- `machine-learning/src/preprocessing/feature_importance_runner_v4.py` (New)
- `mobile-app/assets/models/risk_factors_v4.json` (New)
- `mobile-app/src/components/RiskAssessmentCard.tsx` (Integrated SHAP)
- `mobile-app/src/screens/ObSide/ObHistoryScreen.tsx` (Refactored)
- `mobile-app/src/screens/ObSide/DoctorDashboardScreen.tsx` (Navigation flow)
