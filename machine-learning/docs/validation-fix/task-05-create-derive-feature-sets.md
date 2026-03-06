# Task 05 — Create `derive_feature_sets.py`

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Create a new read-only analysis script that re-derives `_REDUCED_B` and `_REDUCED_C` using permutation importance computed **on an inner fold of `X_train` only** — never on the test set. The script prints results to a text file and does **not** auto-edit any config.

---

## File to Create

```
machine-learning/experiments/feature-reduction/derive_feature_sets.py
```

---

## Output File

```
machine-learning/experiments/feature-reduction/results/feature_sets_derived.txt
```

---

## Script Behaviour

1. Load `train.pkl` from `feature-reduction-validation/results/splits/`
   - This file was produced by Task 01 of the validation pipeline (`data_splitter.py`)
   - It contains `(X_train, y_train)` — the 70% training split of the full dataset
   - The test set is never touched

2. Create a single stratified 80/20 inner split of `X_train`:
   - `random_state=42`
   - Use `StratifiedShuffleSplit(n_splits=1, test_size=0.20, random_state=42)`
   - Inner 80% = fit set; inner 20% = importance evaluation set

3. Build an XGBoost pipeline on the inner 80%:
   - Use the v3 fixed hyperparameters (from `feature-reduction/config.py` → `XGB_PARAMS`)
   - Use `build_preprocessor(features)` from `src/preprocessing/preprocessor.py` with `_ALL_FEATURES`

4. Run `permutation_importance` on the inner 20%:
   - `scoring="roc_auc"`, `n_repeats=20`, `n_jobs=1`, `random_state=42`
   - Compute mean importance per feature; map back to feature names

5. Derive recommended sets:
   - **`_REDUCED_B`**: all features with `mean_importance > 0` (strictly positive)
   - **`_REDUCED_C`**: elbow method on sorted importances (cumulative sum ≥ 80% of total positive importance), capped at 12 features minimum 6

6. Write `feature_sets_derived.txt` with:
   - Full ranked importance table (feature, mean, std)
   - Recommended `_REDUCED_B` list
   - Recommended `_REDUCED_C` list
   - No config edits

---

## Script Design Constraints

- **Read-only**: writes only to `results/feature_sets_derived.txt`
- **No auto-edit**: does not touch `config.py` in either experiment directory
- **Standalone**: runnable as `python derive_feature_sets.py` from the `feature-reduction/` directory
- **Deterministic**: fixed `random_state=42` throughout

---

## Why Inner Fold Only

The original `feature_importance_runner.py` computed permutation importance on `X_test` (the held-out evaluation split from `discontinuation_design1_data_v2.pkl`). The resulting scores informed the selection of `_REDUCED_B` and `_REDUCED_C`, which were then evaluated on the same `X_test`. This is look-ahead bias.

The fix: use only `X_train` (the 70% split from `discontinuation_design1_full_data_v2.pkl`). The `test.pkl` split is locked and must never be used for feature selection decisions.

---

## Verification

After running (Task 06), confirm:
- `results/feature_sets_derived.txt` exists and is non-empty
- No config file was modified
- `_REDUCED_B` has more features than `_REDUCED_C`
- Both lists are subsets of `_ALL_FEATURES`

---

## Dependencies

- Task 01 must be complete (so `FBETA_BETA` is available if referenced)
- `feature-reduction-validation/results/splits/train.pkl` must exist (produced by a previous pipeline run — it is already present from the stale run)

## Blocks

- Task 06 (run the script)
