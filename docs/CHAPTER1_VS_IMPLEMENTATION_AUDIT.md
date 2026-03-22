# Chapter 1 vs. Actual Implementation — Audit Report

**Date:** March 22, 2026
**Scope:** All verifiable technical claims in Chapter 1 (Introduction) compared against the codebase

---

## DISCREPANCIES FOUND (Action Required)

### 1. CLAUDE.md Says "Voting Classifier" — Chapter 1 Says "Asymmetric Upgrade Rule"

| Source | Claim |
|--------|-------|
| **CLAUDE.md (line 14)** | "Decision Tree and XGBoost are combined through **voting classifier**" |
| **Chapter 1 (Scope)** | "custom **asymmetric upgrade rule** rather than ensemble voting techniques" |
| **Actual Code** (`train_hybrid.py`, `onDeviceRiskService.ts`) | XGBoost is primary; DT only upgrades borderline LOW predictions to HIGH when `|P − 0.25| < 0.05` and DT independently predicts HIGH |

**Verdict:** Chapter 1 is **CORRECT**. CLAUDE.md is **WRONG** and should be updated. The codebase does contain an old `hybrid_voting.py` (StackingClassifier) that is unused — the production model uses the asymmetric upgrade rule exclusively.

---

### 2. React Native Version: 0.81.4 vs. 0.81.5

| Source | Claim |
|--------|-------|
| **Chapter 1 (Scope)** | "React Native **0.81.4**" |
| **package.json (line 39)** | `"react-native": "0.81.5"` |

**Verdict:** **Minor inaccuracy.** The actual version is **0.81.5**, not 0.81.4. Update the paper.

---

### 3. "Android-Only" Platform Claim

| Source | Claim |
|--------|-------|
| **Chapter 1 (Scope)** | "Compatibility will be limited to the **Android** platform" |
| **app.json** | Contains iOS config (`bundleIdentifier`, `supportsTablet: true`) AND web config (favicon) |
| **package.json scripts** | Has `ios`, `web`, AND `android` build scripts |

**Verdict:** **Misleading.** While the thesis scope limits to Android, the actual codebase is configured for iOS, Android, and web. The paper should either clarify that "testing/deployment is limited to Android" (while the framework supports multiple platforms), or the extra platform configs should be removed to match the claim. For submission, recommend clarifying the wording to: "The study will focus deployment and testing on the Android platform, though the React Native framework supports cross-platform compatibility."

---

### 4. Feature List in Objective 2 Doesn't Match Actual Model Features

| Source | Claim |
|--------|-------|
| **Chapter 1 (Objective 2)** | Analyzes "users' **demographic, lifestyle, and contraceptive-related data**" |
| **Chapter 1 (Scope — SHAP section)** | "features such as **socioeconomic status**, age, method type, **education level**, and usage intention" |
| **Actual model features** (`featureEncoder.ts`) | AGE, PARITY, PATTERN_USE, HUSBAND_AGE, ETHNICITY, HOUSEHOLD_HEAD_SEX, CONTRACEPTIVE_METHOD, SMOKE_CIGAR, DESIRE_FOR_MORE_CHILDREN |

**Key gaps:**
- **"Education level"** — listed as an example SHAP feature but is **NOT in the model's 9 features**
- **"Socioeconomic status"** — listed as an example SHAP feature but is **NOT a model feature** (HOUSEHOLD_HEAD_SEX is the closest proxy, but that's not the same thing)
- **"Usage intention"** — this could map to DESIRE_FOR_MORE_CHILDREN, but that's a stretch

**Verdict:** **Inaccurate.** The SHAP interpretability section in Scope gives specific feature examples that don't exist in the model. Either remove the specific examples or replace them with actual features (e.g., "age, parity, contraceptive method, ethnicity, and usage pattern").

---

### 5. Role Terminology: "User and Expert" vs. "Guest and OB"

| Source | Claim |
|--------|-------|
| **Chapter 1 (Scope)** | "two defined roles: **user and expert**" |
| **Actual code** (`UserStartingScreen.tsx`, navigation) | Roles are **"Guest"** and **"OB"** |

**Verdict:** **Terminology mismatch.** The paper says "user and expert" but the app implements "Guest" and "OB." This isn't a functional discrepancy (the behavior matches), but the terminology should be consistent between the paper and the app's UI. Either update the paper to use "Guest and OB-GYN" or update the app's labels to "User and Expert."

---

## CLAIMS VERIFIED AS CORRECT

### ML Architecture & Evaluation
| Claim | Evidence |
|-------|----------|
| XGBoost primary + Decision Tree secondary (upgrade-only) | `train_hybrid.py` lines 54-63, `onDeviceRiskService.ts` lines 150-166 |
| Stratified 10-fold cross-validation | `cv_runner.py`: `StratifiedKFold(n_splits=10)` |
| F-beta (β=2) scorer for threshold selection | `config.py`: `FBETA_BETA = 2.0` |
| Threshold sweep 0.25–0.50 | `config.py`: `THRESHOLD_SWEEP: [0.25, 0.30, 0.35, 0.40, 0.45, 0.50]` |
| Chosen threshold = 0.25 | `train_v4.py` line 93: `THRESHOLD = 0.25` |
| 70/30 train/test split | `split.py`: `test_size=0.3, stratify=y` |
| Binary output: HIGH / LOW risk | `evaluate_v4.py`: `target_names=["LOW", "HIGH"]` |
| Reports recall, precision, F1, ROC-AUC | `evaluate_v4.py` lines 186-189 |

### Mobile App
| Claim | Evidence |
|-------|----------|
| TypeScript ~5.9.2 | `package.json` line 55: `"typescript": "~5.9.2"` |
| Offline-first architecture | `doctorService.ts`: writes AsyncStorage first, queues Firestore sync |
| Models stored locally (ONNX) | `onDeviceRiskService.ts`: loads from bundled assets via `Asset.fromModule()` |
| MEC uses stored data for conditions/preferences | `whoMecData.ts`: 164KB TypeScript constants, plus `mecConditionOutputs.json`, `mecPreferenceScores.json` |
| 6 MEC methods: Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC | `whoMecData.ts` line 5 |
| No contraceptive patch as separate MEC method | Patch mapped to "Withdrawal" in `featureEncoder.ts` (not a standalone eligible method) |
| PRC license verification for expert signup | `SignupforOB.tsx`: validates 7-digit PRC license, sets `verificationStatus: "pending"` |
| Data sync when connected | `doctorService.ts`: `flushSyncQueue()` retries on reconnect |
| Consultation code system | `ConsultationCodeScreen.tsx`: generates codes, stores in Firestore `consultations` collection |

### Scope & Delimitations
| Claim | Evidence |
|-------|----------|
| No login required for basic users | `UserStartingScreen.tsx`: "Continue as Guest" button bypasses auth |
| Expert login required | Firebase auth check gates OB tab navigation |
| No backend server for real-time analytics | Risk prediction runs entirely on-device via ONNX |
| WHO MEC 5th Edition | `whoMecData.ts` line 3: "WHO Medical Eligibility Criteria (MEC) 5th Edition (2015)" |

---

## MINOR NOTES (Not Errors, But Worth Knowing)

1. **SHAP values are stored numerically in JSON** — The thesis says "without displaying numeric SHAP values per user." The implementation stores signed SHAP values in `generate_signed_shap.py` output JSON, but presents them as directional arrows (↑/↓) rather than raw numbers. This is technically consistent with the claim, but the underlying data does contain numeric values.

2. **10-fold CV is for validation experiments, not the final production model** — The production v4 model (`train_v4.py`) trains on a single 70/30 split. The 10-fold CV was used in the feature-reduction-validation experiment to compare feature sets. The thesis implies CV is used for the final model, which is slightly misleading.

3. **"Lifestyle" data category** — The thesis groups features as "demographic, lifestyle, and contraceptive-related." SMOKE_CIGAR is the only clear "lifestyle" feature. DESIRE_FOR_MORE_CHILDREN and PATTERN_USE could be argued either way. This isn't wrong, but it overstates the lifestyle coverage.

---

## SUMMARY: 5 Discrepancies, 0 Critical Errors

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | CLAUDE.md says "voting classifier" | Medium | Update CLAUDE.md to match Chapter 1 |
| 2 | React Native 0.81.4 → actually 0.81.5 | Low | Update paper |
| 3 | "Android-only" but codebase has iOS/web | Medium | Clarify wording in paper |
| 4 | SHAP example features don't match model | High | Replace education/socioeconomic with actual features |
| 5 | "User/Expert" vs "Guest/OB" terminology | Low | Align terminology |
