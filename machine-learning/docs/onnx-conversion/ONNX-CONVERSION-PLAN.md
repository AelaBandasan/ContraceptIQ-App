# ONNX Conversion Fix — Master Plan

## Problem Summary

`convert_to_onnx_v4.py` was written before the validation-fix plan corrected the
feature set and inference settings. It still references the **old 10-feature set**
and the **degenerate threshold/margin** from before the fix. The `.joblib` models
were retrained (Task 12 of the validation-fix plan) on the corrected **9-feature
`reduced_C` set**, so running the script as-is will crash with a feature mismatch
at `predict_proba`.

No `.onnx` files exist yet:

| File | Exists? |
|---|---|
| `models_high_risk_v4/xgb_high_recall.joblib` | Yes |
| `models_high_risk_v4/dt_high_recall.joblib` | Yes |
| `models_high_risk_v4/hybrid_v4_config.json` | Yes |
| `models_high_risk_v4/xgb_high_recall.onnx` | **No** |
| `models_high_risk_v4/dt_high_recall.onnx` | **No** |

---

## Root Causes

| # | Location | Current (wrong) | Correct |
|---|---|---|---|
| 1 | `FEATURES` list (lines 54–65) | 10 old features (incl. `REGION`, `RELIGION`, etc.) | 9 `reduced_C` features |
| 2 | `N_FEATURES` comment (line 67) | `# 10` | `# 9` |
| 3 | `THRESHOLD` (line 70) | `0.10` | `0.25` |
| 4 | `CONF_MARGIN` (line 71) | `0.20` | `0.05` |
| 5 | `FEATURE_DTYPES` (lines 73–86) | 10 old keys; `HUSBAND_AGE` typed as `"object"` | 9 correct keys; `HUSBAND_AGE`, `AGE`, `PARITY` as `"int64"` |
| 6 | Header print (line 222) | `"10 features"` | `"9 features"` |
| 7 | Next-steps comment (line 264) | `"featureEncoder.ts (10 features)"` | `"featureEncoder.ts (9 features)"` |

The `validate()` hybrid logic (lines 188–200) references `THRESHOLD` and
`CONF_MARGIN` by name, so it becomes correct automatically once Issues 3 & 4 are
fixed. No separate change needed there.

---

## Fix Strategy

All 7 issues are in a single file (`convert_to_onnx_v4.py`) and are pure constant
updates. They are fixed in one edit (Task 01), then the script is run (Task 02)
and its output verified (Task 03).

---

## Task Index

| Task | File | Description |
|---|---|---|
| 01 | [task-01-fix-convert-script.md](task-01-fix-convert-script.md) | Edit `convert_to_onnx_v4.py` — fix features, dtypes, threshold, margin |
| 02 | [task-02-run-conversion.md](task-02-run-conversion.md) | Run `convert_to_onnx_v4.py` and capture output |
| 03 | [task-03-verify-onnx-output.md](task-03-verify-onnx-output.md) | Verify `.onnx` files exist and all 20 validation rows PASS |

---

## Execution Order

```
Task 01 (edit) → Task 02 (run) → Task 03 (verify)
```

Tasks 02 and 03 cannot begin until Task 01 is complete. Task 03 is a review of
Task 02's console output; no additional code changes are expected.

---

## Files Modified by This Plan

| File | Task | Type |
|---|---|---|
| `machine-learning/src/models/convert_to_onnx_v4.py` | 01 | Edit |
| `machine-learning/src/models/models_high_risk_v4/xgb_high_recall.onnx` | 02 | Generated |
| `machine-learning/src/models/models_high_risk_v4/dt_high_recall.onnx` | 02 | Generated |

---

## Files That Must NOT Be Modified

- `machine-learning/src/models/train_v4.py` (source of truth for features/settings)
- `machine-learning/src/models/models_high_risk_v4/xgb_high_recall.joblib`
- `machine-learning/src/models/models_high_risk_v4/dt_high_recall.joblib`
- `machine-learning/src/models/models_high_risk_v4/hybrid_v4_config.json`
- `machine-learning/src/preprocessing/preprocessor.py`

---

## Pass Criteria (all must be true after Task 02)

- `models_high_risk_v4/xgb_high_recall.onnx` exists and is > 0 bytes
- `models_high_risk_v4/dt_high_recall.onnx` exists and is > 0 bytes
- All 20 spot-check rows print `[PASS]`
- Script exits with code 0
- `CONVERSION SUMMARY` block shows `Hybrid validation : PASS`
