# Task 01 — Fix `feature-reduction-validation/config.py`

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Fix four settings in the validation experiment config that cause degenerate recall=1.0 results. Add the F-beta constant used by downstream tasks.

---

## File to Edit

```
machine-learning/experiments/feature-reduction-validation/config.py
```

---

## Changes Required

### 1. `CONF_MARGIN`

```python
# Before
CONF_MARGIN: float = 0.20

# After
CONF_MARGIN: float = 0.05
```

**Why**: `0.20` creates an upgrade band of `[0.00, 0.30)` around the base threshold. With class_weight={1:4} on the DT, this catches nearly every positive → FN=0 in every fold.

---

### 2. `THRESHOLD_SWEEP`

```python
# Before
THRESHOLD_SWEEP: list[float] = [0.10, 0.12, 0.15, 0.18, 0.20]

# After
THRESHOLD_SWEEP: list[float] = [0.25, 0.30, 0.35, 0.40, 0.45, 0.50]
```

**Why**: The old sweep starts at 0.10, which is so low that XGBoost alone flags nearly all positives. The new sweep forces honest operating points.

---

### 3. `RECALL_TARGET`

```python
# Before
RECALL_TARGET: float = 0.87

# After
RECALL_TARGET: float = 0.90
```

**Why**: 87% was set before the degenerate results were discovered. 90% is the agreed corrected target.

---

### 4. Add `FBETA_BETA` (new constant)

```python
# Add after RECALL_TARGET
FBETA_BETA: float = 2.0
```

**Why**: β=2 weights recall 2× more than precision. Used by `tuner.py` (Task 03) and `cv_runner.py` (Task 04). A missed high-risk patient is ~2× more costly than a false alarm.

---

## Placement in File

`FBETA_BETA` belongs in the `# SUCCESS CRITERION` section, after `RECALL_TARGET`:

```python
# ============================================================================
# SUCCESS CRITERION
# ============================================================================

RECALL_TARGET: float = 0.90
FBETA_BETA:    float = 2.0
```

---

## Verification

After editing, confirm:
- `CONF_MARGIN` is `0.05`
- `THRESHOLD_SWEEP` starts at `0.25` and ends at `0.50`
- `RECALL_TARGET` is `0.90`
- `FBETA_BETA` is `2.0` and present in the SUCCESS CRITERION section

---

## Dependencies

- None (first task)

## Blocks

- Task 03 (tuner.py needs `cfg.FBETA_BETA`)
- Task 04 (cv_runner.py needs `cfg.FBETA_BETA`)
- Task 09 (pipeline run uses these values)
