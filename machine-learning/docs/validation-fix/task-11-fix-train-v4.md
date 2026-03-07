# Task 11 â€” Fix `train_v4.py`

## Status

- [x] Not started`n- [x] In progress`n- [x] Complete`n- [x] Verified

---

## Goal

Update `train_v4.py` to use the corrected threshold, confidence margin, and recall success criterion that match the fixed validation pipeline. This ensures the production v4 model is trained with the same non-degenerate settings.

---

## File to Edit

```
machine-learning/src/models/train_v4.py
```

---

## Changes Required

### 1. `THRESHOLD`

Update to match the operating threshold selected by the corrected validation pipeline. The exact value comes from `validated_feature_reduction_config.json` â†’ `operating_threshold` (produced in Task 09).

```python
# Before
THRESHOLD = 0.10

# After
THRESHOLD = <value from validated_feature_reduction_config.json>
```

---

### 2. `CONF_MARGIN`

```python
# Before
CONF_MARGIN = 0.20

# After
CONF_MARGIN = 0.05
```

---

### 3. `meets_target` check

```python
# Before
meets_target = recall > 0.87

# After
meets_target = recall > 0.90
```

---

### 4. Exit condition (if present)

If there is a `sys.exit(1)` triggered when recall â‰¤ target, update the threshold in that check:

```python
# Before
if recall <= 0.87:
    sys.exit(1)

# After
if recall <= 0.90:
    sys.exit(1)
```

---

### 5. Feature list (conditional)

If Task 07 resulted in changes to `_REDUCED_C` (the feature set used by `train_v4.py`), update the feature list constant in `train_v4.py` to match.

The current hardcoded list in `train_v4.py`:
```python
FEATURES = [
    "REGION", "CONTRACEPTIVE_METHOD", "RELIGION", "HUSBAND_AGE",
    "PARITY", "AGE", "REASON_DISCONTINUED", "HUSBANDS_EDUC",
    "MARITAL_STATUS", "PATTERN_USE",
]
```

If `_REDUCED_C` changed in Task 07, update this list to match. If `_REDUCED_C` is unchanged, no edit needed here.

---

## Verification

After editing, confirm:
- `THRESHOLD` matches `validated_feature_reduction_config.json` â†’ `operating_threshold`
- `CONF_MARGIN` is `0.05`
- `meets_target` check uses `0.90`
- Feature list matches the approved `_REDUCED_C` from Task 07

---

## Dependencies

- Task 10 must be complete (operating threshold value comes from the new report)
- Task 07 must be complete (feature list may have changed)

## Blocks

- Task 12 (run train_v4.py)
