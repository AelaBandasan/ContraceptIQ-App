# Task 06 — Run `derive_feature_sets.py` and Review Output

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete — output reviewed, feature lists approved
- [ ] Verified

---

## Goal

Execute `derive_feature_sets.py` and review the generated feature importance report before any config changes are made. This task has a **mandatory review pause** — Task 07 cannot begin until the output is reviewed and approved.

---

## Command

Run from the `feature-reduction/` experiment directory:

```bash
cd machine-learning/experiments/feature-reduction
python derive_feature_sets.py
```

---

## Expected Output

File created: `machine-learning/experiments/feature-reduction/results/feature_sets_derived.txt`

Expected content structure:

```
======================================================================
  DERIVED FEATURE SETS — ContraceptIQ Discontinuation Risk
======================================================================
  Generated        : <timestamp>
  Inner split      : StratifiedShuffleSplit 80/20 of X_train only
  Importance method: permutation_importance (roc_auc, n_repeats=20)

======================================================================
  SECTION 1 — FULL RANKED IMPORTANCE TABLE
======================================================================
  Rank  Feature                       Mean Importance   Std
  ----  ----------------------------  ---------------   -----
     1  REASON_DISCONTINUED               0.0412        0.0038
     2  CONTRACEPTIVE_METHOD              0.0387        0.0041
  ...

======================================================================
  SECTION 2 — RECOMMENDED _REDUCED_B (strictly positive importance)
======================================================================
  Features (N=?):
    - FEATURE_A
    - FEATURE_B
    ...

======================================================================
  SECTION 3 — RECOMMENDED _REDUCED_C (elbow / cumulative ≥ 80%)
======================================================================
  Features (N=?, cumulative importance = ?%):
    - FEATURE_A
    - FEATURE_B
    ...
======================================================================
```

---

## Review Criteria

Before proceeding to Task 07, confirm:

1. **No data leakage**: importance was computed on inner 20% of `X_train`, not on `test.pkl`
2. **`_REDUCED_B` size**: typically 8–14 features (strictly positive importance)
3. **`_REDUCED_C` size**: typically 6–10 features (elbow point)
4. **Top features make domain sense**: features like `REASON_DISCONTINUED`, `CONTRACEPTIVE_METHOD`, `PATTERN_USE` should rank highly
5. **No zero or negative importance features** in either set
6. **`_REDUCED_C` is a strict subset of `_REDUCED_B`**

---

## Mandatory Pause

After this task is complete, **stop and present the `feature_sets_derived.txt` content to the user for review**.

Proceed to Task 07 only after explicit user approval of the new feature lists.

---

## Possible Outcomes

| Scenario | Action |
|---|---|
| Output looks reasonable | Proceed to Task 07 with derived lists |
| Feature lists differ significantly from current `_REDUCED_B` / `_REDUCED_C` | Note the diff, proceed to Task 07 |
| Script errors (import failure, pkl not found, etc.) | Fix script (return to Task 05), re-run |
| All features show near-zero importance | Investigate preprocessor / XGB pipeline setup before proceeding |

---

## Dependencies

- Task 05 must be complete (script must exist)

## Blocks

- Task 07 (feature set update — requires review approval)
