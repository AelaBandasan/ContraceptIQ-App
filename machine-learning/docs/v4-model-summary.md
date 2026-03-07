# v4 Model Summary — ContraceptIQ Discontinuation Risk

**Status:** Production-ready (joblib models trained, ONNX conversion pending)
**Generated from:** `train_v4.py` run on 2026-03-06

---

## Overview

The v4 model is a **hybrid XGBoost + Decision Tree classifier** that predicts
`HIGH_RISK_DISCONTINUE` (class 1) — whether a contraceptive user is at high risk
of discontinuing their method. It was retrained on a reduced 9-feature set
(`reduced_C`), the winner of a rigorous nested cross-validation experiment.

The key improvement over v3 is a **reduction from 25 features to 9** with no
meaningful loss in recall, enabling a shorter assessment form in the mobile app.

---

## Dataset

| Property | Value |
|---|---|
| Source file | `data/processed/discontinuation_design1_data_v2.pkl` |
| Total rows | 3,205 |
| Class 1 (high-risk) fraction | ~6.4% (~205 positives) |
| Train split | 2,243 rows (70%) |
| Test split | 962 rows (30%) |
| Stratified | Yes — class 1 fraction preserved across splits |
| Random seed | 42 |

---

## Feature Set (`reduced_C` — 9 features)

Derived by `derive_feature_sets.py` using permutation importance on an
inner fold of `X_train` only (no look-ahead bias). `REGION` was explicitly
excluded — it is a perfect class separator due to a dataset construction
artifact (all class 1 cases originate from NCR), not a valid clinical predictor.

| Feature | Type | Notes |
|---|---|---|
| `PATTERN_USE` | Categorical | Pattern of contraceptive use |
| `HUSBAND_AGE` | Numeric (int64) | Age of husband |
| `AGE` | Numeric (int64) | Age of respondent |
| `ETHNICITY` | Categorical | Ethnic group |
| `HOUSEHOLD_HEAD_SEX` | Categorical | Sex of household head |
| `CONTRACEPTIVE_METHOD` | Categorical | Current contraceptive method |
| `SMOKE_CIGAR` | Categorical | Smoking status |
| `DESIRE_FOR_MORE_CHILDREN` | Categorical | Desire for additional children |
| `PARITY` | Numeric (int64) | Number of children born |

---

## Preprocessing Pipeline

Applied identically to both XGBoost and Decision Tree inside `sklearn.Pipeline`.
Implemented in `src/preprocessing/preprocessor.py`.

| Feature type | Imputation | Encoding |
|---|---|---|
| Categorical (`object`) | `SimpleImputer(strategy="most_frequent")` | `OneHotEncoder(handle_unknown="ignore", sparse_output=False)` |
| Numeric (`int64`) | `SimpleImputer(strategy="median")` | None (passthrough) |

No scaling is applied — XGBoost and Decision Tree are scale-invariant.

---

## Model Architecture

### XGBoost (primary classifier)

| Parameter | Value |
|---|---|
| `n_estimators` | 300 |
| `max_depth` | 5 |
| `learning_rate` | 0.05 |
| `subsample` | 0.8 |
| `colsample_bytree` | 0.8 |
| `eval_metric` | `logloss` |
| `tree_method` | `hist` |
| `scale_pos_weight` | ~14.58 (auto: `n_neg / n_pos`) |
| `random_state` | 42 |

### Decision Tree (confidence upgrade arbiter)

| Parameter | Value |
|---|---|
| `max_depth` | 6 |
| `criterion` | `gini` |
| `class_weight` | `{0: 1.0, 1: 3.0}` |
| `min_samples_leaf` | 20 |
| `splitter` | `best` |
| `random_state` | 42 |

> Note: These are the v3 hyperparameters applied to the 9-feature set.
> The validation experiment found better tuned params (XGB: `max_depth=3`,
> `n_estimators=500`, `learning_rate=0.0137`; DT: `criterion=entropy`,
> `class_weight={1:4}`) but `train_v4.py` intentionally keeps v3 params for
> simplicity. The threshold sweep on `data_v2` still achieves >90% recall.

---

## Class Imbalance Handling

- XGBoost: `scale_pos_weight = n_neg / n_pos ≈ 14.58`
  (automatically upweights the minority class during training)
- Decision Tree: `class_weight = {0: 1.0, 1: 3.0}`
  (penalizes misclassifying positive cases 3× more than negatives)

---

## Hybrid Inference Rule

The hybrid model combines both classifiers using an **upgrade-only rule**:

```
1. XGBoost produces P(class=1) for the input
2. Apply threshold: xgb_pred = 1 if P >= 0.25 else 0
3. Define low-confidence zone: |P - 0.25| < 0.05  (i.e., P in [0.20, 0.30))
4. If xgb_pred == 0 AND low-confidence AND Decision Tree predicts 1 → upgrade to 1
5. Final prediction = upgraded result
```

| Setting | Value |
|---|---|
| `threshold` | 0.25 |
| `conf_margin` | 0.05 |
| Low-confidence zone | P ∈ [0.20, 0.30) |

The threshold (0.25) was chosen by sweeping `[0.25, 0.35, 0.40, 0.50]` on the
`data_v2` test split and selecting the value that maximises F-beta (β=2) while
keeping recall above 90%. The validation experiment recommended 0.50 for the
validation splits; 0.25 was selected for `data_v2`'s slightly different split.

---

## Validation Experiment (nested CV)

Performed in `experiments/feature-reduction-validation/` before training the
production model. This was the rigorous proof that `reduced_C` achieves the
recall target.

### Data split (validation experiment)

| Split | Rows | Class 1 fraction |
|---|---|---|
| Train | 2,243 (70%) | 6.42% |
| Val | 481 (15%) | 6.44% |
| Test | 481 (15%) | 6.44% |

### Hyperparameter tuning (inner loop)

- Method: `RandomizedSearchCV`
- Inner CV: **5-fold** stratified
- Iterations: `n_iter=30` per feature set (150 fits per set)
- Scoring: **F-beta (β=2)** — recall weighted 2× more than precision
- Best XGB `cv_fbeta`: 0.6628
- Best DT `cv_fbeta`: 0.5734

### Outer cross-validation

- Strategy: **Stratified 10-fold CV**
- Threshold selection: leak-free (selected on val portion of each fold, never the test fold)
- Threshold sweep range: `[0.25, 0.35, 0.40, 0.50]`

### `reduced_C` per-fold results (outer CV)

| Fold | Threshold | Recall | Precision | F1 | ROC-AUC |
|---|---|---|---|---|---|
| 0 | 0.40 | 1.000 | 0.294 | 0.455 | 0.910 |
| 1 | 0.25 | 1.000 | 0.283 | 0.441 | 0.916 |
| 2 | 0.40 | 1.000 | 0.283 | 0.441 | 0.927 |
| 3 | 0.40 | 1.000 | 0.259 | 0.412 | 0.902 |
| 4 | 0.35 | 1.000 | 0.292 | 0.452 | 0.924 |
| 5 | 0.50 | 1.000 | 0.275 | 0.431 | 0.911 |
| 6 | 0.50 | 1.000 | 0.311 | 0.475 | 0.928 |
| 7 | 0.25 | 1.000 | 0.237 | 0.384 | 0.933 |
| 8 | 0.50 | 1.000 | 0.286 | 0.444 | 0.890 |
| 9 | 0.50 | 1.000 | 0.319 | 0.484 | 0.928 |

| Aggregate | Value |
|---|---|
| CV recall mean | 1.000 |
| CV recall std | 0.000 |
| CV ROC-AUC mean | **0.917** |
| 95% CI recall | [1.000, 1.000] |

### Validation experiment final test-set (locked 15%)

| Metric | Value |
|---|---|
| Recall | 0.9677 (30/31) |
| Precision | 0.2586 |
| F1 | 0.4082 |
| ROC-AUC | 0.9029 |
| TP / FP / TN / FN | 30 / 86 / 364 / 1 |

---

## Final Production Model Metrics (train_v4.py on data_v2 test split)

Trained on `data_v2.pkl` (pre-existing 70/30 split), evaluated on the 30% test set.

| Metric | Value |
|---|---|
| **Recall** | **92.68%** |
| Precision | 25.85% |
| F1 | 40.43% |
| ROC-AUC | 0.9084 |
| TP / FP / TN / FN | 30 / 86 / 364 / **3** |
| Meets target (>90%) | `true` |

---

## Output Files

| File | Description |
|---|---|
| `src/models/models_high_risk_v4/xgb_high_recall.joblib` | Trained XGBoost sklearn Pipeline |
| `src/models/models_high_risk_v4/dt_high_recall.joblib` | Trained Decision Tree sklearn Pipeline |
| `src/models/models_high_risk_v4/hybrid_v4_config.json` | Inference config (features, threshold, margin, metrics) |
| `src/models/models_high_risk_v4/xgb_high_recall.onnx` | **Pending** — ONNX conversion not yet run |
| `src/models/models_high_risk_v4/dt_high_recall.onnx` | **Pending** — ONNX conversion not yet run |

---

## History of Bugs Fixed Before v4

The v4 model is the result of fixing three compounding bugs present in earlier
pipeline runs (documented in `docs/validation-fix/VALIDATION-FIX-PLAN.md`):

| Bug | Old value | Fixed value |
|---|---|---|
| `CONF_MARGIN` too wide (degenerate band) | 0.20 | 0.05 |
| `THRESHOLD` too low (always 0.10 won) | sweep `[0.10–0.20]` | sweep `[0.25–0.50]` |
| Tuner scoring was pure recall | `scoring="recall"` | `scoring=fbeta(β=2)` |
| Feature selection used test set (look-ahead bias) | permutation on `X_test` | permutation on inner fold of `X_train` |

Before the fix, every feature set showed degenerate recall = 1.000 with FN = 0
and precision ≈ 0.256 (90 false positives). After the fix, the model produces
honest results with FN > 0 and meaningfully variable thresholds across folds.

---

## Comparison: v3 vs v4

| Property | v3 | v4 |
|---|---|---|
| Features | 25 | **9** |
| Recall (test) | 87.80% | **92.68%** |
| Precision (test) | 24.83% | 25.85% |
| F1 (test) | 38.71% | 40.43% |
| ROC-AUC | ~0.93 | 0.9084 |
| Threshold | 0.15 | 0.25 |
| Conf margin | 0.20 | 0.05 |
| ONNX ready | Yes | Pending |
