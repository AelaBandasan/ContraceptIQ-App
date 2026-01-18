# Discontinuation Preprocess V2 — Detailed Walkthrough

Notebook: machine-learning/src/preprocessing/discontinuation_preprocess_v2.ipynb  
Date: 2026-01-18  
OS: Windows

## What this document covers

- Step-by-step narrative of the V2 notebook, cell by cell.
- How the code evolves to prioritize higher recall on the high-risk class.
- Where artifacts are saved and how to rerun or retune thresholds.

## Cell-by-cell guide

1. Data load, targeting, and features (Cell 1)

- Load merged data from `DATA_PATH` and restrict to current users only.
- Define `HIGH_RISK_DISCONTINUE` using only intention signals (no history leakage):
  - Intention columns combined into a high-risk vs. low-risk label; ambiguous rows dropped.
- Build feature lists (demographics, fertility, method) and exclude leakage columns (`CONTRACEPTIVE_USE_AND_INTENTION`, `INTENTION_USE`, the target).
- Split stratified train/test and auto-detect numeric vs. categorical features.
- Preprocess with imputation + one-hot encoding via `ColumnTransformer`.
- Train two baselines:
  - XGBoost (balanced params, default threshold 0.5).
  - Decision Tree (balanced class_weight, depth 5).
- Build a hybrid: start from XGBoost probability, override low-confidence cases (|p-0.5|<CONF_MARGIN) with the Decision Tree prediction.

2. Persist core datasets and baseline models (Cell 2)

- Save train/test splits and `df_model_d1` to machine-learning/data/processed.
- Save fitted pipelines (baseline XGBoost/Decision Tree + hybrid) to machine-learning/src/models/.

3. High-recall v2 models (Cell 3)

- Compute class imbalance and boost `scale_pos_weight` for XGBoost v2; deepen/weight the Decision Tree v2.
- Fit v2 pipelines and print reports at the default 0.5 threshold.
- Scan multiple thresholds (0.50→0.15) to see recall/precision trade-offs.
- Create a high-recall hybrid v2:
  - Lower XGBoost threshold (`THRESH_V2`, default 0.20).
  - Define low-confidence band (`CONF_MARGIN_V2`, default 0.15).
  - Upgrade-only rule: if XGBoost is low-confidence and Decision Tree v2 predicts 1, set final = 1.

4. High-recall v3 (more aggressive) (Cell 4)

- Reuse v2 models but lower threshold further (`THRESH_V3`=0.15) and widen band (`CONF_MARGIN_V3`=0.20).
- Apply the same upgrade-only rule to push recall higher.

5. Export high-recall pipelines and config (Cell 5)

- Alias `xgb_pipeline_v2`/`dt_pipeline_v2` as production high-recall models.
- Save to `models_high_risk_v3/`:
  - `xgb_high_recall.joblib`
  - `dt_high_recall.joblib`
  - `hybrid_v3_config.json` capturing thresholds, weights, and the upgrade-only rule.

## How recall is increased across versions

- Class weighting: v2 XGBoost uses boosted `scale_pos_weight`; v2 DT uses stronger class_weight and depth.
- Threshold lowering: move from 0.50 to 0.20 (v2) and 0.15 (v3) to favor positives.
- Confidence band overrides: when XGBoost is near the threshold, allow DT to upgrade to 1 (never downgrade), increasing recall while limiting precision loss.
- Iterative tuning knobs to reach target recall:
  - `scale_pos_weight_v2`: raise to emphasize class 1 errors.
  - `THRESH_V2`/`THRESH_V3`: lower to capture more positives.
  - `CONF_MARGIN_V2`/`CONF_MARGIN_V3`: widen to let DT upgrade more cases.

## Inputs

- Source data: machine-learning/data/interim/merged_dataset.csv (via `DATA_PATH`).
- Feature logic and preprocessing live in Cell 1; adjust `feature_cols_*` if schema changes.

## Outputs and artifacts

- Processed data: machine-learning/data/processed/discontinuation_design1_data_v2.pkl, discontinuation_design1_full_data_v2.pkl.
- Models (v1 baseline): machine-learning/src/models/discontinuation*design1*\*\_d1_v2.pkl.
- High-recall exports: machine-learning/src/preprocessing/models_high_risk_v3/ (XGBoost, Decision Tree, hybrid config).

## How to rerun and retune

- Run cells in order to regenerate data, models, and reports.
- To target a specific recall:
  1. Adjust `scale_pos_weight_v2` and rerun Cell 3.
  2. Adjust `THRESH_V2`/`THRESH_V3` and `CONF_MARGIN_V2`/`CONF_MARGIN_V3` and rerun Cells 3–4.
  3. Re-run Cell 5 to export updated pipelines and config.

## Environment setup

```powershell
# From repo root
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r machine-learning/requirements.txt
```

## Quick usage hints

- For inference, load `xgb_high_recall.joblib`, `dt_high_recall.joblib`, and read thresholds from `hybrid_v3_config.json` to reproduce the upgrade-only rule.
- Keep preprocessing aligned: these pipelines already include the `preprocessor`; feed raw feature columns as defined in Cell 1.
