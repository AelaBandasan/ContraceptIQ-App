# Project Progress Report & Changelog
**Date:** February 2, 2026
**Status:** Feature Complete (Ready for Testing)
Progress by Shan

---

## 1. Backend Connectivity & Data Storage
**Goal:** Enable reliable data transfer between the Guest App and Doctor App.

-   **[FIXED] Network Connectivity**:
    -   Configured Flask to run on `0.0.0.0` to accept external connections.
    -   Updated frontend API calls to use the correct standardized URL (avoiding localhost issues on physical devices/emulators).
-   **[NEW] Patient Intake API**:SS
    -   **File**: `backend/app.py`
    -   **Endpoint**: `POST /api/v1/patient-intake`
        -   Accepts patient demographic and health data.
        -   Generates a unique **6-character short code** (e.g., "ABC-123").
        -   Stores data in an in-memory database (dictionary).
    -   **Endpoint**: `GET /api/v1/patient-intake/<code_id>`
        -   Retrieves patient data using the short code.

## 2. Core Logic: WHO MEC & Preferences
**Goal:** Implement medical eligibility criteria and user preference matching.

-   **[NEW] WHO MEC Service (EXPERIMENTAL)**:
    -   **Current Status**: **NOT YET RELIABLE**.
    -   **File**: `src/services/mecService.ts`
    -   **Function**: `calculateMEC({ age, smoking })`
    -   **Note**: While basic structure is in place, the medical logic covers only a subset of rules. **DO NOT USE FOR CLINICAL DECISIONS YET.**
    -   **Logic**: Implements WHO MEC 5th Edition rules.
        -   *Example*: Smokers >35y are Category 3/4 for CHC methods.
        -   *Example*: Adolescents <18y are Category 2 for IUDs.
-   **[NEW] Preference Matching Engine**:
    -   **File**: `src/services/mecService.ts`
    -   **Logic**: Maps user preferences (e.g., "Non-hormonal", "Long-term") to distinct method attributes.
    -   **Scoring**: Calculates a "Match Score" (percentage) for how well a method fits the user's lifestyle.

## 3. Guest App Workflow (Patient Intake)
**Goal:** Streamline the user journey from "What's Right For Me" to "Consultation".

-   **[NEW] Service Layer**:
    -   **File**: `src/services/discontinuationRiskService.ts`
    -   **Methods**: Added `submitPatientIntake` and `getPatientByCode` to handle API communication.
-   **[NEW] Guest Assessment Screen**:
    -   **File**: `src/screens/GuestAssessment.tsx`
    -   **Feature**: A full intake form collecting Age, Medical History, and Preferences. Use this to conduct Phase 1 data collection.
-   **[NEW] Consultation Code Screen**:
    -   **File**: `src/screens/ConsultationCodeScreen.tsx`
    -   **Feature**: Displays the generated 6-char code to the user.
    -   **Interaction**: Includes "Copy to Clipboard" and instructions for the doctor.
-   **[MODIFIED] Recommendation Flow**:
    -   **File**: `src/screens/Recommendation.tsx`
    -   **Change**: Removed obstructive Modals. Now navigates directly to results.
    -   **File**: `src/screens/ViewRecom.tsx` (Recommendations Display)
        -   **Sorting**: Integrated **Dual-Layer Sorting**:
            1.  **Safety First**: Methods sorted by MEC Category (1 → 4).
            2.  **Preference Match**: Methods re-ranked by Match Score (High → Low).
        -   **Visuals**: Added Color-coded MEC Badges (Green/Yellow/Orange/Red) and "👍 % Match" Badges.
        -   **Action**: Added "Consult with Doctor" button to initiate the Handoff.

## 4. Doctor / OB Professional Workflow
**Goal:** Enable seamless patient onboarding via code import.

-   **[MODIFIED] OB Home Screen**:
    -   **File**: `src/screens/ObSide/ObHomeScreen.tsx`
    -   **Feature**: Added **"Import Patient via Code"** button.
    -   **Interaction**: specific modal to input the 6-char code.
-   **[MODIFIED] OB Assessment**:
    -   **File**: `src/screens/ObSide/ObAssessment.tsx`
    -   **Feature**: Pre-fills the assessment form with data fetched from the backend.
    -   **Logic**: Filters the Contraceptive Method Dropdown to exclude contraindicated (Category 4) methods based on the imported patient's profile.

## 5. UI/UX Improvements & Bug Fixes
-   **[FIXED] Whatsrightforme.tsx**:
    -   Fixed "Continue" button bug where the Disclaimer Modal would not close before navigating.
-   **[FIXED] Navigation Types**:
    -   Updated `src/types/navigation.ts` to support passing `mecResults` and `preFilledData` safely.
-   **[FIXED] Navigation Routing**:
    -   Fixed crash in `ConsultationCodeScreen` by correctly routing "Done" to `MainDrawer` instead of the non-existent direct `HomeScreen`.
-   **[POLISH] Visuals**:
    -   Enhanced `ViewRecom.tsx` with clear, distinct badges for safety vs. preference.

---

## Technical Summary of Files Touched
1.  `backend/app.py`
2.  `src/services/mecService.ts` (New)
3.  `src/services/discontinuationRiskService.ts`
4.  `src/screens/ConsultationCodeScreen.tsx` (New)
5.  `src/screens/GuestAssessment.tsx` (New)
6.  `src/screens/Recommendation.tsx`
7.  `src/screens/ViewRecom.tsx`
8.  `src/screens/Whatsrightforme.tsx`
9.  `src/screens/ObSide/ObHomeScreen.tsx`
10. `src/screens/ObSide/ObAssessment.tsx`
11. `src/types/navigation.ts`
