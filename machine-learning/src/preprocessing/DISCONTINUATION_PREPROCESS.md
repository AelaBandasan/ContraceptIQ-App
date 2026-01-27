# Discontinuation Preprocess — Notebook Documentation

Notebook: machine-learning/src/preprocessing/discontinuation_preprocess.ipynb  
Date: 2026-01-18  
OS: Windows

## Overview

This document summarizes the preprocessing logic implemented in the notebook for contraceptive discontinuation analysis. It provides inputs/outputs, environment setup, and quick run instructions so you can reproduce results consistently.

## Notebook Structure

- Total cells: 4
- Cell types: 4 code, 0 markdown
- Executed successfully; outputs include standard text and stdout streams.

## Key Variables and Objects

The notebook declares and uses the following notable variables and estimators (from the active kernel state):

- Data paths and targets: `DATA_PATH`, `TARGET_D1`
- Feature sets: `feature_cols`, `feature_cols_demo`, `feature_cols_fertility`, `feature_cols_method`, `categorical_features`, `numeric_features`, `leakage_cols`, `all_features`, `all_candidate_features`
- DataFrames: `df`, `df_current`, `df_model_d1`, `X`, `X_train`, `X_test`, `y`, `y_train`, `y_test`
- Feature engineering helpers: `last_method_nonempty`, `reason_nonempty`, `has_negative_history`, `intention_high_risk`, `intention_low_risk`, `any_intention_high_risk`, `any_intention_low_risk`, `intention_use_high_risk`, `intention_use_low_risk`
- Pipelines/transformers: `ColumnTransformer` (class), `preprocessor` (fitted transformer), `categorical_transformer`, `numeric_transformer`
- Models and pipelines: `DecisionTreeClassifier`, `XGBClassifier`, `dt_clf`, `xgb_clf`, `dt_hybrid`, `xgb_hybrid`, `dt_pipeline`, `xgb_pipeline`, `dt_pipeline_hybrid`, `xgb_pipeline_hybrid`
- Predictions and probabilities: `pred_dt`, `pred_xgb`, `y_pred_dt`, `y_pred_xgb`, `proba_xgb`, `confidence_xgb`, `hybrid_pred`, `use_dt`
- Configuration: `CONF_MARGIN`, `override_rate`, `current_user_values`, `high_risk_intention_values`, `low_risk_intention_values`, `high_risk_INTENTION_USE_values`, `low_risk_INTENTION_USE_values`

## Inputs

- Source data is referenced via `DATA_PATH` inside the notebook.
- The repository includes data folders under:
  - machine-learning/data/raw/
  - machine-learning/data/interim/
  - machine-learning/data/processed/

Confirm that `DATA_PATH` points to the intended file(s) before execution.

## Outputs

- The notebook computes model predictions and probabilities (Decision Tree and XGBoost variants).
- It prepares transformed feature matrices using `preprocessor` (`ColumnTransformer`) and associated pipelines.
- If the notebook persists artifacts (e.g., `.joblib` files), they should appear under machine-learning/src/models/piplines/ (naming like `dt_pipeline.joblib`, `xgb_pipeline.joblib`, `preprocessor.joblib`, etc.). If not, add explicit save steps.

## Environment Setup

Use the project requirements to ensure consistent library versions.

```powershell
# From the project root
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r machine-learning/requirements.txt
```

If you use conda:

```powershell
conda create -n contraceptiq python=3.11 -y
conda activate contraceptiq
pip install -r machine-learning/requirements.txt
```

## How to Run

- Open the notebook in VS Code or Jupyter and run cells in order.
- Ensure `DATA_PATH` and related configuration values are set appropriately.
- Optional: run programmatically with Papermill to record parameters and outputs:

```powershell
pip install papermill
papermill machine-learning/src/preprocessing/discontinuation_preprocess.ipynb \
          machine-learning/src/preprocessing/discontinuation_preprocess.out.ipynb \
          -p DATA_PATH "machine-learning/data/interim/merged_dataset.csv"
```

## Reproducibility Tips

- Pin versions in `machine-learning/requirements.txt` and avoid mixing package managers.
- Clear previous kernel state before re-running to ensure outputs reflect current code.
- Log seeds and parameters if adding train/test splits or randomness.

## References

- Pipelines and models referenced are also present under machine-learning/src/models/piplines/.
- See the general preprocessing overview in machine-learning/src/preprocessing/DATA_PREPROCESS_DOCUMENTATION.md.
