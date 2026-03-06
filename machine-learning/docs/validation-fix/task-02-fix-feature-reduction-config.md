# Task 02 — Fix `feature-reduction/config.py`

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Apply the same `CONF_MARGIN`, `THRESHOLD_SWEEP`, and `RECALL_TARGET` fixes to the original feature-reduction experiment config. This keeps the two configs consistent. No `FBETA_BETA` constant is needed here (this config drives `run_experiment.py`, not the validation pipeline).

---

## File to Edit

```
machine-learning/experiments/feature-reduction/config.py
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

---

### 2. `THRESHOLD_SWEEP`

```python
# Before
THRESHOLD_SWEEP: list[float] = [0.10, 0.12, 0.15, 0.18, 0.20]

# After
THRESHOLD_SWEEP: list[float] = [0.25, 0.30, 0.35, 0.40, 0.45, 0.50]
```

---

### 3. `RECALL_TARGET`

```python
# Before
RECALL_TARGET: float = 0.87

# After
RECALL_TARGET: float = 0.90
```

---

## Verification

After editing, confirm:
- `CONF_MARGIN` is `0.05`
- `THRESHOLD_SWEEP` starts at `0.25` and ends at `0.50`
- `RECALL_TARGET` is `0.90`

---

## Dependencies

- None (can be done in parallel with Task 01)

## Blocks

- Task 07 (both configs must be corrected before updating feature sets)
