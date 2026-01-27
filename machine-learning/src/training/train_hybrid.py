import json
import joblib
import numpy as np
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

# --------------------------------------------------
# CONFIG (match documentation defaults)
# --------------------------------------------------
THRESH_XGB = 0.20          # high-recall threshold
CONF_MARGIN = 0.15         # low-confidence band
SAVE_CONFIG = True

# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------
data = joblib.load(
    "machine-learning/data/processed/train_test_data.pkl"
)

X_test = data["X_test"]
y_test = data["y_test"]

# --------------------------------------------------
# LOAD TRAINED MODELS (PIPELINES)
# --------------------------------------------------
xgb_pipeline = joblib.load(
    "machine-learning/src/models/xgb_pipeline.joblib"
)

dt_pipeline = joblib.load(
    "machine-learning/src/models/dt_pipeline.joblib"
)

# --------------------------------------------------
# PREDICTIONS
# --------------------------------------------------
# XGBoost probabilities
xgb_probs = xgb_pipeline.predict_proba(X_test)[:, 1]

# Base XGB prediction (thresholded)
xgb_pred = (xgb_probs >= THRESH_XGB).astype(int)

# Decision Tree prediction
dt_pred = dt_pipeline.predict(X_test)

# --------------------------------------------------
# HYBRID LOGIC (UPGRADE-ONLY RULE)
# --------------------------------------------------
hybrid_pred = xgb_pred.copy()

low_conf_mask = np.abs(xgb_probs - THRESH_XGB) < CONF_MARGIN

# Upgrade-only: DT can only flip 0 -> 1
upgrade_mask = (low_conf_mask) & (dt_pred == 1)

hybrid_pred[upgrade_mask] = 1

# --------------------------------------------------
# EVALUATION
# --------------------------------------------------
print("\n📊 HYBRID MODEL EVALUATION (DT + XGBoost)\n")

print("Confusion Matrix:")
print(confusion_matrix(y_test, hybrid_pred))

print("\nClassification Report:")
print(classification_report(y_test, hybrid_pred, digits=4))

precision = precision_score(y_test, hybrid_pred)
recall = recall_score(y_test, hybrid_pred)
f1 = f1_score(y_test, hybrid_pred)
roc_auc = roc_auc_score(y_test, xgb_probs)

print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1-score:  {f1:.4f}")
print(f"ROC-AUC (XGB probs): {roc_auc:.4f}")

# --------------------------------------------------
# SAVE HYBRID CONFIG (FOR REPRODUCIBILITY)
# --------------------------------------------------
if SAVE_CONFIG:
    config = {
        "model_type": "DT + XGBoost Hybrid (Upgrade-only)",
        "xgb_threshold": THRESH_XGB,
        "confidence_margin": CONF_MARGIN,
        "rule": "If XGB is low-confidence and DT predicts 1, upgrade to 1",
        "target": "HIGH_RISK_DISCONTINUE"
    }

    # Create models directory if it doesn't exist
    import os
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    config_path = os.path.join(models_dir, "hybrid_config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=4)

    print(f"\n✅ Hybrid configuration saved to {config_path}")
    
    # Save hybrid model wrapper (for easy inference later)
    hybrid_model = {
        "xgb_pipeline": xgb_pipeline,
        "dt_pipeline": dt_pipeline,
        "config": config
    }
    
    hybrid_model_path = os.path.join(models_dir, "hybrid_model.joblib")
    joblib.dump(hybrid_model, hybrid_model_path)
    print(f"✅ Hybrid model saved to {hybrid_model_path}")
print("\n✅ Hybrid model evaluation complete.")