# Task 03 — Fix `tuner.py` Scoring Criterion

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Verified

---

## Goal

Replace `scoring="recall"` in `RandomizedSearchCV` with an F-beta (β=2) scorer for both the XGBoost and Decision Tree searches. Also rename the stored result key from `best_cv_recall` to `best_cv_fbeta` in the saved JSON and CSV output.

---

## File to Edit

```
machine-learning/experiments/feature-reduction-validation/tuner.py
```

---

## Changes Required

### 1. Add import

Add at the top of the file, alongside existing sklearn imports:

```python
from sklearn.metrics import fbeta_score, make_scorer
```

---

### 2. Replace scoring in XGB `RandomizedSearchCV`

Find the XGBoost search block. Change:

```python
# Before
scoring="recall",
```

```python
# After
scoring=make_scorer(fbeta_score, beta=cfg.FBETA_BETA, zero_division=0),
```

---

### 3. Replace scoring in DT `RandomizedSearchCV`

Find the Decision Tree search block. Apply the same change:

```python
# Before
scoring="recall",
```

```python
# After
scoring=make_scorer(fbeta_score, beta=cfg.FBETA_BETA, zero_division=0),
```

---

### 4. Rename stored metric key

In the result dict that is written to `{set_name}_params.json` and `search_summary.csv`, rename the key:

```python
# Before
"best_cv_recall": ...,

# After
"best_cv_fbeta": ...,
```

Also update any column header in the CSV output that references `recall` to reference `fbeta`.

---

## Rationale

With `scoring="recall"`, the hyperparameter search converges on configurations that maximise raw recall regardless of precision. Combined with the degenerate band, this always finds parameters that produce recall=1.0. F-beta β=2 forces the search to find configurations where recall is high *and* precision is not catastrophic.

---

## Verification

After editing:
1. Search the file for `scoring="recall"` — should find zero occurrences
2. Confirm `make_scorer` and `fbeta_score` are imported
3. Confirm `cfg.FBETA_BETA` is referenced (not a hardcoded `2.0`)
4. Confirm the output key rename (`best_cv_fbeta` not `best_cv_recall`)

---

## Dependencies

- Task 01 must be complete (`cfg.FBETA_BETA` must exist in config)

## Blocks

- Task 09 (pipeline run)
