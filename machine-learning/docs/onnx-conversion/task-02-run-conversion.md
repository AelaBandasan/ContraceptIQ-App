# Task 02 — Run `convert_to_onnx_v4.py`

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Execute the corrected conversion script to produce the two `.onnx` files needed
for on-device inference in the mobile app.

---

## Pre-flight Checks

Before running, confirm Task 01 is complete:

```
FEATURES  = 9 entries (reduced_C)
THRESHOLD = 0.25
CONF_MARGIN = 0.05
FEATURE_DTYPES = 9 keys with correct types
```

Also confirm the `.joblib` models exist:

```
machine-learning/src/models/models_high_risk_v4/xgb_high_recall.joblib  ← must exist
machine-learning/src/models/models_high_risk_v4/dt_high_recall.joblib   ← must exist
```

---

## Command

Run from the `src/models/` directory:

```bash
cd machine-learning/src/models
python convert_to_onnx_v4.py
```

---

## Expected Console Output (structure)

```
============================================================
ContraceptIQ -- ONNX Conversion v4 (9 features)
============================================================
XGBoost converter registered with skl2onnx

Loading v4 joblib models ...
  Loaded .../xgb_high_recall.joblib
  Loaded .../dt_high_recall.joblib

============================================================
Converting XGBoost Pipeline (v4) ...
============================================================
  Saved to .../xgb_high_recall.onnx  (XXX.X KB)

============================================================
Converting Decision Tree Pipeline (v4) ...
============================================================
  Saved to .../dt_high_recall.onnx  (XXX.X KB)

============================================================
Validating hybrid logic: ONNX vs joblib (20 test samples)
============================================================
  [PASS] row 00: true=X  jl=X(p=X.XXXX)  onnx=X(p=X.XXXX)  pdiff=X.XXXXXX
  ...
  [PASS] row 19: ...

============================================================
CONVERSION SUMMARY
============================================================
  Hybrid validation : PASS
  Output files:
    .../xgb_high_recall.onnx
    .../dt_high_recall.onnx
============================================================

All validations passed. ONNX models ready for mobile deployment.
```

---

## Expected Output Files

```
machine-learning/src/models/models_high_risk_v4/xgb_high_recall.onnx   ← created
machine-learning/src/models/models_high_risk_v4/dt_high_recall.onnx    ← created
```

---

## If the Script Fails

### `KeyError` or `ValueError` on feature names
- Confirm `FEATURES` and `FEATURE_DTYPES` keys match exactly (Task 01 not complete or has a typo)

### `skl2onnx` conversion error
- Check that `onnxmltools`, `skl2onnx`, and `onnxruntime` are installed:
  ```bash
  pip install skl2onnx onnxmltools onnxruntime
  ```
- Confirm `target_opset=15` is compatible with installed `onnxruntime` version

### `[FAIL]` rows in validation
- A `FAIL` means the ONNX model produced a different hybrid prediction than joblib
  for that row. Investigate `pdiff` (probability difference):
  - `pdiff < 1e-4` with a label difference near the threshold boundary is a known
    float32 vs float64 precision issue. Acceptable if fewer than 2 rows fail.
  - Larger `pdiff` values indicate a real conversion problem — do not proceed.

### Script exits with code 1
- Review the `[FAIL]` rows above the summary block
- Do not copy `.onnx` files to the mobile app until all rows pass

---

## Dependencies

- Task 01 must be complete

## Blocks

- Task 03 (verify output)
