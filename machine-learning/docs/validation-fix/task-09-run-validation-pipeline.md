# Task 09 — Run `run_validation.py` from Scratch

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Execute the full validation pipeline with all fixes applied. This runs all 5 internal tasks (data split → hyperparameter search → CV → threshold selection → report) using the corrected config, tuner, and cv_runner.

---

## Command

Run from the `feature-reduction-validation/` directory:

```bash
cd machine-learning/experiments/feature-reduction-validation
python run_validation.py
```

Do **not** use `--resume` — all stale results were deleted in Task 08, so the pipeline starts fresh.

---

## Pipeline Task Sequence

| Internal Task | Module | What Runs |
|---|---|---|
| Task 01 | `data_splitter` | 70/15/15 split from `discontinuation_design1_full_data_v2.pkl` |
| Task 02 | `tuner` | `RandomizedSearchCV` with F-beta β=2 scorer (30 iterations, 5-fold inner CV) × 4 feature sets × 2 models (XGB + DT) |
| Task 03+04 | `cv_runner` | 10-fold outer CV with F-beta threshold selection on inner val split per fold |
| Task 05 | `reporter` | Writes `validation_report.txt` and `validated_feature_reduction_config.json` |

---

## Expected Runtime

- Task 01: < 1 minute
- Task 02: 20–45 minutes (30 × 5-fold × 4 sets × 2 models = 1,200 fits)
- Task 03+04: 15–30 minutes (10 folds × 4 sets × XGB+DT train + val)
- Task 05: < 1 minute

Total: approximately **45–90 minutes**

---

## Expected Signs of Correct Execution

During Task 02, console output should show F-beta scores (not recall=1.0 for all candidates).

During Task 03/04, thresholds should vary across folds (not uniformly 0.12 or 0.10).

---

## Expected Output Files

```
results/checkpoints/task_01_complete.json  ← regenerated
results/checkpoints/task_02_complete.json  ← regenerated
results/checkpoints/task_03_complete.json  ← regenerated
results/checkpoints/task_04_complete.json  ← regenerated
results/checkpoints/task_05_complete.json  ← regenerated

results/splits/train.pkl                   ← regenerated
results/splits/val.pkl                     ← regenerated
results/splits/test.pkl                    ← regenerated
results/splits/split_manifest.json         ← regenerated

results/tuned_params/full_25_params.json   ← regenerated
results/tuned_params/reduced_A_params.json ← regenerated
results/tuned_params/reduced_B_params.json ← regenerated
results/tuned_params/reduced_C_params.json ← regenerated
results/tuned_params/search_summary.csv    ← regenerated

results/cv_fold_results/full_25_folds.csv  ← regenerated
results/cv_fold_results/reduced_A_folds.csv
results/cv_fold_results/reduced_B_folds.csv
results/cv_fold_results/reduced_C_folds.csv
results/cv_fold_results/cv_summary.json

results/validation_report.txt             ← KEY OUTPUT
results/validated_feature_reduction_config.json
```

---

## If the Run Fails

| Error | Likely Cause | Fix |
|---|---|---|
| `AttributeError: module 'config' has no attribute 'FBETA_BETA'` | Task 01 not completed | Re-apply Task 01 edits |
| `ImportError: cannot import name 'fbeta_score'` | Task 03 or 04 import not added | Re-check import line |
| `FileNotFoundError: train.pkl` | Task 08 deleted it but pipeline is using `--resume` incorrectly | Run without `--resume` |
| Recall still = 1.0 in all folds | `CONF_MARGIN` or `THRESHOLD_SWEEP` still has old values | Re-check Task 01 edits |

---

## Dependencies

- Tasks 01–08 must all be complete

## Blocks

- Task 10 (report review)
