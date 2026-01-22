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

# --------------------------
# LOAD DATA
# --------------------------
data = joblib.load("machine-learning/data/processed/train_test_data.pkl")
X_test = data["X_test"]
y_test = data["y_test"]

# --------------------------
# LOAD MODELS
# --------------------------
dt_pipeline = joblib.load("machine-learning/src/models/dt_pipeline.joblib")
xgb_pipeline = joblib.load("machine-learning/src/models/xgb_pipeline.joblib")

models = {
    "Decision Tree": dt_pipeline,
    "XGBoost": xgb_pipeline,
}

# Hybrid config for upgrade-only rule
hybrid_config_path = "machine-learning/src/models/hybrid_config.json"
try:
    import json
    with open(hybrid_config_path) as f:
        config = json.load(f)
    THRESH_XGB = config["xgb_threshold"]
    CONF_MARGIN = config["confidence_margin"]
except Exception:
    # fallback to defaults
    THRESH_XGB = 0.20
    CONF_MARGIN = 0.15

# --------------------------
# HELPER FUNCTION FOR HYBRID
# --------------------------
def hybrid_predict(xgb_pipeline, dt_pipeline, X):
    """Apply the upgrade-only hybrid rule"""
    xgb_probs = xgb_pipeline.predict_proba(X)[:, 1]
    xgb_pred = (xgb_probs >= THRESH_XGB).astype(int)
    dt_pred = dt_pipeline.predict(X)
    hybrid_pred = xgb_pred.copy()
    low_conf_mask = np.abs(xgb_probs - THRESH_XGB) < CONF_MARGIN
    upgrade_mask = (low_conf_mask) & (dt_pred == 1)
    hybrid_pred[upgrade_mask] = 1
    return hybrid_pred

# --------------------------
# EVALUATE MODELS
# --------------------------
results = []

for name, model in models.items():
    y_pred = model.predict(X_test)
    if hasattr(model, "predict_proba"):
        y_probs = model.predict_proba(X_test)[:, 1]
    else:
        y_probs = y_pred  # fallback

    # Metrics
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_probs)

    results.append({
        "Model": name,
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
        "ROC-AUC": roc_auc
    })

# Evaluate Hybrid (upgrade-only rule)
hybrid_pred = hybrid_predict(xgb_pipeline, dt_pipeline, X_test)
hybrid_probs = xgb_pipeline.predict_proba(X_test)[:, 1]

hybrid_precision = precision_score(y_test, hybrid_pred)
hybrid_recall = recall_score(y_test, hybrid_pred)
hybrid_f1 = f1_score(y_test, hybrid_pred)
hybrid_roc_auc = roc_auc_score(y_test, hybrid_probs)

results.append({
    "Model": "Hybrid (DT+XGB)",
    "Precision": hybrid_precision,
    "Recall": hybrid_recall,
    "F1": hybrid_f1,
    "ROC-AUC": hybrid_roc_auc
})

# --------------------------
# PRINT RESULTS TABLE
# --------------------------
import pandas as pd

results_df = pd.DataFrame(results)
results_df = results_df.sort_values(by="Recall", ascending=False).reset_index(drop=True)

print("\n📊 BASELINE VS HYBRID PERFORMANCE")
print(results_df)
