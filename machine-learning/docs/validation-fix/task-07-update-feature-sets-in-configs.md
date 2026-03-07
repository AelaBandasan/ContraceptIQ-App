# Task 07 — Update `_REDUCED_B` and `_REDUCED_C` in Both Configs

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Replace the current `_REDUCED_B` and `_REDUCED_C` feature lists in both config files with the new lists derived in Task 06. Preserve the old lists as `# LEGACY (pre-fix)` comments for rollback reference.

---

## Prerequisite

**This task cannot begin until Task 06 is complete and the derived feature lists have been explicitly approved.**

---

## Files to Edit

```
machine-learning/experiments/feature-reduction-validation/config.py
machine-learning/experiments/feature-reduction/config.py
```

---

## Change Pattern (apply to both files)

### `_REDUCED_B`

```python
# LEGACY (pre-fix): derived from permutation importance on X_test — look-ahead bias
# _REDUCED_B = [
#     "AGE", "REGION", "RELIGION", "MARITAL_STATUS", "RESIDING_WITH_PARTNER",
#     "SMOKE_CIGAR", "HUSBANDS_EDUC", "HUSBAND_AGE", "PARITY",
#     "PATTERN_USE", "CONTRACEPTIVE_METHOD", "REASON_DISCONTINUED",
# ]

# Re-derived using inner fold of X_train only (derive_feature_sets.py, 2026-03-XX)
_REDUCED_B = [
    # <NEW LIST FROM derive_feature_sets.py OUTPUT — filled in after Task 06>
]
```

### `_REDUCED_C`

```python
# LEGACY (pre-fix): derived from permutation importance on X_test — look-ahead bias
# _REDUCED_C = [
#     "REGION", "CONTRACEPTIVE_METHOD", "RELIGION", "HUSBAND_AGE", "PARITY",
#     "AGE", "REASON_DISCONTINUED", "HUSBANDS_EDUC", "MARITAL_STATUS", "PATTERN_USE",
# ]

# Re-derived using inner fold of X_train only (derive_feature_sets.py, 2026-03-XX)
_REDUCED_C = [
    # <NEW LIST FROM derive_feature_sets.py OUTPUT — filled in after Task 06>
]
```

---

## Verification

After editing both files, confirm:
1. Old lists are preserved as `# LEGACY` comments in both files
2. New `_REDUCED_B` and `_REDUCED_C` match exactly what was approved from Task 06 output
3. Both lists are valid subsets of `_ALL_FEATURES`
4. `FEATURE_SETS` dict references still point to the new (uncommented) variables
5. Both config files are syntactically valid Python

---

## Dependencies

- Task 06 complete and feature lists approved by user
- Tasks 01 and 02 complete (so configs already have correct `CONF_MARGIN`, `THRESHOLD_SWEEP`, `RECALL_TARGET`)

## Blocks

- Task 08 (delete stale results)
- Task 09 (pipeline run uses the updated feature sets)
