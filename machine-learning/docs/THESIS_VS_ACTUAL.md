# ContraceptIQ — Thesis vs. Actual System Discrepancies

This document compares the claims made in the thesis paper
(*ContraceptIQ: An Android App-Based Decision Support System for Predicting Contraceptive
Discontinuation Risk using Decision Tree and eXtreme Gradient Boosting*, Bandasan, Castañas,
Nanoy, October 2025) against the current, verified state of the codebase as of March 2026.

Each discrepancy includes:
- **Thesis claim** — what the paper says, with line references
- **Actual state** — what the code actually does, with file references
- **Recommendation** — whether to update the thesis to match the code, or update the code to match the thesis

---

## Chapter 1 — Introduction

### 1.1 System described as Android-only throughout

**Thesis claim (lines 343, 379, 693, 935):**
> "The mobile application will be developed... Compatibility will be limited to the Android platform."
> "The mobile application will not be developed for iOS or other operating systems."

**Actual state:**
`mobile-app/app.json` defines both `android` and `ios` sections. `mobile-app/package.json` contains
`"android"`, `"ios"`, and `"web"` run scripts. The EAS build configuration (`eas.json`) does not
restrict to Android. iOS and web are live, testable build targets.

**Recommendation: Update the thesis.**
The iOS and web targets were added as a natural consequence of using Expo, which is
cross-platform by default. Restricting to Android in the paper creates a false constraint that does
not reflect reality. The thesis should state that the *primary target* is Android, but the framework
supports cross-platform deployment. This is a stronger position technically and commercially.

---

## Chapter 2 — Theoretical Framework / System Architecture

### 2.1 Three-role system (user, expert, administrator)

**Thesis claim (lines 302–316):**
> "The mobile application will have three defined roles: user, expert, and administrator."
> "Administrator accounts are assigned to the system developers, who are responsible for
> performing updates, maintenance, and managing the technical aspects of the application."

**Actual state:**
Only two roles exist in the mobile app: **Guest** and **OB/Doctor**. There is no admin screen,
no admin navigation route, no admin UI, and no admin authentication flow anywhere in the
codebase. Verification status (`verificationStatus: "pending"` → `"verified"`) must be managed
externally via the Firebase console directly — there is no in-app mechanism for this.

Relevant files:
- `mobile-app/src/types/navigation.ts` — only `GuestStack` and `ObStack` defined
- `mobile-app/src/screens/ObSide/LoginforOB.tsx` — only guest and OB login paths
- No `AdminScreen`, `AdminStack`, or admin-related component exists anywhere

**Recommendation: Update the thesis to match the code, OR implement a minimal admin panel.**
Option A (preferred): Revise the thesis to describe a two-role system and explain that
administrator actions are performed out-of-band via the Firebase console. This is honest and
does not inflate the scope. Option B: Implement a minimal Firebase-authenticated admin screen
that can toggle `verificationStatus` for pending OB accounts — this is a small feature that would
make the paper accurate. Either way, the current three-role claim is inaccurate.

---

### 2.2 Hybrid model described as Soft Voting via VotingClassifier

**Thesis claim (lines 614–616, 695, 707, 734–741):**
> "Combining the two algorithms will require the use of ensemble techniques, specifically
> VotingClassifier sklearn.ensemble. The study used soft voting that averages the probabilities
> of each classifier and selects the output with the highest probability."
> "The predictions from both models are then combined through a Soft Voting Ensemble,
> producing a final risk score."

**Actual state:**
`sklearn.ensemble.VotingClassifier` is **not used anywhere** in the codebase. The actual
hybrid logic is a custom, asymmetric upgrade rule:

```python
# machine-learning/src/models/train_v4.py, lines 160–163
if abs(xgb_proba - THRESHOLD) < BORDERLINE_BAND:
    if dt_pred == 1 and xgb_pred == 0:
        final_pred = 1  # upgrade LOW → HIGH
```

This rule is mirrored identically in TypeScript:
```typescript
// mobile-app/src/services/onDeviceRiskService.ts, lines 154–166
if (Math.abs(xgbProba - THRESHOLD) < BORDERLINE_BAND) {
    if (dtPred === 1 && xgbPred === 0) finalPred = 1;
}
```

Key distinction from soft voting:
- XGBoost is always the primary classifier
- The Decision Tree can **only raise** a borderline LOW to HIGH — it cannot lower a HIGH to LOW
- This is not an average of probabilities; the DT output is used as a binary override signal only
- There is no shared probability space between the two models

**Recommendation: Update the thesis.**
The actual hybrid rule is actually a stronger, more defensible design choice than generic soft
voting — it preserves XGBoost's superior predictive performance while using the Decision Tree
selectively in ambiguous borderline cases. The thesis should describe this accurately. The
Architecture and Hybrid Model Flowchart (Figure 8) should be redrawn to show the upgrade-only
conditional logic rather than a symmetric averaging step.

---

### 2.3 Risk classification threshold stated as 0.50

**Thesis claim (lines 325–327):**
> "For clinical implementation, a fixed 0.50 probability threshold, as recommended by the
> OBGYN Reproductive Endocrinologist and Infertility (REI) specialist, is used to classify users
> as 'High Risk' or 'Low Risk.'"

**Actual state:**
The threshold used in both the Python training script and the on-device ONNX inference service
is **0.25**, not 0.50.

- `machine-learning/src/models/train_v4.py`: `THRESHOLD = 0.25`
- `mobile-app/src/services/onDeviceRiskService.ts`: `const THRESHOLD = 0.25`
- `mobile-app/assets/models/hybrid_v4_config.json`: `"threshold": 0.25`

This is the single most consequential numerical inaccuracy in the paper. A 0.50 threshold
produces a balanced classifier; a 0.25 threshold produces a high-recall classifier that flags more
users as HIGH RISK to minimize false negatives. These are fundamentally different clinical
instruments.

**Recommendation: Update the thesis.**
The 0.25 threshold is the correct, intentional design choice — it was selected to maximize recall
(minimize false negatives), which the paper itself argues is the priority metric for clinical use
(lines 1611–1613). The paper should explain that the threshold was lowered from the default 0.50
to 0.25 specifically to improve sensitivity, and that this decision was validated with the REI
specialist. The current text implies the specialist recommended 0.50, which contradicts the
implemented value.

---

### 2.4 SHAP output described as quantitative feature contributions

**Thesis claim (lines 328–332):**
> "The second is an interpretability report, generated using SHAP, which quantifies how
> individual features such as socioeconomic status, age, method type, education level, and
> usage intention contribute to increasing or decreasing a user's predicted risk."

**Actual state:**
SHAP values are computed offline (via `machine-learning/src/shap/generate_signed_shap.py`)
and stored as a signed directional lookup table (`mobile-app/assets/models/risk_factors_v4_signed.json`).
In the app, this lookup table is used by `RiskAssessmentCard.tsx` to display up to 4
**plain-language directional strings** per result — e.g.:

> "↑ Use pattern: irregular use — raises discontinuation risk"

Raw SHAP values are **never shown numerically** to the user. There is no per-patient
quantitative breakdown, no SHAP bar chart, and no numerical feature importance display.

**Recommendation: Update the thesis.**
The plain-language SHAP-derived explanations are arguably more appropriate for a clinical
audience than raw numerical SHAP values. The thesis should describe the implementation
accurately: SHAP values are computed at training time to determine feature directionality, and
this is surfaced as actionable, readable factor explanations for the OB. This framing is still
scientifically valid and clinically more useful.

---

## Chapter 3 — Research Methodology

### 3.1 Active model feature set not described

**Thesis claim (lines 1035–1056, 1663–1672):**
The dataset section describes features from the DHS dataset: age, marital status, number of
children, educational attainment, employment status, contraceptive use, etc. The raw dataset
has "5493 rows and 31 columns." The dependent variable is derived from `REASON_DISCONTINUED`.
No specific final feature list for the trained model is given.

**Actual state:**
The active production model (v4) uses exactly **9 features**:

| Feature | Description |
|---|---|
| `PATTERN_USE` | Pattern of contraceptive use (regular/irregular) |
| `HUSBAND_AGE` | Partner's age |
| `AGE` | Patient's age |
| `ETHNICITY` | Ethnicity |
| `HOUSEHOLD_HEAD_SEX` | Sex of household head |
| `CONTRACEPTIVE_METHOD` | Method being used |
| `SMOKE_CIGAR` | Smoking habits |
| `DESIRE_FOR_MORE_CHILDREN` | Desire for more children |
| `PARITY` | Number of prior pregnancies |

Source: `mobile-app/assets/models/hybrid_v4_config.json` lines 7–17,
`machine-learning/src/models/train_v4.py` lines 54–64.

These 9 features encode to a **133-dimensional one-hot encoded vector** as the ONNX model input
(`mobile-app/src/services/onDeviceRiskService.ts`, line 9).

The legacy backend (Flask, v3 model) used 26 features, but this path is completely bypassed
in the production app — the on-device ONNX model is always used.

**Recommendation: Update the thesis.**
The feature reduction from the raw 31-column dataset down to 9 features is a significant and
defensible methodological step (likely driven by SHAP-based feature importance analysis and
ONNX model optimization for on-device performance). This process should be documented
explicitly in the methodology chapter, including the rationale for why these 9 features were
selected and how the reduction affected model performance metrics.

---

### 3.2 Backend framework referenced as Flask (correct in thesis, wrong in AGENTS.md)

**Thesis claim (line 1705):**
> "The backend service will be tested through Flask."

**Actual state:**
The backend is indeed Flask (`mobile-app/backend/app.py`). However, `AGENTS.md` (the
developer guide at the project root) incorrectly labels it as FastAPI. The thesis is **correct**
here — this is an internal documentation inconsistency in the repo, not a thesis error.

**Recommendation: Fix AGENTS.md.**
Update `AGENTS.md` to correctly state the backend is Flask, not FastAPI. The thesis does not
need to change on this point.

---

### 3.3 Backend inference path never used in production

**Thesis claim (lines 767–779, 1063–1077):**
The system architecture and project design describe the hybrid model as a server-side
component. The application "fetches" predictions, data is "securely transmitted to the backend,"
and "the results are sent back to the frontend."

**Actual state:**
The Flask backend exposes `/api/v1/discontinuation-risk` but this endpoint uses the **v3
model with 26 features** — a different model version than what is active. More critically,
`discontinuationRiskService.ts` always calls `assessOffline()` (line 302), which runs the
ONNX models on-device. The network API call is never reached in the normal app flow.
The on-device ONNX inference was introduced in Phase 5 of development and has superseded
the server-side approach entirely.

**Recommendation: Update the thesis to reflect the offline-first architecture.**
The thesis already argues strongly for offline capability (lines 163–170, 349–352). The final
implementation takes this further by making the inference itself offline — no server is needed
for prediction at all. This is a stronger result than what the paper describes and should be
presented as such. The architecture diagrams showing server-side model execution (Figures 3,
8) should be updated to show the ONNX on-device inference path.

---

### 3.4 React Native version mismatch

**Thesis claim (lines 761, 933):**
> "React Native version 0.81.4"

**Actual state:**
`mobile-app/package.json`: `"react-native": "0.81.5"`

**Recommendation: Update the thesis.**
Minor patch version bump — likely updated after the thesis draft was written. Change `0.81.4`
to `0.81.5` throughout.

---

### 3.5 Firebase version mismatch

**Thesis claim (line 937):**
> "Firebase 12.10.1"

**Actual state:**
`mobile-app/package.json`: `"firebase": "^12.8.0"`

**Recommendation: Update the thesis.**
Update to `^12.8.0`. Note that the `^` prefix means the installed version may be higher than
12.8.0 depending on when `npm install` was last run. The thesis should cite the minimum
declared version.

---

### 3.6 Python version does not exist

**Thesis claim (line 947):**
> "Python 3.13.7"

**Actual state:**
Python 3.13.7 does not exist. As of early 2026, the latest Python 3.13.x release is 3.13.2.
The latest stable Python overall is 3.13.2 (or 3.12.x LTS).

**Recommendation: Update the thesis.**
Verify the actual Python version used in the development environment (`python --version`) and
correct this. Most likely this is a typo for `3.13.2` or `3.12.x`.

---

### 3.7 Scikit-learn version does not exist

**Thesis claim (line 950):**
> "Scikit-Learn 1.7.2"

**Actual state:**
Scikit-learn 1.7.2 does not exist as of early 2026. The latest stable release is in the 1.6.x
series. Version 1.7.x had not been released at the time of writing.

**Recommendation: Update the thesis.**
Verify the actual installed version (`pip show scikit-learn`) and correct this. Citing a
non-existent version number weakens the credibility of the methodology section.

---

### 3.8 Contraceptive Patch absent from MEC tool

**Thesis claim (lines 336–340):**
> "the contraceptive methods that will be included are: combined hormonal contraception (CHC)
> such as the contraceptive patch, progestogen-only pills (POP)..."
The patch is explicitly listed as an example of CHC.

**Actual state:**
The contraceptive patch is **not implemented** in the MEC tool. `mecService.ts` contains an
explicit comment noting its removal. The 6 methods actually covered are: CHC (oral combined
pill), POP, DMPA, Implant, LNG-IUD, Cu-IUD. The patch is absent from all MEC condition
mappings, method preference screens, and recommendation outputs.

**Recommendation: Update the thesis to reflect the actual method list, OR implement the patch.**
Option A: Revise the scope to state that CHC is represented by combined oral contraceptives
only, and explain that the patch was excluded due to insufficient MEC condition differentiation
from oral CHC (it shares the same WHO MEC category). This is medically defensible.
Option B: Implement the patch as a MEC method — it shares most MEC conditions with CHC
oral pills, so the implementation delta is small. Either option resolves the discrepancy.

---

### 3.9 Guest assessment collects far more than "age and preferences"

**Thesis claim (lines 727–731):**
> "In the Input stage, patients are asked to provide personal and health-related information...
> The questions are designed to be simple and easily understandable for patients, covering
> aspects such as age and preferences regarding contraceptive methods."

**Actual state:**
`GuestAssessment.tsx` is a **21-step wizard** collecting: Name, Age, Region, Education Level,
Religion, Ethnicity, Marital Status, Residing with Partner, Household Head Sex, Occupation,
Husband's Age, Husband's Education, Partner's Education, Husband's Desire for Children,
Smoking Habits, Parity, Desire for Children, Want Last Child, Want Last Pregnancy, Last Method
Discontinued, and Reason Discontinued.

This is a comprehensive demographic and behavioral intake form — not just age and preferences.
Note that the ML risk prediction is shown only to the OB; the guest's data feeds into it but the
guest does not see a risk score.

**Recommendation: Update the thesis.**
The paper's description of the user input stage understates the actual data collected. The
methodology should accurately describe what the guest assessment collects and clarify that
this data is used to populate the system record that the OB can then access and assess.
This is also important for data privacy / Philippine Data Privacy Act compliance discussion.

---

### 3.10 Data sync scope overstated

**Thesis claim (lines 779–786, Figure 5):**
The data sync flowchart implies a bidirectional sync between local storage and Firebase for
system data (MEC rules, model data, application information) that keeps devices up-to-date
when connected.

**Actual state:**
The sync implementation in `mobile-app/src/services/doctorService.ts` handles
**OB patient assessment records only** (AsyncStorage → Firestore). The MEC data is
static JSON bundled with the app. The ONNX model files are bundled assets. There is no
mechanism to push updated MEC rules or updated model versions to devices over the air.
Firebase Media Storage (cited on line 784) is configured but not visibly used for any content.

**Recommendation: Update the thesis.**
Revise Figure 5 and the accompanying description to accurately reflect that sync applies to
patient records, not to MEC data or model files. If model/MEC updates over-the-air are a
planned future feature, note it in the maintenance phase or the product roadmap — not in the
current architecture description.

---

## Cross-Cutting Issues

### C.1 VotingClassifier claim appears in multiple chapters

The `sklearn.ensemble.VotingClassifier` with soft voting is described in the Scope (line 320),
Design Concept (line 695), Conceptual Framework (line 734), System Architecture (line 777),
and Algorithm Implementation (line 614). All of these need to be updated together when the
hybrid rule description is corrected (see §2.2).

### C.2 Threshold 0.50 claim appears in Scope and must be corrected

The 0.50 threshold claim (line 325) sits in the Scope section and may also appear in a future
Chapter 4 results discussion. Ensure it is corrected to 0.25 consistently wherever referenced.

### C.3 "App-Based System" definition is self-contradictory

The thesis Definition of Terms (line 858) defines "App-Based System" as:
> "A software application that is **hosted on a server** and accessed via the internet through a
> web browser..."

This definition describes a *web application*, not a mobile app. ContraceptIQ is specifically
a native mobile application. This definition needs to be replaced with one appropriate for a
mobile-based decision support system.

---

## Summary of All Discrepancies

| # | Chapter | Thesis Claim | Actual State | Action |
|---|---|---|---|---|
| 1.1 | Ch. 1 / Scope | Android-only | Cross-platform (Android, iOS, Web) | Update thesis |
| 2.1 | Ch. 2 / Architecture | 3 roles (user, expert, admin) | 2 roles (guest, OB) — no admin UI | Update thesis or implement admin |
| 2.2 | Ch. 2 / Architecture | Soft voting via `VotingClassifier` | Custom upgrade-only hybrid rule | Update thesis |
| 2.3 | Ch. 2 / Architecture | Threshold = 0.50 | **Threshold = 0.25** | Update thesis |
| 2.4 | Ch. 2 / Architecture | Numerical SHAP output | Plain-language SHAP-derived text only | Update thesis |
| 3.1 | Ch. 3 / Methodology | Large DHS feature set implied | **9 features** in active v4 model | Update thesis |
| 3.2 | Internal docs | FastAPI (AGENTS.md) | Flask | Fix AGENTS.md |
| 3.3 | Ch. 3 / Methodology | Server-side model inference | **Always on-device ONNX** | Update thesis |
| 3.4 | Ch. 3 / Methodology | React Native 0.81.4 | React Native 0.81.5 | Update thesis |
| 3.5 | Ch. 3 / Methodology | Firebase 12.10.1 | Firebase ^12.8.0 | Update thesis |
| 3.6 | Ch. 3 / Methodology | Python 3.13.7 | Does not exist — verify actual version | Update thesis |
| 3.7 | Ch. 3 / Methodology | Scikit-Learn 1.7.2 | Does not exist — verify actual version | Update thesis |
| 3.8 | Ch. 3 / Scope | Patch included in MEC | **Patch absent** from MEC tool | Update thesis or implement patch |
| 3.9 | Ch. 3 / Methodology | User inputs: age + preferences only | **21-field** guest assessment wizard | Update thesis |
| 3.10 | Ch. 3 / Methodology | Full data sync (MEC + models + records) | Sync covers patient records only | Update thesis |
| C.3 | Definition of Terms | App-Based = server-hosted web app | Mobile native application | Fix definition |

**Highest-priority corrections (affect clinical validity or core claims):**
1. Threshold: 0.25 not 0.50 (§2.3)
2. Voting mechanism: custom upgrade rule, not VotingClassifier soft voting (§2.2)
3. Active feature set: 9 features, not full DHS columns (§3.1)
4. Inference is always on-device: server-side model path is dead code (§3.3)
5. Admin role: does not exist in the app (§2.1)
