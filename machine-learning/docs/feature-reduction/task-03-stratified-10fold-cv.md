# Task 03 — Stratified 10-Fold Cross-Validation

**Status:** PENDING

**Part of:** [VALIDATION_PLAN.md](VALIDATION_PLAN.md)
**Previous task:** [task-02-hyperparameter-search.md](task-02-hyperparameter-search.md)
**Next task:** [task-04-threshold-selection.md](task-04-threshold-selection.md)

---

## Goal

Run a **stratified 10-fold outer cross-validation** for each of the 4 feature
sets, using the tuned hyperparameters found in Task 02. Each fold:

1. Fits the XGBoost and Decision Tree pipelines on 9 folds (train portion).
2. Applies the upgrade-only hybrid rule on the held-out fold (test portion).
3. Records recall, precision, F1, and ROC-AUC for that fold.

This produces **10 independent recall estimates per feature set**, from which
mean, standard deviation, and 95% confidence intervals are computed. These are
the statistically reliable figures that replace the single-split results from
the original experiment.

> Note: Threshold selection happens **within this same loop** (Task 04 logic
> is embedded here). The threshold is chosen on the val split produced inside
> each fold, never on the test fold. See Task 04 for details.

---

## Prerequisite

`results/checkpoints/task_02_complete.json` must exist and pass the
verification checks described in Task 02.

---

## Inputs

| File | Description |
|------|-------------|
| `results/splits/train.pkl` | `(X_train, y_train)` from Task 01 — the CV loop runs entirely on this |
| `results/tuned_params/<set>_params.json` | Tuned XGB + DT params from Task 02 (one file per feature set) |

> `val.pkl` and `test.pkl` are **not used** here. They remain locked until
> Task 05.

---

## Outputs

| File | Description |
|------|-------------|
| `results/cv_fold_results/full_25_folds.csv` | Per-fold metrics for the 25-feature set |
| `results/cv_fold_results/reduced_A_folds.csv` | Per-fold metrics for the 23-feature set |
| `results/cv_fold_results/reduced_B_folds.csv` | Per-fold metrics for the 12-feature set |
| `results/cv_fold_results/reduced_C_folds.csv` | Per-fold metrics for the 10-feature set |
| `results/cv_fold_results/cv_summary.json` | Mean ± std + 95% CI for every set across all metrics |
| `results/checkpoints/task_03_complete.json` | Checkpoint — written only on full success |

---

## CV Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| Strategy | `StratifiedKFold` | Preserves class imbalance across all folds |
| `n_splits` | 10 | Standard for stable metric estimates; 10% of train data per test fold |
| `shuffle` | `True` | Randomises fold assignment |
| `random_state` | 42 | Reproducibility — same seed as v3 pipeline |
| Confidence interval | 95%, bootstrap (n=1000) | Non-parametric; robust to non-normal fold distributions |

---

## Per-Fold CSV Schema

Each `<set_name>_folds.csv` has the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `fold` | int | Fold index (0–9) |
| `n_train` | int | Number of training samples in this fold |
| `n_test` | int | Number of test samples in this fold |
| `threshold` | float | Decision threshold selected on val portion (Task 04 logic) |
| `recall` | float | Recall (class 1) on test fold at selected threshold |
| `precision` | float | Precision (class 1) on test fold |
| `f1` | float | F1 (class 1) on test fold |
| `roc_auc` | float | ROC-AUC on test fold (threshold-independent) |
| `tn` | int | True negatives |
| `fp` | int | False positives |
| `fn` | int | False negatives |
| `tp` | int | True positives |

---

## CV Summary JSON Schema

`cv_summary.json` aggregates across all folds for each feature set:

```json
{
  "reduced_C": {
    "n_folds": 10,
    "recall": {
      "mean":   0.9512,
      "std":    0.0234,
      "ci_95_lower": 0.9051,
      "ci_95_upper": 0.9901,
      "min":    0.9024,
      "max":    0.9756
    },
    "precision": { "mean": ..., "std": ..., "ci_95_lower": ..., "ci_95_upper": ... },
    "f1":        { "mean": ..., "std": ..., "ci_95_lower": ..., "ci_95_upper": ... },
    "roc_auc":   { "mean": ..., "std": ..., "ci_95_lower": ..., "ci_95_upper": ... },
    "passes_target": true,
    "ci_lower_passes_target": true
  },
  ...
}
```

---

## Implementation

**File to create:** `experiments/feature-reduction-validation/cv_runner.py`

```python
# Pseudocode outline
def run_cv(set_name, feature_cols, tuned_params, X_train, y_train, output_dir):
    kf = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
    fold_records = []

    for fold_idx, (train_idx, test_idx) in enumerate(kf.split(X_train, y_train)):
        X_fold_train = X_train.iloc[train_idx][feature_cols]
        y_fold_train = y_train.iloc[train_idx]
        X_fold_test  = X_train.iloc[test_idx][feature_cols]
        y_fold_test  = y_train.iloc[test_idx]

        # Further split fold_train → inner_train + inner_val for threshold selection
        X_inner_train, X_inner_val, y_inner_train, y_inner_val = train_test_split(
            X_fold_train, y_fold_train,
            test_size=0.2, stratify=y_fold_train, random_state=42
        )

        # Fit models on inner_train using tuned params
        xgb_pipe = build_and_fit_xgb(X_inner_train, y_inner_train, tuned_params["xgb"])
        dt_pipe  = build_and_fit_dt(X_inner_train, y_inner_train, tuned_params["dt"])

        # Select threshold on inner_val (Task 04 logic)
        best_thresh = select_threshold(xgb_pipe, dt_pipe, X_inner_val, y_inner_val)

        # Refit on full fold_train with the selected threshold baked in
        xgb_pipe = build_and_fit_xgb(X_fold_train, y_fold_train, tuned_params["xgb"])
        dt_pipe  = build_and_fit_dt(X_fold_train, y_fold_train, tuned_params["dt"])

        # Evaluate on fold test
        preds, probs = run_hybrid(xgb_pipe, dt_pipe, X_fold_test, best_thresh, CONF_MARGIN)
        metrics = compute_metrics(y_fold_test, preds, probs)
        fold_records.append({"fold": fold_idx, "threshold": best_thresh, **metrics})

        print(f"  Fold {fold_idx:02d}: recall={metrics['recall']:.4f}  "
              f"threshold={best_thresh:.2f}")

    save_fold_csv(set_name, fold_records, output_dir)
    return fold_records
```

The `cv_runner.py` module must:

1. Load `train.pkl` and the tuned params JSON for each feature set.
2. For each feature set, run the 10-fold CV as outlined above.
3. Within each fold, use an 80/20 inner split of the fold's train portion to
   select the best threshold (see Task 04 for the selection rule).
4. Refit models on the full fold train before evaluating on the fold test.
5. Append each fold's result to a list; save the list as a CSV after all 10
   folds complete.
6. Compute the `cv_summary.json` aggregation using bootstrap CIs.
7. Print a per-fold progress line to stdout.
8. Write `task_03_complete.json` checkpoint (see below).

---

## Checkpoint File

**Path:** `results/checkpoints/task_03_complete.json`

**Written:** Only after all 4 feature sets have completed all 10 folds and all
CSV files and `cv_summary.json` are confirmed present.

**Contents:**
```json
{
  "task": "03",
  "status": "complete",
  "timestamp": "<ISO-8601>",
  "sets_completed": ["full_25", "reduced_A", "reduced_B", "reduced_C"],
  "total_folds_run": 40,
  "outputs": {
    "full_25_folds":   "results/cv_fold_results/full_25_folds.csv",
    "reduced_A_folds": "results/cv_fold_results/reduced_A_folds.csv",
    "reduced_B_folds": "results/cv_fold_results/reduced_B_folds.csv",
    "reduced_C_folds": "results/cv_fold_results/reduced_C_folds.csv",
    "cv_summary":      "results/cv_fold_results/cv_summary.json"
  },
  "sha256": {
    "full_25_folds":   "<hex>",
    "reduced_A_folds": "<hex>",
    "reduced_B_folds": "<hex>",
    "reduced_C_folds": "<hex>",
    "cv_summary":      "<hex>"
  }
}
```

---

## Checkpoint Verification

Before proceeding to Task 04/05, verify:

1. `task_03_complete.json` exists and `"status"` is `"complete"`.
2. All 4 CSV paths exist and each has exactly 10 rows (one per fold).
3. No `recall` value in any CSV is `NaN`.
4. `cv_summary.json` parses without error and contains all 4 feature set keys.
5. `sha256` values match the actual files.

To check row counts:
```bash
python -c "
import pandas as pd
for s in ['full_25', 'reduced_A', 'reduced_B', 'reduced_C']:
    df = pd.read_csv(f'results/cv_fold_results/{s}_folds.csv')
    print(f'{s}: {len(df)} folds, recall_mean={df.recall.mean():.4f}')
"
```

---

## Partial Resume

If the process is interrupted mid-CV:

- Fold CSV files may be partially written. The script checks how many rows each
  CSV already has and resumes from the next incomplete fold.
- A partially-completed feature set is identified by a CSV with fewer than 10
  rows or an absent CSV.
- Task 03 checkpoint is not written until **all 4 sets × 10 folds = 40 folds**
  are complete.

---

## Pass / Fail Criteria

| Check | Pass Condition |
|-------|----------------|
| All folds run | Each CSV has exactly 10 rows with no NaN values |
| Recall distribution | Mean recall ≥ 0.80 across all folds for every feature set (note: per-fold recall may vary; the 0.87 final target is evaluated in Task 05 against the locked test set) |
| Fold variance | Recall std ≤ 0.10 per feature set (higher variance indicates instability) |
| CI coverage | 95% CI width (upper − lower) ≤ 0.20 per feature set |
| Checkpoint integrity | sha256 values match actual files |

---

## Status Log

> Update this section when the task is completed.

| Date | Event |
|------|-------|
| — | Task not yet started |
