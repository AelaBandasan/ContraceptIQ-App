# High-Recall Discontinuation Risk Model

Concise documentation for the current high-recall model that flags current contraceptive users at risk of discontinuing.

---

## 1) Overview

- **Population:** Current contraceptive users (`CURRENT_USE_TYPE`).
- **Target:** `HIGH_RISK_DISCONTINUE` built **only** from intention-to-continue signals.
- **Model family:** Weighted XGBoost (`xgb_high_recall`) + weighted Decision Tree (`dt_high_recall`) combined via an **upgrade-only hybrid rule** to maximize recall on class 1.
- **Objective:** High recall for high-risk users; precision is allowed to drop.

## 2) Inputs

**Population filter**

- Keep records where `CURRENT_USE_TYPE` indicates a current user (codes/labels like `"3"`, `"Current user"`).
- Exclude non-users.

**Feature set (predictors)**

- Demographic: `AGE`, `REGION`, `EDUC_LEVEL`, `RELIGION`, `ETHNICITY`, `MARITAL_STATUS`, `RESIDING_WITH_PARTNER`, `HOUSEHOLD_HEAD_SEX`, `OCCUPATION`, `HUSBANDS_EDUC`, `HUSBAND_AGE`, `PARTNER_EDUC`, `SMOKE_CIGAR`.
- Fertility: `PARITY`, `DESIRE_FOR_MORE_CHILDREN`, `WANT_LAST_CHILD`, `WANT_LAST_PREGNANCY`.
- Method/history: `CONTRACEPTIVE_METHOD`, `MONTH_USE_CURRENT_METHOD`, `PATTERN_USE`, `TOLD_ABT_SIDE_EFFECTS`, `LAST_SOURCE_TYPE`, `LAST_METHOD_DISCONTINUED`, `REASON_DISCONTINUED`, `HSBND_DESIRE_FOR_MORE_CHILDREN`.

**Excluded to avoid leakage**

- `CONTRACEPTIVE_USE_AND_INTENTION`, `INTENTION_USE`, `HIGH_RISK_DISCONTINUE` (the label).

## 3) Target construction (intention-only)

- Start from current users.
- High-risk (1) if intention signals include "using but intends to stop" or "unsure" or `INTENTION_USE` indicates stop/no intention/undecided.
- Low-risk (0) if intention signals say "using and intends to continue" or `INTENTION_USE` indicates continue/use.
- Drop rows with ambiguous or missing intention info.
- Contraceptive history is **not** used to define the label; it is only a predictor.

## 4) Model architecture (high recall)

- **XGBoost high-recall (`xgb_high_recall`):** ~300 trees, depth ~5, lr ~0.05, subsample/colsample ~0.8, `scale_pos_weight` boosted (~1.5x imbalance ratio) to emphasize class 1.
- **Decision Tree high-recall (`dt_high_recall`):** depth ~6, `min_samples_leaf` ~20, `class_weight={0:1, 1:3}` to favor class 1.
- **Hybrid rule (upgrade-only):**
  1.  Get `P(y=1)` from XGBoost.
  2.  Base label: 1 if `P>=THRESH`, else 0.
  3.  If low-confidence (|P-THRESH| < `CONF_MARGIN`) **and** DT predicts 1, upgrade to 1.
  4.  Never downgrade a positive.

## 5) Threshold and recall progression

- Default threshold 0.50 (baseline) → lowered to **`THRESH_V3 = 0.15`** for high recall.
- Confidence band **`CONF_MARGIN_V3 = 0.20`** defines when DT can upgrade 0 → 1.
- Effect: more positives predicted, higher recall, expected precision drop.

## 6) Performance snapshot (Hybrid v3, test set of 641)

- Class 1: Recall 87.8% (36/41), Precision 24.8%, F1 0.387.
- Class 0: Precision 99.0%, Recall 81.8%, F1 0.896.
- Overall: Accuracy 82.2%, Macro recall 84.8%, Macro F1 0.642.
- Interpretation: Meets the ≥85% recall goal; trades precision (more false positives: 109/600 low-risk flagged).

## 7) Next steps to productionize

- **Tune hyperparameters:** Grid around depth/learning rate/`scale_pos_weight` (XGB) and depth/leaf/`class_weight` (DT) with stratified CV and recall-focused objective (e.g., F2).
- **Tune thresholds:** Sweep `(THRESH, CONF_MARGIN)` around (0.15, 0.20); monitor recall, precision, and number flagged high-risk.
- **Robustness/fairness:** Validate across folds and subgroups (age, region, education, etc.); address gaps.
- **Interpretability:** Inspect feature importance; review TP/FN/FP cases with domain experts.
- **Calibration:** Check score calibration; consider Platt or isotonic if needed; define risk tiers.
- **Label sensitivity:** Test alternative intent mappings to ensure stability of rankings.
- **Deployment plan:** Finalize feature schema, hyperparameters, thresholds; produce a model card; design interfaces and monitoring.
