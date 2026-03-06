# Task 01 — Add SHAP Dependency

## Objective

Add `shap` to `requirements.txt` so the feature importance runner can use `shap.TreeExplainer`.

## Why `shap>=0.46`

- `xgboost==3.1.3` (in this project) changed its internal booster API in the 2.x → 3.x transition.
- SHAP versions below `0.44` call deprecated XGBoost booster methods and raise `AttributeError` or produce silently incorrect SHAP values.
- `shap>=0.46` is the first range with stable support for XGBoost 3.x `TreeExplainer`.

## Change

File: `machine-learning/requirements.txt`

Added line:
```
shap>=0.46
```

## Install

```bash
cd machine-learning
pip install "shap>=0.46"
```

## Verification

```python
import shap
import xgboost as xgb
print(shap.__version__)   # should be >= 0.46
print(xgb.__version__)    # should be 3.1.3
```
