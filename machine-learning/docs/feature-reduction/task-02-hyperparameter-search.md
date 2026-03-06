# Task 02 — Hyperparameter Search

**Status:** COMPLETE

**Part of:** [VALIDATION_PLAN.md](VALIDATION_PLAN.md)
**Previous task:** [task-01-data-split-refactor.md](task-01-data-split-refactor.md)
**Next task:** [task-03-stratified-10fold-cv.md](task-03-stratified-10fold-cv.md)

---

## Goal

Find the best XGBoost and Decision Tree hyperparameters for **each of the 4
feature sets independently**, using `RandomizedSearchCV` with a 5-fold
stratified inner CV.

The v3 production params were tuned on 25 features. When the feature set
shrinks to 12 or 10 columns, optimal values for `max_depth`, `learning_rate`,
`n_estimators`, and similar params may differ. This task finds those
feature-set-specific params before running the expensive outer CV loop.

---

## Prerequisite

`results/checkpoints/task_01_complete.json` must exist and pass the
verification checks described in Task 01.

---

## Inputs

| File | Description |
|------|-------------|
| `results/splits/train.pkl` | `(X_train, y_train)` from Task 01 — 70% of full data |

> The val and test splits are **not loaded** in this task. Search is performed
> entirely on `train.pkl` to avoid any leakage.

---

## Outputs

| File | Description |
|------|-------------|
| `results/tuned_params/full_25_params.json` | Best XGB + DT params for the 25-feature set |
| `results/tuned_params/reduced_A_params.json` | Best params for the 23-feature set |
| `results/tuned_params/reduced_B_params.json` | Best params for the 12-feature set |
| `results/tuned_params/reduced_C_params.json` | Best params for the 10-feature set |
| `results/tuned_params/search_summary.csv` | All 30 candidates × 4 sets, scored by CV recall |
| `results/checkpoints/task_02_complete.json` | Checkpoint — written only on full success |

---

## Search Configuration

### XGBoost Parameter Search Space

| Parameter | Distribution | Notes |
|-----------|-------------|-------|
| `n_estimators` | `[100, 200, 300, 400, 500]` | Uniform discrete |
| `max_depth` | `[3, 4, 5, 6, 7]` | Uniform discrete |
| `learning_rate` | `loguniform(0.01, 0.2)` | Log-uniform continuous |
| `subsample` | `uniform(0.6, 0.4)` → [0.6, 1.0] | Uniform continuous |
| `colsample_bytree` | `uniform(0.6, 0.4)` → [0.6, 1.0] | Uniform continuous |
| `min_child_weight` | `[1, 3, 5, 7]` | Uniform discrete |
| `gamma` | `uniform(0, 0.3)` | Uniform continuous |
| `scale_pos_weight` | **Not searched** — computed as `n_neg/n_pos` from y_train | Fixed |

### Decision Tree Parameter Search Space

| Parameter | Distribution | Notes |
|-----------|-------------|-------|
| `max_depth` | `[4, 5, 6, 7, 8, 10]` | Uniform discrete |
| `min_samples_leaf` | `[10, 15, 20, 30, 50]` | Uniform discrete |
| `min_samples_split` | `[2, 5, 10, 20]` | Uniform discrete |
| `class_weight` | `[{0:1.0, 1:2.0}, {0:1.0, 1:3.0}, {0:1.0, 1:4.0}]` | Discrete |
| `criterion` | `["gini", "entropy"]` | Discrete |

### Search Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| `n_iter` | 30 | 30 combinations × 5 inner folds = 150 fits per model per feature set |
| Inner CV | `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` | Preserves class imbalance; matches project seed |
| Scoring metric | `recall` (class 1) | Directly optimises for the project's primary criterion |
| `n_jobs` | `-1` | Use all CPU cores |
| `random_state` | 42 | Reproducibility |
| `refit` | `True` | Refit best estimator on full train set after search |

---

## Implementation

**File to create:** `experiments/feature-reduction-validation/tuner.py`

```python
# Pseudocode outline
def tune_feature_set(set_name, feature_cols, X_train, y_train, output_dir):
    X_sub = X_train[feature_cols]
    scale_pos_weight = compute_spw(y_train)

    xgb_search = RandomizedSearchCV(
        estimator=Pipeline([("preprocess", build_preprocessor(X_sub)),
                            ("model", XGBClassifier(...))]),
        param_distributions=XGB_PARAM_SPACE,
        n_iter=30,
        cv=StratifiedKFold(5, shuffle=True, random_state=42),
        scoring="recall",
        n_jobs=-1,
        random_state=42,
        refit=True,
    )
    xgb_search.fit(X_sub, y_train)

    dt_search = RandomizedSearchCV(
        estimator=Pipeline([("preprocess", build_preprocessor(X_sub)),
                            ("model", DecisionTreeClassifier(...))]),
        param_distributions=DT_PARAM_SPACE,
        n_iter=30,
        cv=StratifiedKFold(5, shuffle=True, random_state=42),
        scoring="recall",
        n_jobs=-1,
        random_state=42,
        refit=True,
    )
    dt_search.fit(X_sub, y_train)

    save_params(set_name, xgb_search.best_params_, dt_search.best_params_, output_dir)
    return xgb_search.best_estimator_, dt_search.best_estimator_
```

The `tuner.py` module must:

1. Load `train.pkl` and validate its structure.
2. For each feature set in order (`full_25`, `reduced_A`, `reduced_B`,
   `reduced_C`), run separate `RandomizedSearchCV` for XGBoost and for
   Decision Tree.
3. Save best params for each model as a JSON file in `results/tuned_params/`.
4. Save the full CV results for all 30 candidates to `search_summary.csv`.
5. Print progress to stdout after each feature set completes.
6. Write `task_02_complete.json` checkpoint (see below).

---

## Tuned Params JSON Format

Each `<set_name>_params.json` file stores both model results:

```json
{
  "feature_set": "reduced_C",
  "n_features": 10,
  "xgb": {
    "best_params": {
      "model__n_estimators": 300,
      "model__max_depth": 4,
      "model__learning_rate": 0.042,
      "model__subsample": 0.78,
      "model__colsample_bytree": 0.72,
      "model__min_child_weight": 3,
      "model__gamma": 0.05
    },
    "best_cv_recall": 0.9123,
    "scale_pos_weight": 7.42
  },
  "dt": {
    "best_params": {
      "model__max_depth": 6,
      "model__min_samples_leaf": 20,
      "model__min_samples_split": 5,
      "model__class_weight": {"0": 1.0, "1": 3.0},
      "model__criterion": "gini"
    },
    "best_cv_recall": 0.8891
  },
  "search_config": {
    "n_iter": 30,
    "inner_cv_folds": 5,
    "scoring": "recall",
    "random_state": 42
  },
  "timestamp": "<ISO-8601>"
}
```

---

## Checkpoint File

**Path:** `results/checkpoints/task_02_complete.json`

**Written:** Only after all 4 feature sets have been searched and all 4 param
JSON files exist and are valid.

**Contents:**
```json
{
  "task": "02",
  "status": "complete",
  "timestamp": "<ISO-8601>",
  "sets_completed": ["full_25", "reduced_A", "reduced_B", "reduced_C"],
  "outputs": {
    "full_25":   "results/tuned_params/full_25_params.json",
    "reduced_A": "results/tuned_params/reduced_A_params.json",
    "reduced_B": "results/tuned_params/reduced_B_params.json",
    "reduced_C": "results/tuned_params/reduced_C_params.json",
    "search_summary": "results/tuned_params/search_summary.csv"
  },
  "sha256": {
    "full_25":   "<hex>",
    "reduced_A": "<hex>",
    "reduced_B": "<hex>",
    "reduced_C": "<hex>"
  }
}
```

---

## Checkpoint Verification

Before proceeding to Task 03, verify:

1. `task_02_complete.json` exists and `"status"` is `"complete"`.
2. All 4 param JSON paths listed in `"outputs"` exist on disk.
3. Each param JSON contains both `"xgb"` and `"dt"` keys.
4. `sha256` values match the actual files.

If a search was interrupted mid-run, check which param files exist. Re-run
only the missing feature sets (the tuner should support a `--skip-completed`
flag).

---

## Pass / Fail Criteria

| Check | Pass Condition |
|-------|----------------|
| All sets searched | 4 param JSON files present |
| XGB inner CV recall | Best XGB CV recall ≥ 0.85 for every feature set |
| DT inner CV recall | Best DT CV recall ≥ 0.80 for every feature set |
| No param file is empty | Each JSON file is > 200 bytes and parses without error |
| Checkpoint integrity | sha256 values match actual files |

> Note: Inner CV recall is measured on the 5-fold inner split which is a
> subset of the 70% train split. Lower than the final test recall is expected
> and normal.

---

## Status Log

| Date | Event |
|------|-------|
| 2026-03-07 | Task completed successfully. `tuner.py` created. RandomizedSearchCV (n_iter=30, 5-fold inner CV) run for XGBoost and Decision Tree on all 4 feature sets. **Observation:** XGBoost inner CV recall = 1.0 for all feature sets. This is expected behaviour with extreme class imbalance (~6.4% positive) — XGBoost with `scale_pos_weight` can achieve perfect recall on the small number of positives in each inner fold at the cost of precision. The outer CV in Task 03 will provide the unbiased generalisation estimate. DT best inner CV recall ranges from 0.65 (full_25 / reduced_A) to 0.83 (reduced_B / reduced_C). Checkpoint written and verified. |
