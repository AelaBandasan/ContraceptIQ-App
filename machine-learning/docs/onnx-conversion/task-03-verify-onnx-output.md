# Task 03 — Verify ONNX Output

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete — output verified, ONNX files accepted
- [ ] Verified

---

## Goal

Confirm that the two `.onnx` files produced by Task 02 are valid, the right size,
and that the validation spot-check passed cleanly. This is the gate before copying
the files to the mobile app.

---

## Files to Verify

```
machine-learning/src/models/models_high_risk_v4/xgb_high_recall.onnx
machine-learning/src/models/models_high_risk_v4/dt_high_recall.onnx
```

---

## Pass Criteria (all must be true)

| Check | Expected |
|---|---|
| `xgb_high_recall.onnx` exists | Yes |
| `dt_high_recall.onnx` exists | Yes |
| `xgb_high_recall.onnx` size | > 50 KB (XGBoost with 300 trees is large) |
| `dt_high_recall.onnx` size | > 5 KB |
| All 20 validation rows | `[PASS]` |
| Script exit code | 0 |
| Console summary | `Hybrid validation : PASS` |

---

## Degenerate Result Flags (any of these = do not proceed)

- Either `.onnx` file is 0 bytes or missing
- Any `[FAIL]` row with `pdiff > 1e-3`
- Script exited with code 1

---

## Acceptable Edge Case

A maximum of **1–2 rows** with `[PASS]` label but non-zero `pdiff` (< 1e-4) is
acceptable. This is caused by float32 (ONNX) vs float64 (joblib) rounding near
the decision threshold boundary. The hybrid prediction must still match.

---

## After Verification

Once this task is marked complete, the ONNX conversion is done. The next step
(outside this plan) is to integrate the v4 models into the mobile app:

1. Copy `.onnx` files to `mobile-app/assets/models/`
2. Copy `hybrid_v4_config.json` to `mobile-app/assets/models/`
3. Update `mobile-app/src/utils/featureEncoder.ts` (9 features)
4. Update `mobile-app/src/services/onDeviceRiskService.ts` (threshold, margin, feature list)

---

## Dependencies

- Task 02 must be complete (script must have run successfully)

## Blocks

- Mobile app integration (separate plan)
