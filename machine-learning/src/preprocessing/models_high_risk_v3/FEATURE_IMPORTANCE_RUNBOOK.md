# Feature Importance Runbook (High-Recall v3)

## Objective

Produce stable, reproducible feature importance for the high-recall hybrid model (XGBoost + DT) and save artifacts (CSV/PNG), without modifying the training notebook.

## Prerequisites

- Python env with project deps: `python -m pip install -r requirements.txt`
- Artifacts present:
  - Trained pipeline: `machine-learning/src/preprocessing/models_high_risk_v3/xgb_high_recall.joblib`
  - Saved splits: `machine-learning/data/processed/discontinuation_design1_data_v2.pkl`
- Working dir: `machine-learning/`

## Runner Script (to add)

Create `machine-learning/src/preprocessing/feature_importance_runner.py` that:

- Loads `discontinuation_design1_data_v2.pkl` (X_train, X_test, y_train, y_test)
- Loads `xgb_high_recall.joblib` (or `xgb_pipeline_v2` equivalent)
- Supports CLI args:
  - `--full-eval` (bool): use full test set vs. sample
  - `--sample-cap` (int, default 500)
  - `--n-repeats` (int, default 20)
  - `--seed` (int, default 42)
  - `--grouped` (bool): produce grouped categorical importances
  - `--shap` (bool): optional SHAP on a 500–1000 row sample
- Writes artifacts under `machine-learning/src/preprocessing/models_high_risk_v3/`:
  - `feature_importance_v3_permutation.csv`
  - `feature_importance_v3_permutation.png`
  - `feature_importance_v3_permutation_grouped.csv` (if grouped)
  - `feature_importance_v3_permutation_grouped.png` (if grouped)
  - `feature_importance_v3_shap_summary.png` and `feature_importance_v3_shap_values.csv` (if shap)

## Suggested Implementation Steps

1. **Load assets**: load split pickle and pipeline joblib.
2. **Select eval set**:
   - If `--full-eval`: X_eval = X_test, y_eval = y_test.
   - Else: sample `min(sample_cap, len(X_test))` rows with seed.
3. **Permutation importance**:
   - Use `sklearn.inspection.permutation_importance` with `n_repeats` and `n_jobs=-1`.
   - Sort by `importance_mean`; save CSV and barh PNG (headless `Agg`).
4. **Grouped importance (categoricals)**:
   - Map one-hot columns back to base field by prefix; sum means/stds per group.
   - Save grouped CSV and PNG (top N=15).
5. **SHAP (optional)**:
   - Sample 500–1000 rows; use TreeExplainer on the XGBoost inside the pipeline (after preprocessing transform).
   - Save SHAP summary plot and per-feature mean |SHAP| CSV.
6. **Logging**: print top 15 features, paths to artifacts, and settings used (full-eval, repeats, seed, sample size).

## Example CLI Flow (to implement in runner)

- Quick sample run: `python feature_importance_runner.py --sample-cap 500 --n-repeats 20`
- Full test run: `python feature_importance_runner.py --full-eval --n-repeats 20`
- With grouped + SHAP: `python feature_importance_runner.py --full-eval --n-repeats 20 --grouped --shap`

## Interpretation Guidance

- Small/negative means near zero usually indicate low or noisy contribution; confirm with full-eval or grouped view before dropping features.
- Prefer grouped importances for high-cardinality categoricals (REGION, PATTERN_USE, etc.).
- Before removing features, run an ablation (retrain without them) and compare recall/precision on class 1.

## Troubleshooting

- Backend errors when plotting: ensure `matplotlib.use("Agg")` in runner before pyplot import.
- Missing artifacts: verify paths in `models_high_risk_v3/` and `data/processed/`.
- Perf: increase `n_repeats` for stability; expect slower runs. For very large evals, consider `sample-cap`.

## Deliverables

- CSV/PNG for permutation importance (raw and grouped)
- Optional SHAP summary plot/CSV
- Console log of top 15 features and run settings
