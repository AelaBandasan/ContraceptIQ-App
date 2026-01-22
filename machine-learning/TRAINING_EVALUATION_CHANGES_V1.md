# Training & Evaluation Changes - Version 1

Documentation of changes made to the training pipeline and evaluation procedures for the High-Recall Discontinuation Risk Model.

---

## 1) Overview of Changes

This document outlines the refactoring and improvements made to:
- **Training pipeline** (`src/models_2/decision_tree.py`, `src/models_2/xgb_model.py`)
- **Evaluation framework** (`src/evaluation/evaluating_baseline.py`)
- **Hybrid model integration** (`src/training/train_hybrid.py`)

The changes enable modular model training, proper preprocessing, and comprehensive hybrid model evaluation.

---

## 2) Training Pipeline Changes

### 2.1 Decision Tree Training (`src/models_2/decision_tree.py`)

**Before:** Manual instantiation, hardcoded paths, no preprocessing.

**After:**
- Loads training data from `machine-learning/data/processed/train_test_data.pkl`
- Builds preprocessor dynamically using `build_preprocessor(X_train)`
- Creates a complete scikit-learn Pipeline: `[preprocessor → DecisionTreeClassifier]`
- Saves trained pipeline to `machine-learning/src/models/dt_pipeline.joblib`
- Uses absolute paths to prevent directory creation issues

**Key parameters:**
```python
DecisionTreeClassifier(
    max_depth=7,
    class_weight="balanced",
    random_state=42
)
```

**Output:** Serialized pipeline ready for inference

---

### 2.2 XGBoost Training (`src/models_2/xgb_model.py`)

**Before:** Incomplete model definition, missing pipeline integration.

**After:**
- Loads training data from `machine-learning/data/processed/train_test_data.pkl`
- Builds preprocessor with the same approach as Decision Tree
- Creates a complete Pipeline: `[preprocessor → XGBClassifier]`
- Saves trained pipeline to `machine-learning/src/models/xgb_pipeline.joblib`
- Computes `scale_pos_weight` dynamically to handle class imbalance

**Key parameters:**
```python
XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=(y_train==0).sum() / (y_train==1).sum(),
    eval_metric="logloss",
    random_state=42
)
```

**Output:** Serialized pipeline ready for inference

---

### 2.3 Data Splitting (`src/training/split.py`)

**Changes:**
- Fixed to load full dataframe from `discontinuation_design1_full_data_v2.pkl` (not the train/test tuple)
- Properly performs train-test split with stratification
- Saves split data to `train_test_data.pkl`

---

## 3) Evaluation Framework Changes

### 3.1 Baseline Model Evaluation (`src/evaluation/evaluating_baseline.py`)

**Before:** Looking for non-existent model files (`dt_high_recall.joblib`, `xgb_high_recall.joblib`).

**After:**
- Loads pipelines from actual saved models: `dt_pipeline.joblib` and `xgb_pipeline.joblib`
- Supports both individual model evaluation and hybrid model evaluation
- Implements `hybrid_predict()` function with upgrade-only rule:
  ```python
  def hybrid_predict(xgb_pipeline, dt_pipeline, X):
      xgb_probs = xgb_pipeline.predict_proba(X)[:, 1]
      xgb_pred = (xgb_probs >= THRESH_XGB).astype(int)
      dt_pred = dt_pipeline.predict(X)
      hybrid_pred = xgb_pred.copy()
      low_conf_mask = np.abs(xgb_probs - THRESH_XGB) < CONF_MARGIN
      upgrade_mask = (low_conf_mask) & (dt_pred == 1)
      hybrid_pred[upgrade_mask] = 1
      return hybrid_pred
  ```

**Evaluation metrics for each model:**
- Precision
- Recall
- F1-score
- ROC-AUC

**Output:** Comparison table with Decision Tree, XGBoost, and Hybrid (DT+XGB) models

---

### 3.2 Hybrid Model Training & Configuration (`src/training/train_hybrid.py`)

**Changes:**
- Updated to load correct pipeline files: `dt_pipeline.joblib` and `xgb_pipeline.joblib`
- Uses configurable threshold (`THRESH_XGB = 0.20`) and confidence margin (`CONF_MARGIN = 0.15`)
- Applies upgrade-only hybrid rule on test data
- Prints detailed performance metrics and override statistics

---

## 4) Preprocessing Integration

### 4.1 Preprocessor Fix (`src/preprocessing/preprocessor.py`)

**Before:** Used deprecated `sparse=False` parameter in OneHotEncoder.

**After:**
```python
OneHotEncoder(handle_unknown="ignore", sparse_output=False)
```

This ensures compatibility with modern scikit-learn versions (1.2+).

---

## 5) File Structure & Saved Artifacts

### Models saved during training:

```
machine-learning/src/models/
├── dt_pipeline.joblib          # Decision Tree + preprocessor
├── xgb_pipeline.joblib         # XGBoost + preprocessor
├── hybrid_model.joblib         # (optional) Serialized hybrid predictions config
└D
```

### Data files:

```
machine-learning/data/processed/
├── train_test_data.pkl         # {"X_train", "X_test", "y_train", "y_test"}
├── discontinuation_design1_full_data_v2.pkl
└── discontinuation_design1_data_v2.pkl
```

---

## 6) Workflow Summary

### Training workflow:

1. **Data split:** `split.py` → `train_test_data.pkl`
2. **Decision Tree training:** `decision_tree.py` → `dt_pipeline.joblib`
3. **XGBoost training:** `xgb_model.py` → `xgb_pipeline.joblib`
4. **Hybrid training:** `train_hybrid.py` → Hybrid predictions on test set

### Evaluation workflow:

1. **Baseline evaluation:** `evaluating_baseline.py`
   - Loads both pipelines
   - Generates individual predictions (DT, XGB)
   - Applies hybrid upgrade-only rule
   - Prints comparison metrics table

---

## 7) Key Improvements Over Version 1

| Aspect | Version 1 | Version 2 |
|--------|-----------|----------|
| **Model paths** | Hardcoded, inconsistent | Dynamic, absolute paths |
| **Preprocessing** | Manual, embedded | Modular, reusable function |
| **Pipeline** | Separate model + preprocessor | Unified sklearn Pipeline |
| **Hybrid evaluation** | Not integrated | Full hybrid prediction + metrics |
| **Serialization** | Mixed formats (.pkl, .joblib) | Consistent .joblib format |
| **Compatibility** | Older sklearn | Modern sklearn (1.2+) |
| **Documentation** | Minimal | Comprehensive |

---

## 8) Configuration Parameters

### Hybrid model tuning:

```python
THRESH_XGB = 0.20          # XGBoost decision threshold for base prediction
CONF_MARGIN = 0.15         # Confidence band for low-confidence zone
```

To adjust recall/precision trade-off:
- **Lower THRESH_XGB** → Higher recall, lower precision
- **Increase CONF_MARGIN** → More upgrades by DT, higher recall
- **Increase scale_pos_weight in XGB** → Emphasize class 1 more

---

## 9) Running the Pipeline

```bash
# 1. Split data
python machine-learning/src/training/split.py

# 2. Train models
python machine-learning/src/models_2/decision_tree.py
python machine-learning/src/models_2/xgb_model.py

# 3. Train and evaluate hybrid
python machine-learning/src/training/train_hybrid.py
python machine-learning/src/evaluation/evaluating_baseline.py
```

---

## 10) Next Steps

- [ ] Save hybrid model predictions/config to file
- [ ] Integrate with mobile app inference pipeline
- [ ] Monitor model performance on production data
- [ ] Retrain periodically with new data
- [ ] Experiment with threshold tuning for business requirements
