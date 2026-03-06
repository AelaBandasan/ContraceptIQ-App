# Task 06 — SHAP TreeExplainer

## Objective

Implement SHAP feature importance using `shap.TreeExplainer` on the XGBoost
model extracted from inside the sklearn Pipeline, operating on pre-transformed
(post-OHE) data.

## Why SHAP vs Permutation Importance

| | Permutation | SHAP |
|---|---|---|
| Operates on | Raw input (via full pipeline) | Post-OHE numeric array |
| Output granularity | Per raw column (25 features) | Per OHE column (many more) |
| Directionality | No (magnitude only) | Yes (positive/negative effect) |
| Speed | Slow (n_repeats × model calls) | Fast for tree models |
| Interpretability | Global rank | Per-sample + global |

## Data Flow

```
X_eval (raw DataFrame, 25 cols)
    ↓  preprocessor.transform()
X_transformed (dense numpy float64, n × ~N_OHE cols)
    ↓  pd.DataFrame(..., columns=feature_names_out)
X_transformed_df  ← labelled DataFrame for SHAP plots
    ↓  shap.TreeExplainer(xgb_model).shap_values()
shap_values  shape: (n_samples, N_OHE_cols)
```

## Critical Implementation Notes

### 1. Extract model from pipeline, not the pipeline itself

`shap.TreeExplainer` only accepts tree-based estimators, not sklearn
`Pipeline` objects. Passing the full pipeline raises:
```
TypeError: The passed model is not directly supported
```
Must extract: `pipeline.named_steps["model"]`

### 2. Must call `preprocessor.transform()` first

The XGBoost model was trained on OHE-transformed numeric arrays. Passing
raw string-categorical DataFrames raises:
```
ValueError: DataFrame.dtypes for data must be int, float, bool or category
```

### 3. Do NOT call `.toarray()`

`preprocessor.py` sets `sparse_output=False` on the OHE, so
`preprocessor.transform()` already returns a dense `numpy.ndarray`. Calling
`.toarray()` on it raises `AttributeError`.

### 4. `show=False` is mandatory

`shap.summary_plot(..., show=False)` must be passed explicitly. With the
`Agg` backend, `show=True` either silently does nothing or raises a backend
error depending on the OS. Always save with `plt.savefig()` after.

### 5. `plt.close("all")` before and after each plot

SHAP's `summary_plot` draws on the current active figure. Without closing
first, residual state from prior matplotlib calls can corrupt the output.

## Sample Size

`shap_n = min(max(500, sample_cap), 1000)`

- TreeExplainer is fast on XGBoost but the post-OHE matrix can be large
  (25 columns × multiple categories each = potentially 100+ OHE columns).
- 1000 samples balances statistical stability with memory and speed.

## Output

### `feature_importance_v3_shap_summary.png`

SHAP beeswarm summary plot. Each row is one OHE feature; each dot is one
sample. Color encodes feature value (red = high, blue = low). X-axis is
SHAP value (impact on model output in log-odds).

- Shows both **direction** (positive = increases discontinuation risk)
  and **magnitude** of each OHE category's effect.

### `feature_importance_v3_shap_values.csv`

| column | description |
|---|---|
| `feature` | Full OHE feature name (e.g. `cat__CONTRACEPTIVE_METHOD_IUD`) |
| `mean_abs_shap` | Mean absolute SHAP value across all samples |

Sorted descending by `mean_abs_shap`. Complements the plot with exact values.

## Version Compatibility

- `shap>=0.46` required for XGBoost 3.x (`xgboost==3.1.3` in this project).
- Earlier versions call deprecated booster `.get_dump()` API methods that
  were removed in XGBoost 2.x.

## Potential Errors

| Error | Cause | Fix |
|---|---|---|
| `TypeError: The passed model is not directly supported` | Passed full pipeline to TreeExplainer | Extract `pipeline.named_steps["model"]` |
| `ValueError: DataFrame.dtypes for data must be int, float, bool or category` | Passed raw DataFrame | Call `preprocessor.transform()` first |
| `AttributeError: 'ndarray' object has no attribute 'toarray'` | Called `.toarray()` on dense array | Remove `.toarray()` call |
| `ImportError: No module named 'shap'` | shap not installed | `pip install "shap>=0.46"` |
| Blank or corrupted PNG | `show=True` or missing `plt.close()` | Pass `show=False`, call `plt.close("all")` |
