# Task 04 — Fix `cv_runner.py` Threshold Selection

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Rewrite `select_threshold()` in `cv_runner.py` so it selects the threshold that maximises **F-beta (β=2)** on the inner val split, rather than maximising raw recall. The `target_met` diagnostic flag should remain based on recall, but it must not influence threshold selection.

---

## File to Edit

```
machine-learning/experiments/feature-reduction-validation/cv_runner.py
```

---

## Changes Required

### 1. Add import

Add alongside the existing `sklearn.metrics` imports:

```python
from sklearn.metrics import fbeta_score
```

---

### 2. Rewrite `select_threshold()`

**Current logic (broken)**:
```python
def select_threshold(xgb_pipe, dt_pipe, X_val, y_val):
    best_threshold = cfg.THRESHOLD_SWEEP[0]
    best_recall = -1.0
    for t in cfg.THRESHOLD_SWEEP:
        preds = _run_hybrid(xgb_pipe, dt_pipe, X_val, t)
        recall = recall_score(y_val, preds, zero_division=0)
        if recall > best_recall:
            best_recall = recall
            best_threshold = t
    target_met = best_recall > cfg.RECALL_TARGET
    return best_threshold, best_recall, target_met
```

**Replacement logic**:
```python
def select_threshold(xgb_pipe, dt_pipe, X_val, y_val):
    best_threshold = cfg.THRESHOLD_SWEEP[0]
    best_score = -1.0
    best_recall = 0.0
    for t in cfg.THRESHOLD_SWEEP:
        preds = _run_hybrid(xgb_pipe, dt_pipe, X_val, t)
        score = fbeta_score(y_val, preds, beta=cfg.FBETA_BETA, zero_division=0)
        if score > best_score:
            best_score = score
            best_threshold = t
            best_recall = recall_score(y_val, preds, zero_division=0)
    target_met = best_recall > cfg.RECALL_TARGET   # diagnostic only
    return best_threshold, best_recall, target_met
```

**Key change**: the comparison `score > best_score` uses F-beta, not recall. `target_met` still checks recall against the target (diagnostic use only — it does not affect which threshold is returned).

---

## What Changes in Behaviour

| Property | Before | After |
|---|---|---|
| Selection criterion | `max(recall)` | `max(fbeta_score(β=2))` |
| Lowest threshold always wins? | Yes (any threshold ≥ 0.10 with degenerate band → recall=1.0) | No — F-beta penalises precision collapse |
| `target_met` flag | Still based on recall | Still based on recall |
| Return signature | `(threshold, recall, target_met)` | Unchanged |

---

## Verification

After editing:
1. Search for pure `recall_score` usage in `select_threshold` — it should only appear for the `target_met` diagnostic, not for comparison
2. Confirm `fbeta_score` is imported
3. Confirm `cfg.FBETA_BETA` is referenced (not hardcoded `2.0`)
4. Confirm the return signature is unchanged (callers must not need updating)

---

## Dependencies

- Task 01 must be complete (`cfg.FBETA_BETA` must exist in config)

## Blocks

- Task 09 (pipeline run)
