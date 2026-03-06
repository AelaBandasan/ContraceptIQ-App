# Task 04 — Leak-Free Threshold Selection

**Status:** COMPLETE

**Part of:** [VALIDATION_PLAN.md](VALIDATION_PLAN.md)
**Previous task:** [task-03-stratified-10fold-cv.md](task-03-stratified-10fold-cv.md)
**Next task:** [task-05-results-report.md](task-05-results-report.md)

---

## Goal

Select the operating decision threshold **without leaking the test fold**.

In the original experiment, the best threshold was chosen by sweeping over the
same test set used to report the final recall. This inflates the metric because
the threshold is optimised directly against the evaluation data.

This task defines the leak-free rule: **within each outer CV fold, the
threshold is swept and selected on the fold's inner validation split only.**
The selected threshold is then applied to the fold's test split, which has
never influenced threshold selection. The fold test recall is therefore an
unbiased estimate of real-world performance at that threshold.

> This task does **not** produce a standalone script. The threshold selection
> logic (`select_threshold`) is implemented in `cv_runner.py` (Task 03) and
> called once per fold, before the fold's test split is touched. This document
> specifies the contract that `select_threshold` must satisfy.

---

## Prerequisite

Task 03 (`cv_runner.py`) must incorporate the `select_threshold` function
before running. Task 04 is considered complete once all fold CSVs produced by
Task 03 contain non-leaked threshold values (verified by inspection of the
`threshold` column — all values must come from the sweep list, not a
post-hoc optimisation).

---

## Inputs (within each fold)

| Variable | Description |
|----------|-------------|
| `xgb_pipe` | XGBoost pipeline fitted on `X_inner_train` |
| `dt_pipe` | Decision Tree pipeline fitted on `X_inner_train` |
| `X_inner_val` | 20% of fold's train portion, unseen during model fitting |
| `y_inner_val` | Labels for `X_inner_val` |

---

## Threshold Selection Rule

```
For each threshold t in THRESHOLD_SWEEP = [0.10, 0.12, 0.15, 0.18, 0.20]:
    Apply the hybrid rule to (X_inner_val, t, CONF_MARGIN=0.20)
    Compute recall(y_inner_val, predictions)

Select t* = the threshold that maximises recall on X_inner_val,
            with ties broken by highest precision.

If no threshold achieves recall > 0.87 on X_inner_val:
    Select t* = threshold with the highest recall (best available).
    Flag this fold as "target_not_met_on_val" in the fold CSV.
```

This mirrors the sweep logic from the original experiment's `evaluator.py`,
but it is now applied to a **validation split** that is disjoint from the
**test split** used for reporting.

---

## Fold-Level Inner Split

Within each outer CV fold, the fold's train portion is split as follows:

```
outer_fold_train  (80% of fold)
│
├── inner_train   (80% of outer_fold_train = 64% of all train data)
│   Used to fit XGBoost + DT before threshold selection
│
└── inner_val     (20% of outer_fold_train = 16% of all train data)
    Used only for threshold selection — never for fitting
```

Split method: `train_test_split(X_fold_train, y_fold_train, test_size=0.2,
stratify=y_fold_train, random_state=42)`

After the threshold is selected on `inner_val`, both models are **refit on the
full `outer_fold_train`** before being evaluated on the test fold. This ensures
the final models benefit from all available training data in the fold.

---

## `select_threshold` Function Contract

```python
def select_threshold(
    xgb_pipe: Pipeline,
    dt_pipe: Pipeline,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    thresholds: list[float] = THRESHOLD_SWEEP,
    conf_margin: float = CONF_MARGIN,
) -> tuple[float, bool]:
    """
    Select the best decision threshold using the validation split.

    Returns
    -------
    best_threshold : float
        The threshold from THRESHOLD_SWEEP that maximises recall on X_val,
        ties broken by precision.
    target_met_on_val : bool
        True if the best threshold achieved recall > RECALL_TARGET on X_val.
    """
```

---

## What Gets Recorded in the Fold CSV

Each row of `<set_name>_folds.csv` (produced by Task 03) must include:

| Column | Description |
|--------|-------------|
| `threshold` | The `t*` selected on `inner_val` for this fold |
| `target_met_on_val` | Whether recall > 0.87 was achieved on `inner_val` |
| `recall` | Recall on the test fold using `t*` — the unbiased estimate |

The `threshold` column values are the primary evidence that selection was
leak-free: they may vary across folds (different `inner_val` splits may yield
different best thresholds), which is the expected behaviour.

---

## Checkpoint File

**Path:** `results/checkpoints/task_04_complete.json`

**Written:** Immediately after Task 03 completes, as a post-processing
verification step — Task 04 confirms the fold CSVs were produced with
leak-free thresholds.

**Contents:**
```json
{
  "task": "04",
  "status": "complete",
  "timestamp": "<ISO-8601>",
  "verification": {
    "threshold_values_in_sweep": true,
    "no_single_threshold_dominates_all_folds": true,
    "target_met_on_val_rate": {
      "full_25":   "<fraction of folds where val recall > 0.87>",
      "reduced_A": "<fraction>",
      "reduced_B": "<fraction>",
      "reduced_C": "<fraction>"
    }
  },
  "source_csvs": {
    "full_25":   "results/cv_fold_results/full_25_folds.csv",
    "reduced_A": "results/cv_fold_results/reduced_A_folds.csv",
    "reduced_B": "results/cv_fold_results/reduced_B_folds.csv",
    "reduced_C": "results/cv_fold_results/reduced_C_folds.csv"
  }
}
```

---

## Checkpoint Verification

Before proceeding to Task 05, verify:

1. `task_04_complete.json` exists and `"status"` is `"complete"`.
2. In every fold CSV, all values in the `threshold` column are members of
   `[0.10, 0.12, 0.15, 0.18, 0.20]`.
3. Thresholds are not identical across all 10 folds for every feature set
   (if all folds select the same threshold, this suggests the inner val split
   may be too small or the data is too homogeneous — worth investigating but
   not a hard failure).

```bash
python -c "
import pandas as pd, json
valid = {0.10, 0.12, 0.15, 0.18, 0.20}
for s in ['full_25', 'reduced_A', 'reduced_B', 'reduced_C']:
    df = pd.read_csv(f'results/cv_fold_results/{s}_folds.csv')
    bad = df[~df.threshold.isin(valid)]
    unique_t = df.threshold.unique()
    print(f'{s}: invalid_rows={len(bad)}, unique_thresholds={sorted(unique_t)}')
"
```

---

## Pass / Fail Criteria

| Check | Pass Condition |
|-------|----------------|
| All threshold values are valid | Every `threshold` in every fold CSV is in `[0.10, 0.12, 0.15, 0.18, 0.20]` |
| No test-set contamination | `threshold` was selected on `inner_val`, not on the fold test split (confirmed by code review of `cv_runner.py`) |
| Val target met rate | At least 50% of folds achieve recall > 0.87 on `inner_val` for the recommended feature set |

---

## Status Log

| Date | Event |
|------|-------|
| 2026-03-07 | Task completed as part of `cv_runner.py`. Leak-free `select_threshold` function implemented: threshold is selected on inner_val split (20% of fold's train portion), never on the fold test split. All threshold values fall within the valid sweep set `[0.10, 0.12, 0.15, 0.18, 0.20]`. Thresholds vary across folds (full_25: {0.10, 0.12}; reduced_A: {0.18, 0.20}; reduced_B: {0.12, 0.15}; reduced_C: {0.10, 0.12, 0.15}). Val target met rate = 1.0 for all feature sets. Task 04 checkpoint written and verified. |
