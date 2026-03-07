# Task 01 — Fix `convert_to_onnx_v4.py`

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Update all stale constants in `convert_to_onnx_v4.py` to match the corrected
v4 model produced by `train_v4.py` (9-feature `reduced_C` set, non-degenerate
inference settings).

---

## File to Edit

```
machine-learning/src/models/convert_to_onnx_v4.py
```

---

## Changes Required

### 1. Replace `FEATURES` list (lines 54–65)

```python
# BEFORE — old 10-feature set (will crash: models never saw these features)
FEATURES = [
    "REGION",
    "CONTRACEPTIVE_METHOD",
    "RELIGION",
    "HUSBAND_AGE",
    "PARITY",
    "AGE",
    "REASON_DISCONTINUED",
    "HUSBANDS_EDUC",
    "MARITAL_STATUS",
    "PATTERN_USE",
]

# AFTER — correct 9-feature reduced_C set (matches train_v4.py lines 54-64)
FEATURES = [
    "PATTERN_USE",
    "HUSBAND_AGE",
    "AGE",
    "ETHNICITY",
    "HOUSEHOLD_HEAD_SEX",
    "CONTRACEPTIVE_METHOD",
    "SMOKE_CIGAR",
    "DESIRE_FOR_MORE_CHILDREN",
    "PARITY",
]
```

---

### 2. Update `N_FEATURES` comment (line 67)

```python
# BEFORE
N_FEATURES = len(FEATURES)   # 10

# AFTER
N_FEATURES = len(FEATURES)   # 9
```

---

### 3. Update `THRESHOLD` (line 70)

```python
# BEFORE
THRESHOLD   = 0.10

# AFTER
THRESHOLD   = 0.25
```

---

### 4. Update `CONF_MARGIN` (line 71)

```python
# BEFORE
CONF_MARGIN = 0.20

# AFTER
CONF_MARGIN = 0.05
```

---

### 5. Replace `FEATURE_DTYPES` dict (lines 73–86)

Key changes:
- All 9 new feature names replace the 10 old ones
- `HUSBAND_AGE` changes from `"object"` → `"int64"` (it is a numeric column)
- `AGE` and `PARITY` remain `"int64"`
- The 6 remaining features are all categorical (`"object"`)

```python
# BEFORE — comment says "10 features", wrong keys, HUSBAND_AGE wrong dtype
# Dtypes of the 10 features (from the training data pickle)
# Used to build per-column initial_types for skl2onnx.
FEATURE_DTYPES: dict[str, str] = {
    "REGION":                "object",
    "CONTRACEPTIVE_METHOD":  "object",
    "RELIGION":              "object",
    "HUSBAND_AGE":           "object",
    "PARITY":                "int64",
    "AGE":                   "int64",
    "REASON_DISCONTINUED":   "object",
    "HUSBANDS_EDUC":         "object",
    "MARITAL_STATUS":        "object",
    "PATTERN_USE":           "object",
}

# AFTER — 9 features, correct dtypes
# Dtypes of the 9 reduced_C features (from the training data pickle).
# Used to build per-column initial_types for skl2onnx.
FEATURE_DTYPES: dict[str, str] = {
    "PATTERN_USE":              "object",
    "HUSBAND_AGE":              "int64",
    "AGE":                      "int64",
    "ETHNICITY":                "object",
    "HOUSEHOLD_HEAD_SEX":       "object",
    "CONTRACEPTIVE_METHOD":     "object",
    "SMOKE_CIGAR":              "object",
    "DESIRE_FOR_MORE_CHILDREN": "object",
    "PARITY":                   "int64",
}
```

---

### 6. Update header print (line 222)

```python
# BEFORE
print("ContraceptIQ -- ONNX Conversion v4 (10 features)")

# AFTER
print("ContraceptIQ -- ONNX Conversion v4 (9 features)")
```

---

### 7. Update next-steps comment (line 264)

```python
# BEFORE
print("  2. Update mobile-app/src/utils/featureEncoder.ts (10 features)")

# AFTER
print("  2. Update mobile-app/src/utils/featureEncoder.ts (9 features)")
```

---

## Verification (before running)

After editing, confirm:
- `FEATURES` has exactly **9 entries** matching `REDUCED_C_FEATURES` in `train_v4.py`
- `FEATURE_DTYPES` has exactly **9 keys**, all matching `FEATURES`
- `THRESHOLD` is `0.25`
- `CONF_MARGIN` is `0.05`
- `validate()` function references `THRESHOLD` and `CONF_MARGIN` by name (no
  hardcoded values) — no change needed there

---

## Dependencies

None — this is a pure code edit.

## Blocks

- Task 02 (run conversion)
