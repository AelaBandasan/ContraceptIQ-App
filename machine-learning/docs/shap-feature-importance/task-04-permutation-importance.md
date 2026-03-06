# Task 04 — Permutation Importance

## Objective

Compute and save permutation feature importance using
`sklearn.inspection.permutation_importance` on the full sklearn Pipeline.

## Implementation

```python
permutation_importance(
    pipeline,       # full Pipeline — evaluates on raw input columns
    X_eval,         # raw DataFrame (pre-OHE)
    y_eval,
    n_repeats=20,   # configurable via --n-repeats
    n_jobs=1,       # safe on Windows (see task-02)
    random_state=42,
    scoring="roc_auc",
)
```

Scoring is `roc_auc` because the model is a high-recall probability
estimator; accuracy would be misleading for the class-imbalanced target.

## Output

### `feature_importance_v3_permutation.csv`

| column | description |
|---|---|
| `feature` | Raw input column name (25 features) |
| `importance_mean` | Mean decrease in ROC-AUC across repeats |
| `importance_std` | Std deviation across repeats |

Sorted descending by `importance_mean`.

### `feature_importance_v3_permutation.png`

Horizontal bar chart (top 15 features) with error bars.
Color: `#4C72B0` (blue). Saved at 150 DPI.

**Note:** This will overwrite the two existing artifacts already in
`models_high_risk_v3/` (`_permutation.csv` and `_permutation_02.csv` are not
touched; only the un-suffixed files are overwritten).

## Interpretation

- Positive mean → feature contributes to model performance.
- Near-zero or negative mean → feature adds noise or is redundant in this
  model. **Do not drop features based on a single run** — use `--full-eval`
  and multiple seeds before drawing conclusions.
- High std relative to mean → unstable estimate; increase `--n-repeats`.
