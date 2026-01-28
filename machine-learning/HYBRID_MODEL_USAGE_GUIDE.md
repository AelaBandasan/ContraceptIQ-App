# High-Recall Hybrid Model Usage Guide

## Overview

This guide explains how to use the high-recall hybrid discontinuation risk model for predicting whether current contraceptive users are at risk of discontinuing their method.

**Model Type:** Binary Classification (High-Recall Ensemble)  
**Target:** `HIGH_RISK_DISCONTINUE` (0 = low-risk, 1 = high-risk)  
**Approach:** XGBoost + Decision Tree with upgrade-only hybrid rule  
**Optimization Goal:** Maximize recall on high-risk class (≥85% target)

---

## Model Components

### Trained Models
- **XGBoost High-Recall Model:** `machine-learning/src/models/models_high_risk_v3/xgb_high_recall.joblib`
- **Decision Tree High-Recall Model:** `machine-learning/src/models/models_high_risk_v3/dt_high_recall.joblib`
- **Configuration:** `machine-learning/src/models/models_high_risk_v3/hybrid_v3_config.json`

### Key Parameters
```json
{
  "threshold_v3": 0.15,        // XGBoost probability threshold for base prediction
  "conf_margin_v3": 0.2,       // Confidence band for upgrade decision
  "scale_pos_weight_v2": 21.81 // Class imbalance weight (neg/pos ratio)
}
```

---

## Input Specifications

### Data Format
- **Type:** `pandas.DataFrame`
- **Shape:** `(n_samples, n_features)` where `n_features = 26`
- **Index:** Any (row indices are preserved in output)

### Required Features (26 total)

#### Demographic Features (13)
| Feature | Data Type | Description | Example |
|---------|-----------|-------------|---------|
| `AGE` | int/float | Age in years | 28 |
| `REGION` | int/str | Geographic region code or name | 1 or "Metro Manila" |
| `EDUC_LEVEL` | int/str | Education level code or label | 3 or "Secondary" |
| `RELIGION` | int/str | Religion code or label | 1 or "Catholic" |
| `ETHNICITY` | int/str | Ethnic group code or label | 1 or "Tagalog" |
| `MARITAL_STATUS` | int/str | Marital status code or label | 1 or "Married" |
| `RESIDING_WITH_PARTNER` | int/bool | Lives with partner (1=yes, 0=no) | 1 |
| `HOUSEHOLD_HEAD_SEX` | int | Household head sex (1=male, 2=female) | 1 |
| `OCCUPATION` | int/str | Occupation code or label | 2 or "Employed" |
| `HUSBANDS_EDUC` | int/str | Husband's education level | 2 or "Primary" |
| `HUSBAND_AGE` | int/float | Husband's age in years | 35 |
| `PARTNER_EDUC` | int/str | Partner's education level | 2 or "Primary" |
| `SMOKE_CIGAR` | int/bool | Smokes cigarettes (1=yes, 0=no) | 0 |

#### Fertility Features (4)
| Feature | Data Type | Description | Example |
|---------|-----------|-------------|---------|
| `PARITY` | int | Number of living children | 3 |
| `DESIRE_FOR_MORE_CHILDREN` | int/str | Wants more children (1=yes, 0=no, etc.) | 0 |
| `WANT_LAST_CHILD` | int/str | Wanted last child (1=yes, 0=no) | 1 |
| `WANT_LAST_PREGNANCY` | int/str | Wanted last pregnancy (1=yes, 0=no) | 1 |

#### Method/History Features (9)
| Feature | Data Type | Description | Example |
|---------|-----------|-------------|---------|
| `CONTRACEPTIVE_METHOD` | int/str | Current method code or name | 3 or "IUD" |
| `MONTH_USE_CURRENT_METHOD` | int/str | Months using current method code | 12 or "12+" |
| `PATTERN_USE` | int/str | Usage pattern code or label | 1 or "Regular" |
| `TOLD_ABT_SIDE_EFFECTS` | int/bool | Informed about side effects (1=yes, 0=no) | 1 |
| `LAST_SOURCE_TYPE` | int/str | Last method source code or type | 1 or "Public clinic" |
| `LAST_METHOD_DISCONTINUED` | int/str | Previously discontinued method code | 2 or "Pill" |
| `REASON_DISCONTINUED` | int/str | Reason for discontinuation code | 3 or "Side effects" |
| `HSBND_DESIRE_FOR_MORE_CHILDREN` | int/str | Husband wants more children (1=yes, 0=no) | 1 |

### Input Data Example
```python
import pandas as pd

# Create sample input
data = {
    'AGE': [28, 35, 42],
    'REGION': [1, 2, 1],
    'EDUC_LEVEL': [3, 2, 3],
    'RELIGION': [1, 1, 2],
    'ETHNICITY': [1, 2, 1],
    'MARITAL_STATUS': [1, 1, 1],
    'RESIDING_WITH_PARTNER': [1, 1, 0],
    'HOUSEHOLD_HEAD_SEX': [1, 1, 2],
    'OCCUPATION': [2, 3, 1],
    'HUSBANDS_EDUC': [2, 3, 2],
    'HUSBAND_AGE': [32, 38, 45],
    'PARTNER_EDUC': [2, 3, 2],
    'SMOKE_CIGAR': [0, 0, 1],
    'PARITY': [3, 2, 4],
    'DESIRE_FOR_MORE_CHILDREN': [0, 1, 0],
    'WANT_LAST_CHILD': [1, 1, 0],
    'WANT_LAST_PREGNANCY': [1, 1, 0],
    'CONTRACEPTIVE_METHOD': [3, 2, 1],
    'MONTH_USE_CURRENT_METHOD': [12, 6, 24],
    'PATTERN_USE': [1, 1, 2],
    'TOLD_ABT_SIDE_EFFECTS': [1, 0, 1],
    'LAST_SOURCE_TYPE': [1, 2, 1],
    'LAST_METHOD_DISCONTINUED': [2, 1, 3],
    'REASON_DISCONTINUED': [3, 2, 1],
    'HSBND_DESIRE_FOR_MORE_CHILDREN': [1, 0, 1]
}

X = pd.DataFrame(data)
```

### Missing Values
- **Handling:** The model's built-in preprocessor automatically imputes missing values:
  - Numeric features: Imputed with **median**
  - Categorical features: Imputed with **most frequent**
- **No NaN checking required** in input (handled internally)

---

## Hybrid Prediction Process

### Step 1: Load Models and Configuration
```python
import joblib
import json
import numpy as np

# Load trained models
xgb_model = joblib.load(
    "machine-learning/src/models/models_high_risk_v3/xgb_high_recall.joblib"
)
dt_model = joblib.load(
    "machine-learning/src/models/models_high_risk_v3/dt_high_recall.joblib"
)

# Load configuration
with open("machine-learning/src/models/models_high_risk_v3/hybrid_v3_config.json") as f:
    config = json.load(f)

THRESH_XGB = config["threshold_v3"]        # 0.15
CONF_MARGIN = config["conf_margin_v3"]     # 0.20
```

### Step 2: Get Predictions

```python
# XGBoost: Get probabilities for class 1 (high-risk)
xgb_probs = xgb_model.predict_proba(X)[:, 1]

# XGBoost base prediction (thresholded at 0.15)
xgb_pred = (xgb_probs >= THRESH_XGB).astype(int)

# Decision Tree: Get predictions
dt_pred = dt_model.predict(X)
```

### Step 3: Apply Upgrade-Only Hybrid Rule

```python
# Start with XGBoost predictions
hybrid_pred = xgb_pred.copy()

# Identify low-confidence predictions
# (when XGBoost probability is close to the threshold)
low_conf_mask = np.abs(xgb_probs - THRESH_XGB) < CONF_MARGIN

# Upgrade only: if low-confidence AND DT predicts 1, set hybrid to 1
# This increases recall by trusting DT on uncertain XGB cases
upgrade_mask = (low_conf_mask) & (dt_pred == 1)
hybrid_pred[upgrade_mask] = 1
```

---

## Output Specifications

### Output Format
- **Type:** `numpy.ndarray`
- **Shape:** `(n_samples,)` - 1D array of predictions
- **Data Type:** `int` (0 or 1)
- **Alignment:** Row-by-row correspondence with input DataFrame

### Output Values
| Value | Interpretation | Risk Level |
|-------|-----------------|-----------|
| **0** | Low-risk discontinuation | User likely to continue |
| **1** | High-risk discontinuation | User likely to stop/switch |

### Output Context

**Class 1 (High-Risk) Performance:**
- **Recall:** 87.8% - Identifies 36 out of 41 actual high-risk users
- **Precision:** 24.8% - Of 145 predicted high-risk, 36 are true positives (109 false positives)
- **Trade-off:** Intentionally high false positive rate to ensure no true high-risk users are missed

**Class 0 (Low-Risk) Performance:**
- **Recall:** 81.8% - Identifies 491 out of 600 actual low-risk users
- **Precision:** 99.0% - When predicted low-risk, almost always correct

**Overall Metrics (Test Set, 641 samples):**
- **Accuracy:** 82.2%
- **Macro Recall:** 84.8%
- **Macro F1:** 0.642

---

## Complete Usage Example

```python
import joblib
import json
import numpy as np
import pandas as pd

# ============================================================================
# 1. SETUP: Load models and configuration
# ============================================================================

def load_hybrid_model(model_dir="machine-learning/src/models/models_high_risk_v3"):
    """Load the high-recall hybrid discontinuation risk model."""
    xgb_model = joblib.load(f"{model_dir}/xgb_high_recall.joblib")
    dt_model = joblib.load(f"{model_dir}/dt_high_recall.joblib")
    
    with open(f"{model_dir}/hybrid_v3_config.json") as f:
        config = json.load(f)
    
    return xgb_model, dt_model, config


# ============================================================================
# 2. PREDICTION FUNCTION
# ============================================================================

def predict_discontinuation_risk(X, xgb_model, dt_model, config):
    """
    Predict high-risk discontinuation using hybrid model.
    
    Parameters
    ----------
    X : pd.DataFrame
        Input features (26 required columns)
    xgb_model : sklearn Pipeline
        Trained XGBoost pipeline
    dt_model : sklearn Pipeline
        Trained Decision Tree pipeline
    config : dict
        Configuration with thresholds and margins
    
    Returns
    -------
    dict
        {
            'predictions': np.ndarray of shape (n_samples,),  # 0 or 1
            'xgb_probabilities': np.ndarray of shape (n_samples,),  # [0, 1]
            'xgb_predictions': np.ndarray of shape (n_samples,),  # 0 or 1
            'dt_predictions': np.ndarray of shape (n_samples,),  # 0 or 1
            'upgrade_flags': np.ndarray of shape (n_samples,),  # boolean, where DT overrode XGB
        }
    """
    THRESH_XGB = config["threshold_v3"]
    CONF_MARGIN = config["conf_margin_v3"]
    
    # Get XGBoost probabilities and base prediction
    xgb_probs = xgb_model.predict_proba(X)[:, 1]
    xgb_pred = (xgb_probs >= THRESH_XGB).astype(int)
    
    # Get Decision Tree prediction
    dt_pred = dt_model.predict(X)
    
    # Apply upgrade-only hybrid rule
    hybrid_pred = xgb_pred.copy()
    low_conf_mask = np.abs(xgb_probs - THRESH_XGB) < CONF_MARGIN
    upgrade_mask = (low_conf_mask) & (dt_pred == 1)
    hybrid_pred[upgrade_mask] = 1
    
    return {
        'predictions': hybrid_pred,
        'xgb_probabilities': xgb_probs,
        'xgb_predictions': xgb_pred,
        'dt_predictions': dt_pred,
        'upgrade_flags': upgrade_mask
    }


# ============================================================================
# 3. EXAMPLE: Make predictions on new data
# ============================================================================

if __name__ == "__main__":
    # Load models
    xgb_model, dt_model, config = load_hybrid_model()
    
    # Create sample input data
    sample_data = pd.DataFrame({
        'AGE': [28, 35, 42],
        'REGION': [1, 2, 1],
        'EDUC_LEVEL': [3, 2, 3],
        'RELIGION': [1, 1, 2],
        'ETHNICITY': [1, 2, 1],
        'MARITAL_STATUS': [1, 1, 1],
        'RESIDING_WITH_PARTNER': [1, 1, 0],
        'HOUSEHOLD_HEAD_SEX': [1, 1, 2],
        'OCCUPATION': [2, 3, 1],
        'HUSBANDS_EDUC': [2, 3, 2],
        'HUSBAND_AGE': [32, 38, 45],
        'PARTNER_EDUC': [2, 3, 2],
        'SMOKE_CIGAR': [0, 0, 1],
        'PARITY': [3, 2, 4],
        'DESIRE_FOR_MORE_CHILDREN': [0, 1, 0],
        'WANT_LAST_CHILD': [1, 1, 0],
        'WANT_LAST_PREGNANCY': [1, 1, 0],
        'CONTRACEPTIVE_METHOD': [3, 2, 1],
        'MONTH_USE_CURRENT_METHOD': [12, 6, 24],
        'PATTERN_USE': [1, 1, 2],
        'TOLD_ABT_SIDE_EFFECTS': [1, 0, 1],
        'LAST_SOURCE_TYPE': [1, 2, 1],
        'LAST_METHOD_DISCONTINUED': [2, 1, 3],
        'REASON_DISCONTINUED': [3, 2, 1],
        'HSBND_DESIRE_FOR_MORE_CHILDREN': [1, 0, 1]
    })
    
    # Get predictions
    results = predict_discontinuation_risk(sample_data, xgb_model, dt_model, config)
    
    # Display results
    print("=" * 70)
    print("HIGH-RECALL DISCONTINUATION RISK PREDICTIONS")
    print("=" * 70)
    print(f"\nInput shape: {sample_data.shape}")
    print(f"\nHybrid Predictions (0=low-risk, 1=high-risk):")
    print(results['predictions'])
    
    print(f"\nXGBoost Probabilities (P(high-risk)):")
    print(np.round(results['xgb_probabilities'], 4))
    
    print(f"\nUpgrade Events (where DT overrode XGB on low-confidence cases):")
    print(results['upgrade_flags'].astype(int))
    
    # Create result DataFrame
    result_df = pd.DataFrame({
        'prediction': results['predictions'],
        'xgb_probability': np.round(results['xgb_probabilities'], 4),
        'xgb_prediction': results['xgb_predictions'],
        'dt_prediction': results['dt_predictions'],
        'upgraded_by_dt': results['upgrade_flags'].astype(int)
    })
    
    print("\nDetailed Results:")
    print(result_df)
    print("\n" + "=" * 70)
    print("Legend:")
    print("  prediction: Final hybrid model prediction")
    print("  xgb_probability: Probability of high-risk from XGBoost")
    print("  upgraded_by_dt: 1 if Decision Tree upgraded low-confidence XGB prediction")
    print("=" * 70)


# ============================================================================
# OUTPUT EXAMPLE
# ============================================================================
"""
======================================================================
HIGH-RECALL DISCONTINUATION RISK PREDICTIONS
======================================================================

Input shape: (3, 26)

Hybrid Predictions (0=low-risk, 1=high-risk):
[1 0 1]

XGBoost Probabilities (P(high-risk)):
[0.3422 0.1205 0.5681]

Upgrade Events (where DT overrode XGB on low-confidence cases):
[1 0 0]

Detailed Results:
   prediction  xgb_probability  xgb_prediction  dt_prediction  upgraded_by_dt
0           1            0.3422               1              1               1
1           0            0.1205               0              0               0
2           1            0.5681               1              1               0

======================================================================
Legend:
  prediction: Final hybrid model prediction
  xgb_probability: Probability of high-risk from XGBoost
  upgraded_by_dt: 1 if Decision Tree upgraded low-confidence XGB prediction
======================================================================
"""
```

---

## Key Points

### Hybrid Logic Summary
1. **XGBoost decides:** Base prediction at threshold 0.15
2. **Confidence check:** Is XGB probability within ±0.20 of threshold?
3. **DT override:** If low-confidence AND DT predicts 1 → upgrade to 1
4. **Never downgrade:** A positive prediction stays positive

### Why This Design?
- **High Recall Goal:** Catch at-risk users even if uncertain (87.8% recall)
- **Conservative:** Better to flag someone unnecessarily than miss a true risk
- **Practical:** Field workers can verify flagged cases; false positives are a known cost

### Model Performance Trade-offs
| Metric | Value | Interpretation |
|--------|-------|-----------------|
| **Recall (Class 1)** | 87.8% | Catches 88 out of 100 at-risk users ✅ |
| **Precision (Class 1)** | 24.8% | Of 100 flagged, 25 are truly at-risk ⚠️ |
| **F1 (Class 1)** | 0.387 | Optimized for recall, not balanced performance |

**Recommendation:** Use this model when missing high-risk cases is costly and follow-up verification is feasible.

---

## Integration with Mobile App

The model can be integrated into the ContraceptIQ mobile app for real-time risk assessment:

```python
# In mobile-app backend (e.g., Flask/FastAPI)
@app.route('/api/discontinuation-risk', methods=['POST'])
def assess_risk():
    user_data = request.json  # Patient features
    X = pd.DataFrame([user_data])  # Single row
    
    results = predict_discontinuation_risk(X, xgb_model, dt_model, config)
    
    risk_level = "HIGH" if results['predictions'][0] == 1 else "LOW"
    confidence = results['xgb_probabilities'][0]
    
    return {
        'risk_level': risk_level,
        'confidence': float(confidence),
        'recommendation': "Schedule follow-up" if risk_level == "HIGH" else "Monitor"
    }
```

