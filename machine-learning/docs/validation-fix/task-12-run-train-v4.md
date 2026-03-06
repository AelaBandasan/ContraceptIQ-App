# Task 12 — Re-run `train_v4.py` and Verify Output

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Re-train the v4 production model with the corrected settings and confirm it produces honest recall metrics (not the degenerate 97.56% from the previous run).

---

## Command

Run from the `src/models/` directory:

```bash
cd machine-learning/src/models
python train_v4.py
```

---

## Expected Output Files (regenerated)

```
src/models/models_high_risk_v4/xgb_high_recall.joblib    ← regenerated
src/models/models_high_risk_v4/dt_high_recall.joblib     ← regenerated
src/models/models_high_risk_v4/hybrid_v4_config.json     ← regenerated
```

---

## Pass Criteria for `hybrid_v4_config.json`

| Field | Expected |
|---|---|
| `operating_threshold` | Matches value from Task 11 (from validation report) |
| `conf_margin` | `0.05` |
| `validation.final_test_recall` | ≥ 0.90, < 1.00 |
| `validation.final_test_precision` | Noticeably > 0.256 |
| `validation.final_test_f1` | Higher than the degenerate 0.408 |
| `meets_target` | `true` |

---

## Current (Degenerate) Values to Replace

From the existing `hybrid_v4_config.json`:
```json
{
  "operating_threshold": 0.10,
  "conf_margin": 0.2,
  "validation": {
    "final_test_recall": 0.9756,
    "final_test_precision": 0.2807,
    "final_test_f1": 0.4352
  },
  "meets_target": true
}
```

The recall of 0.9756 and precision of 0.2807 were produced by the same degenerate band mechanism.

---

## If `meets_target` Is `false` After Re-run

This means the corrected model achieves recall < 90% on the test set. Options:
- Check if the `THRESHOLD` from Task 11 is correct
- Review whether the validation pipeline's recommended threshold is appropriate for the full training set (slight distribution shift is normal)
- Consider lowering threshold slightly (e.g., try `0.30` if the recommended was `0.35`)
- Do not restore degenerate settings

---

## Final Sanity Check

After completion, the following should all be true simultaneously:
- `hybrid_v4_config.json` has `conf_margin: 0.05`
- Recall is in the range `[0.90, 0.98]` (not 1.00)
- FP count is reasonable (not 90+)
- The script exited with code 0

---

## Dependencies

- Task 11 must be complete

## Blocks

- Nothing — this is the final task in the plan
