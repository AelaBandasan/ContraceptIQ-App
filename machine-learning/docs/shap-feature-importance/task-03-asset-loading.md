# Task 03 — Asset Loading

## Objective

Load the train/test split pickle and the trained XGBoost pipeline using
paths relative to `__file__`, with clear error messages if either is missing.

## Path Strategy

All paths are derived from `os.path.abspath(__file__)` so the script can be
run from any working directory:

```
feature_importance_runner.py  →  _HERE
_HERE/../../../               →  machine-learning/  (_ML_ROOT)

Data pickle : _ML_ROOT/data/processed/discontinuation_design1_data_v2.pkl
Model       : _HERE/models_high_risk_v3/xgb_high_recall.joblib
Artifacts   : _HERE/models_high_risk_v3/
```

## Loaded Artifacts

| Variable | Source | Contents |
|---|---|---|
| `X_train`, `y_train` | `discontinuation_design1_data_v2.pkl` | Training split |
| `X_test`, `y_test` | `discontinuation_design1_data_v2.pkl` | Test split |
| `pipeline` | `xgb_high_recall.joblib` | Full `sklearn.Pipeline` (preprocessor + XGBoost) |

## Error Handling

- If the data pickle is missing: prints `[ERROR]` with the full path and a
  hint to re-run the preprocessing notebook, then calls `sys.exit(1)`.
- If the model joblib is missing: same pattern, hints at the notebook.
- If the pickle is present but missing required keys (`X_train`, `X_test`,
  `y_train`, `y_test`): reports the missing keys and exits.

## Potential Issues

- **Wrong working directory**: solved by `__file__`-relative paths.
- **Pickle version mismatch**: if the pickle was saved with a different
  scikit-learn or pandas version, joblib may raise `ModuleNotFoundError` or
  `AttributeError`. Ensure you are running in the same venv used to create
  the pickle.
- **32-bit vs 64-bit numpy arrays**: the loaded DataFrames should already be
  consistent from the notebook; no explicit dtype coercion is applied.
