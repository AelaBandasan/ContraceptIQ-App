# Validation Pipeline Fix — Master Implementation Plan

## Problem Summary

The feature-reduction-validation pipeline produced degenerate results: **recall = 1.00 in every fold** with **FN = 0** across all feature sets. This is not a genuine model result — it is caused by two compounding bugs in the pipeline configuration and scoring logic, plus a feature selection circularity issue.

---

## Root Causes

### 1. Degenerate Hybrid Band (`CONF_MARGIN=0.20` + `THRESHOLD=0.10`)

The upgrade band covers probabilities in `[0.00, 0.30)`. Because class 1 is only ~6.4% of the data and the Decision Tree uses `class_weight={1:4}`, the DT is strongly biased toward predicting class 1. It catches virtually every true positive that XGBoost misses, driving FN to zero and recall to 1.00 in every fold.

### 2. Threshold Selection Criterion Is Pure Recall Maximisation

`select_threshold()` in `cv_runner.py` picks the threshold that maximises raw recall on the inner val split with no precision constraint. Combined with the degenerate band, the lowest threshold (`0.10`) always wins.

### 3. Hyperparameter Tuning Also Uses Pure Recall

`tuner.py` uses `scoring="recall"` in `RandomizedSearchCV`. The search converged on degenerate recall=1.0 for all feature sets (confirmed in `search_summary.csv`: all rank-1 entries show `mean_cv_recall=1.0`).

### 4. Feature Selection Circularity

`feature_importance_runner.py` computed permutation importance on `X_test` (the held-out evaluation split). The resulting scores were used to hand-pick `_REDUCED_B` (12 features) and `_REDUCED_C` (10 features). These sets were then evaluated on the same test split — look-ahead bias.

---

## Fix Strategy

| Issue | Fix |
|---|---|
| Degenerate band | `CONF_MARGIN`: `0.20` → `0.05` |
| Threshold too low | `THRESHOLD_SWEEP`: `[0.10–0.20]` → `[0.25–0.50]` |
| Pure recall scoring | Replace with **F-beta (β=2)** — recall weighted 2× more than precision |
| Recall target too low / degenerate | `RECALL_TARGET`: `0.87` → `0.90` |
| Feature selection circularity | New `derive_feature_sets.py` uses inner fold of `X_train` only |

**β=2 rationale**: A missed high-risk patient (false negative) is ~2× more costly than a false alarm. F-beta natively handles the recall/precision trade-off without an arbitrary precision floor.

---

## Data Facts

- Total dataset: 3,205 rows
- Class 1 (high-risk) fraction: ~6.4% (~144 positives out of ~2,243 train rows)
- Test set: 481 rows, 31 positives (6.44%)
- Each CV fold test: ~224–225 rows, 14–15 positives
- At `THRESHOLD=0.10`, `CONF_MARGIN=0.20`: TP=31, FP=90, FN=0 → recall=1.0, precision=0.256

---

## Expected Outcome After Fix

- Recall per fold: **90–97%** (not uniform 100%)
- FN per fold: **> 0** (not zero)
- Thresholds: **variable across folds** (not uniformly the lowest value)
- Precision: **meaningfully higher** than the current 0.256

---

## Task Index

| Task | File | Description |
|---|---|---|
| 01 | [task-01-fix-validation-config.md](task-01-fix-validation-config.md) | Fix `feature-reduction-validation/config.py` |
| 02 | [task-02-fix-feature-reduction-config.md](task-02-fix-feature-reduction-config.md) | Fix `feature-reduction/config.py` |
| 03 | [task-03-fix-tuner-scoring.md](task-03-fix-tuner-scoring.md) | Replace `scoring="recall"` with F-beta in `tuner.py` |
| 04 | [task-04-fix-threshold-selection.md](task-04-fix-threshold-selection.md) | Rewrite `select_threshold()` in `cv_runner.py` to use F-beta |
| 05 | [task-05-create-derive-feature-sets.md](task-05-create-derive-feature-sets.md) | Create `derive_feature_sets.py` (inner-fold-only permutation importance) |
| 06 | [task-06-run-derive-feature-sets.md](task-06-run-derive-feature-sets.md) | Run `derive_feature_sets.py` and review output |
| 07 | [task-07-update-feature-sets-in-configs.md](task-07-update-feature-sets-in-configs.md) | Update `_REDUCED_B` / `_REDUCED_C` in both configs |
| 08 | [task-08-delete-stale-results.md](task-08-delete-stale-results.md) | Delete all stale results from `feature-reduction-validation/results/` |
| 09 | [task-09-run-validation-pipeline.md](task-09-run-validation-pipeline.md) | Run `run_validation.py` from scratch |
| 10 | [task-10-review-validation-report.md](task-10-review-validation-report.md) | Review new `validation_report.txt` |
| 11 | [task-11-fix-train-v4.md](task-11-fix-train-v4.md) | Fix `THRESHOLD`, `CONF_MARGIN`, recall check in `train_v4.py` |
| 12 | [task-12-run-train-v4.md](task-12-run-train-v4.md) | Re-run `train_v4.py` and verify `hybrid_v4_config.json` |

---

## Execution Order

Tasks 01–05 are pure code edits (no pipeline runs). They can be reviewed before any execution begins.

Tasks 06, 09, 12 are **execution steps** — each requires the preceding edits to be complete.

Task 06 has a **mandatory review pause** (Task 07 cannot begin until the feature importance output is reviewed by the user).

```
01 → 02 → 03 → 04 → 05
                        ↓
                       06 (run) → [REVIEW PAUSE] → 07
                                                      ↓
                                                     08 → 09 (run) → 10 (review)
                                                                              ↓
                                                                        11 → 12 (run)
```

---

## Files Modified by This Plan

| File | Task(s) | Type |
|---|---|---|
| `experiments/feature-reduction-validation/config.py` | 01, 07 | Edit |
| `experiments/feature-reduction/config.py` | 02, 07 | Edit |
| `experiments/feature-reduction-validation/tuner.py` | 03 | Edit |
| `experiments/feature-reduction-validation/cv_runner.py` | 04 | Edit |
| `experiments/feature-reduction/derive_feature_sets.py` | 05 | Create |
| `experiments/feature-reduction/results/feature_sets_derived.txt` | 06 | Generated |
| `experiments/feature-reduction-validation/results/` | 08, 09 | Delete / Regenerate |
| `src/models/train_v4.py` | 11 | Edit |
| `src/models/models_high_risk_v4/hybrid_v4_config.json` | 12 | Regenerated |
| `src/models/models_high_risk_v4/xgb_high_recall.joblib` | 12 | Regenerated |
| `src/models/models_high_risk_v4/dt_high_recall.joblib` | 12 | Regenerated |

---

## Files That Must NOT Be Modified

- `experiments/feature-reduction-validation/data_splitter.py`
- `experiments/feature-reduction-validation/reporter.py`
- `experiments/feature-reduction-validation/run_validation.py`
- `experiments/feature-reduction/run_experiment.py`
- `experiments/feature-reduction/evaluator.py`
- `experiments/feature-reduction/trainer.py`
- `experiments/feature-reduction/data_loader.py`
- `src/preprocessing/preprocessor.py`
- `src/preprocessing/feature_importance_runner.py` (reference only)
- `src/models/models_high_risk_v3/` (all files)
- `data/processed/` (all `.pkl` files)
