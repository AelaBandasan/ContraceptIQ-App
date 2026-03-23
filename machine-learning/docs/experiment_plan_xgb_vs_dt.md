## Experiment Plan: XGBoost-Primary vs Decision-Tree-Primary Hybrid

**Goal**: Compare two hybrid ordering strategies using the same v4 dataset and preprocessing:
- Current: XGBoost primary + low-confidence upgrade via Decision Tree
- Variant: Decision Tree primary + low-confidence upgrade via XGBoost

**Success Criteria**: Determine if reversing the primary model yields equal or better AUPRC/ROC-AUC, calibration, and practical operating points (precision/recall at chosen thresholds), without degrading subgroup fairness.

---

### 1) Data & Splits
- Use the v4 dataset and splits already employed for v4 (train/val/test). Reuse the same preprocessing pipeline and feature mappings.
- Confirm paths:
  - Raw: `machine-learning/data/raw/evaluation-3-20.csv` (and any v4 raw sources used).
  - Processed: `machine-learning/data/processed/train_test_data.pkl` (or the v4 processed artifacts).
  - Preprocessing: `src/preprocessing/preprocessor.py` and associated configs.

### 2) Models to Evaluate
1) **XGB-primary hybrid (baseline)**
   - Base scorer: XGBoost (v4 tuned params).
   - Upgrade band: threshold = 0.25, conf_margin = 0.05.
   - Secondary: Decision Tree only inside low-confidence band.

2) **DT-primary hybrid (variant)**
   - Base scorer: Decision Tree (same tree as in hybrid_v4 assets).
   - Upgrade band: mirrored logic—Decision Tree probability near its decision threshold triggers XGBoost as secondary; XGBoost can upgrade LOW→HIGH in that band.
   - Keep thresholds aligned initially (start with 0.25 and ±0.05 band) for comparability; consider grid search later.

### 3) Protocol
- Use identical preprocessing and feature encoding as v4 (no schema changes).
- Run both hybrids on the same train/val/test splits.
- Evaluate at multiple operating points:
  - Default threshold 0.25
  - Precision-oriented: adjust threshold to match v4 precision or higher
  - Recall-oriented: adjust threshold to match v4 recall or higher
- If time permits: small grid over threshold ∈ {0.20, 0.25, 0.30, 0.35} and conf_margin ∈ {0.03, 0.05, 0.07}.

### 4) Metrics to Capture
- Primary: AUPRC (PR-AUC)
- Secondary: ROC-AUC, Brier score, Expected Calibration Error (ECE), reliability curves
- Operating points: precision, recall, F1 at selected thresholds; confusion matrix
- Fairness: subgroup AUPRC/TPR deltas by key demographics (age bands, smoking status, comorbidity clusters if available)

### 5) Outputs
- Tables/CSVs of metrics for both hybrids on val and test.
- Plots: PR curves, ROC curves, calibration curves for both variants.
- A short comparison note: does DT-primary ever dominate XGB-primary on AUPRC/ROC or calibration? Any subgroup regressions?

### 6) Implementation Notes
- Reuse existing v4 training/eval scripts:
  - Reference: `src/models/train_v4.py`, `src/evaluation/evaluate_v4.py`, `src/models_2/hybrid_voting.py` (for hybrid wiring), and ONNX/Joblib assets in `src/models/piplines`.
- Add a small runner to swap primary/secondary ordering without changing preprocessing.
- Keep seeds/splits fixed for reproducibility.

### 7) Next Steps (after plan approval)
- Implement the DT-primary runner with mirrored low-confidence upgrade logic.
- Execute evaluations on val/test splits.
- Summarize results and recommend operating threshold per strategy.
