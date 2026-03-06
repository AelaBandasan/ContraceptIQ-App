# Feature Reduction Validation Plan

**Status:** COMPLETE

**Goal:** Rigorously validate the feature-reduction experiment results using
stratified 10-fold cross-validation, per-feature-set hyperparameter tuning, and
leak-free threshold selection — so the recall figures can be trusted before the
reduced feature set is promoted to production.

**Constraint:** No existing files are modified. All new code lives under
`machine-learning/experiments/feature-reduction-validation/`.

---

## 1. Why Validation Is Needed

The original experiment (`experiments/feature-reduction/`) has three limitations
that make its reported results optimistic:

| Issue | Detail |
|---|---|
| **Single train/test split** | All metrics come from one fixed split baked into `discontinuation_design1_data_v2.pkl`. The variance of those estimates is unknown. |
| **Threshold selection leakage** | The best decision threshold is chosen by sweeping over the same test set used to report the final recall. This inflates the reported metric. |
| **v3 hyperparameters are not optimal for smaller feature sets** | The v3 XGBoost and Decision Tree params were tuned on 25 features. `reduced_C` (10 features) may need a different `max_depth`, `learning_rate`, etc. The original experiment never searched for better params. |

---

## 2. Methodology

The validation uses a **nested CV** approach:

```
┌─────────────────────────────────────────────────┐
│  Outer loop: Stratified 10-fold CV              │
│  ┌───────────────────────────────────────────┐  │
│  │  Inner loop: RandomizedSearchCV (5-fold)  │  │
│  │  Finds best XGB + DT params on train fold │  │
│  └───────────────────────────────────────────┘  │
│  Threshold selected on val portion of fold      │
│  Final metrics reported on held-out test fold   │
└─────────────────────────────────────────────────┘
```

### Phase 1 — Data Split Refactor (Task 01)
Produce a proper 3-way split from the raw full dataset
(`discontinuation_design1_full_data_v2.pkl`) so that the held-out test set is
never seen during hyperparameter search or threshold selection.

### Phase 2 — Hyperparameter Search (Task 02)
Run `RandomizedSearchCV` with a 5-fold stratified inner CV independently for
each of the 4 feature sets (`full_25`, `reduced_A`, `reduced_B`, `reduced_C`).
Search both XGBoost and Decision Tree parameters. `n_iter=30` per feature set
(= 150 fits per set, 600 total). Save tuned params per set.

### Phase 3 — Outer 10-Fold CV (Task 03)
Using the tuned params from Phase 2, run a stratified 10-fold outer CV for each
feature set. Each fold produces recall, precision, F1, and ROC-AUC. Aggregate
into mean ± std and 95% confidence intervals (bootstrap).

### Phase 4 — Leak-Free Threshold Selection (Task 04)
Within each outer CV fold, select the operating threshold using only the
validation portion of that fold (never the test fold). Report final recall on
the held-out test fold. Produces unbiased per-fold recall at best threshold.

### Phase 5 — Results Report (Task 05)
Consolidate all fold results into a final validation report comparing all 4
feature sets. Update `feature_reduction_config.json` with the validated best
config. Emit a definitive pass/fail verdict per feature set.

---

## 3. Task Index

| Task | Document | Status | Checkpoint File |
|------|----------|--------|-----------------|
| 01 | [task-01-data-split-refactor.md](task-01-data-split-refactor.md) | PENDING | `results/checkpoints/task_01_complete.json` |
| 02 | [task-02-hyperparameter-search.md](task-02-hyperparameter-search.md) | PENDING | `results/checkpoints/task_02_complete.json` |
| 03 | [task-03-stratified-10fold-cv.md](task-03-stratified-10fold-cv.md) | PENDING | `results/checkpoints/task_03_complete.json` |
| 04 | [task-04-threshold-selection.md](task-04-threshold-selection.md) | PENDING | `results/checkpoints/task_04_complete.json` |
| 05 | [task-05-results-report.md](task-05-results-report.md) | PENDING | `results/checkpoints/task_05_complete.json` |

Tasks must be completed in order. Each task saves a checkpoint file to disk on
success. If the process is interrupted, check which checkpoint files exist to
determine where to resume.

---

## 4. Dependency Chain

```
Task 01  ──►  Task 02  ──►  Task 03
                                │
                                ▼
                            Task 04  ──►  Task 05
```

- Task 02 requires the refactored data split from Task 01.
- Task 03 requires the tuned params JSON from Task 02.
- Task 04 runs concurrently with Task 03 (threshold selection happens inside
  the same outer CV loop). In practice, Task 04 logic is called from within
  the Task 03 script.
- Task 05 requires the CV fold results from Task 03/04.

---

## 5. File Structure

```
machine-learning/experiments/feature-reduction-validation/
├── __init__.py
├── config.py               Paths, feature sets, param search spaces, CV settings
├── data_splitter.py        Task 01 — 3-way split producer
├── tuner.py                Task 02 — RandomizedSearchCV per feature set
├── cv_runner.py            Task 03+04 — outer 10-fold CV + threshold selection
├── reporter.py             Task 05 — consolidate and save final report
├── run_validation.py       CLI entry point — orchestrates all tasks
└── results/
    ├── checkpoints/
    │   ├── task_01_complete.json
    │   ├── task_02_complete.json
    │   ├── task_03_complete.json
    │   ├── task_04_complete.json
    │   └── task_05_complete.json
    ├── tuned_params/
    │   ├── full_25_params.json
    │   ├── reduced_A_params.json
    │   ├── reduced_B_params.json
    │   └── reduced_C_params.json
    ├── cv_fold_results/
    │   ├── full_25_folds.csv
    │   ├── reduced_A_folds.csv
    │   ├── reduced_B_folds.csv
    │   └── reduced_C_folds.csv
    ├── validation_report.txt
    └── validated_feature_reduction_config.json
```

---

## 6. Success Criteria

A reduced feature set **passes** validation if:

1. **Mean recall (class 1) > 87%** across all 10 outer CV folds.
2. **95% CI lower bound > 87%** — the result must hold even accounting for
   variance across folds.
3. The set has **fewer features** than the baseline (25).

The validation recommends the set with the fewest features among all passing
sets. Ties are broken by highest mean recall.

---

## 7. How to Run

```bash
# From the project root
python machine-learning/experiments/feature-reduction-validation/run_validation.py
```

To resume from a checkpoint after interruption:

```bash
python machine-learning/experiments/feature-reduction-validation/run_validation.py --resume
```

The `--resume` flag checks which `task_NN_complete.json` files exist and skips
already-completed tasks.

---

## 8. Resuming After Interruption

If the device powers off mid-run, determine resume point as follows:

```
task_01_complete.json exists?  No  → restart from Task 01
                               Yes → continue
task_02_complete.json exists?  No  → restart from Task 02
                               Yes → continue
task_03_complete.json exists?  No  → restart from Task 03
                               Yes → continue
task_04_complete.json exists?  No  → restart from Task 04 (re-run cv_runner)
                               Yes → continue
task_05_complete.json exists?  No  → restart from Task 05
                               Yes → all tasks complete
```

Each checkpoint JSON contains a `sha256` hash of its primary output file so
integrity can be verified before trusting a partial result.

---

## 9. Files Modified

**None.** All code is new, created under:
```
machine-learning/experiments/feature-reduction-validation/
machine-learning/docs/feature-reduction/
```
