# Feature Reduction Experiment — Implementation Plan

**Goal:** Determine the most aggressive subset of input features that keeps the
hybrid XGBoost + Decision Tree model's recall on `HIGH_RISK_DISCONTINUE`
(class 1) strictly above **87%**.

**Constraint:** No existing files are modified. All new code lives under
`machine-learning/experiments/feature-reduction/`.

---

## 1. Background

The current production model (v3) is trained on **25 features** and achieves:

| Metric         | Value   |
|----------------|---------|
| Recall (cls 1) | 87.80%  |
| Precision      | 24.83%  |
| F1             | 38.71%  |
| ROC-AUC        | ~0.93   |

Permutation importance analysis (see
`machine-learning/src/models/models_high_risk_v3/feature_importance_v3_permutation_grouped.csv`)
shows that several features have **zero or negative** impact on ROC-AUC,
meaning they are adding noise rather than signal.

The mobile app currently asks users **21 questions** mapping to those 25
features. Reducing the feature set shrinks the form without harming — and
potentially improving — model performance.

---

## 2. Candidate Feature Sets

Three candidate sets are defined and tested in addition to the full baseline.

### Full Baseline (25 features)
All columns in `discontinuation_design1_data_v2.pkl`. Used to reproduce the
v3 recall baseline using the **existing trained `.joblib` models** (no retrain).
This is the reference point.

---

### Reduced-A — Drop Zero-Importance Features (23 features)
Remove the two features with exactly `0.0` permutation importance:

| Dropped Feature       | Reason                 |
|-----------------------|------------------------|
| `TOLD_ABT_SIDE_EFFECTS` | importance_mean = 0.0 |
| `LAST_SOURCE_TYPE`      | importance_mean = 0.0 |

Already defaulted to `0` in guest assessments. Safe, low-risk drop.

---

### Reduced-B — Drop All Negative + Zero Importance Features (12 features)
Keep only features with **strictly positive** permutation importance:

**Features Kept (12):**
```
AGE, REGION, EDUC_LEVEL (borderline), RELIGION, MARITAL_STATUS,
RESIDING_WITH_PARTNER, SMOKE_CIGAR, HUSBANDS_EDUC, HUSBAND_AGE,
PARITY, PATTERN_USE, CONTRACEPTIVE_METHOD
```

**Features Dropped (13):**
```
ETHNICITY, HOUSEHOLD_HEAD_SEX, OCCUPATION, PARTNER_EDUC,
DESIRE_FOR_MORE_CHILDREN, WANT_LAST_CHILD, WANT_LAST_PREGNANCY,
LAST_METHOD_DISCONTINUED, MONTH_USE_CURRENT_METHOD,
HSBND_DESIRE_FOR_MORE_CHILDREN, TOLD_ABT_SIDE_EFFECTS,
LAST_SOURCE_TYPE, REASON_DISCONTINUED
```

> Note: `REASON_DISCONTINUED` has a very small positive permutation mean
> but specific SHAP values (e.g. "Partner disapproval") are impactful.
> It is intentionally dropped here and kept in Reduced-C to test the
> difference.

---

### Reduced-C — Top Positive Features + Clinical Signals (10 features)
Keeps the 6 strongest features by permutation importance plus 4 features
that show meaningful per-category SHAP values despite low grouped permutation:

**Features Kept (10):**
```
REGION, CONTRACEPTIVE_METHOD, RELIGION, HUSBAND_AGE,
PARITY, AGE,
REASON_DISCONTINUED, HUSBANDS_EDUC, MARITAL_STATUS, PATTERN_USE
```

**Features Dropped (15):**
```
EDUC_LEVEL, ETHNICITY, RESIDING_WITH_PARTNER, HOUSEHOLD_HEAD_SEX,
OCCUPATION, PARTNER_EDUC, SMOKE_CIGAR, DESIRE_FOR_MORE_CHILDREN,
WANT_LAST_CHILD, WANT_LAST_PREGNANCY, MONTH_USE_CURRENT_METHOD,
TOLD_ABT_SIDE_EFFECTS, LAST_SOURCE_TYPE, LAST_METHOD_DISCONTINUED,
HSBND_DESIRE_FOR_MORE_CHILDREN
```

---

## 3. File Structure

```
machine-learning/experiments/feature-reduction/
├── __init__.py               Empty package marker
├── config.py                 All constants: paths, feature sets, hyperparams, thresholds
├── data_loader.py            Load + subset train/test data
├── trainer.py                Build and fit XGBoost + DT sklearn pipelines
├── evaluator.py              Hybrid inference logic, metric computation, threshold sweep
├── reporter.py               Format comparison table, save report + config JSON
├── run_experiment.py         CLI entry point — orchestrates all modules
└── results/
    ├── feature_reduction_report.txt    Auto-generated on run
    └── feature_reduction_config.json   Auto-generated on run
```

---

## 4. Module Responsibilities

### `config.py`
- Resolves all file paths using `pathlib.Path(__file__).resolve()` — no CWD
  assumptions.
- Defines `FEATURE_SETS` dict mapping set name → list of column names.
- Defines `XGB_PARAMS`, `DT_PARAMS` dicts matching the v3 hyperparameters
  exactly (except `scale_pos_weight` which is computed at train time).
- Defines `THRESHOLD_SWEEP`, `CONF_MARGIN`, `RECALL_TARGET`.

### `data_loader.py`
- `load_data(feature_cols: list[str]) -> tuple`
  Loads the v2 data pickle, subsets columns to `feature_cols`, returns
  `(X_train, X_test, y_train, y_test)`.
- Handles both dict and 4-tuple pickle formats.
- Validates requested columns exist; raises `ValueError` with a clear message
  if any are missing.

### `trainer.py`
- `build_xgb_pipeline(X_train, y_train) -> Pipeline`
  Calls `build_preprocessor` from the project's existing
  `src/preprocessing/preprocessor.py`. Constructs XGBoost with v3 params
  and auto-computed `scale_pos_weight = n_neg / n_pos`.
- `build_dt_pipeline(X_train, y_train) -> Pipeline`
  Same DT params as v3: `max_depth=6`, `class_weight={0:1.0, 1:3.0}`,
  `min_samples_leaf=20`, `random_state=42`.
- Both functions return unfitted pipelines; fitting is done in `run_experiment.py`
  so each step is explicit and traceable.

### `evaluator.py`
- `run_hybrid(xgb_pipeline, dt_pipeline, X_test, threshold, conf_margin)`
  → `(np.ndarray predictions, np.ndarray probabilities)`
  Encapsulates the upgrade-only hybrid rule.
- `compute_metrics(y_test, predictions, probabilities) -> dict`
  Returns `recall`, `precision`, `f1`, `roc_auc`, `confusion_matrix`.
- `threshold_sweep(xgb_pipeline, dt_pipeline, X_test, y_test, thresholds, conf_margin)`
  → `list[dict]`
  Iterates over `THRESHOLD_SWEEP`, runs `run_hybrid` + `compute_metrics` for
  each threshold. Marks which results meet `RECALL_TARGET`. Returns list
  sorted by recall descending.

### `reporter.py`
- `build_report(all_results: dict) -> str`
  Builds a multi-section text report:
  1. Header with timestamp and recall target.
  2. Summary table: one row per (feature set × best threshold), columns =
     recall, precision, F1, ROC-AUC, n_features, meets_target.
  3. Per-set detail block: full threshold sweep table.
  4. Recommendation: the most feature-aggressive set that meets >87% recall.
- `save_report(report_str: str, path: Path) -> None`
- `save_config(best_result: dict, path: Path) -> None`
  Writes JSON with: `feature_set_name`, `features`, `n_features`,
  `best_threshold`, `conf_margin`, `recall`, `precision`, `f1`, `roc_auc`.

### `run_experiment.py`
- Adds `src/` to `sys.path` once at the top (only place this is needed).
- `main()` function with `if __name__ == "__main__"` guard.
- Flow:
  ```
  for each (set_name, feature_cols) in config.FEATURE_SETS:
      X_train, X_test, y_train, y_test = data_loader.load_data(feature_cols)
      xgb_pipe = trainer.build_xgb_pipeline(X_train, y_train)
      dt_pipe  = trainer.build_dt_pipeline(X_train, y_train)
      xgb_pipe.fit(X_train, y_train)
      dt_pipe.fit(X_train, y_train)
      sweep_results = evaluator.threshold_sweep(...)
      all_results[set_name] = {features, sweep_results}

  report = reporter.build_report(all_results)
  print(report)
  reporter.save_report(report, results_dir / "feature_reduction_report.txt")
  reporter.save_config(best, results_dir / "feature_reduction_config.json")
  ```
- The **baseline** (full 25-feature set) uses the **existing v3 `.joblib`
  models** loaded from disk rather than retraining, ensuring a true apples-to-
  apples comparison. All reduced sets are freshly retrained.

---

## 5. Hyperparameter Reference (v3 Match)

### XGBoost
| Parameter           | Value                          |
|---------------------|--------------------------------|
| `n_estimators`      | 300                            |
| `max_depth`         | 5                              |
| `learning_rate`     | 0.05                           |
| `subsample`         | 0.8                            |
| `colsample_bytree`  | 0.8                            |
| `scale_pos_weight`  | `n_neg / n_pos` (auto)         |
| `eval_metric`       | `logloss`                      |
| `tree_method`       | `hist`                         |
| `random_state`      | 42                             |

### Decision Tree
| Parameter          | Value               |
|--------------------|---------------------|
| `max_depth`        | 6                   |
| `class_weight`     | `{0: 1.0, 1: 3.0}`  |
| `min_samples_leaf` | 20                  |
| `criterion`        | `gini`              |
| `random_state`     | 42                  |

### Hybrid Inference
| Parameter      | Value                        |
|----------------|------------------------------|
| `conf_margin`  | 0.20 (fixed)                 |
| `threshold`    | swept: 0.10, 0.12, 0.15, 0.18, 0.20 |
| Rule           | upgrade-only (XGB=0 → 1 if low-confidence AND DT=1) |

---

## 6. Success Criteria

A reduced feature set **passes** if, at its best threshold from the sweep:

- Recall (class 1) > **87%**
- The set has **fewer features** than the baseline (25)

The experiment recommends the set with the **fewest features** among all
passing sets, along with its optimal threshold. If multiple sets tie on
feature count, the one with the highest recall wins.

---

## 7. How to Run

```bash
# From the project root (C:\Workspace\01_Dev\Projects\ContraceptIQ-App)
python machine-learning/experiments/feature-reduction/run_experiment.py
```

Output is printed to stdout in full and saved to:
```
machine-learning/experiments/feature-reduction/results/feature_reduction_report.txt
machine-learning/experiments/feature-reduction/results/feature_reduction_config.json
```

---

## 8. Files Modified

**None.** All code is new, created under:
```
machine-learning/experiments/feature-reduction/
machine-learning/docs/feature-reduction/
```
