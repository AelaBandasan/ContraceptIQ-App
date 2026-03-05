"""
train_v4.py

Retrains the hybrid XGBoost + Decision Tree model on the 10-feature
reduced_C feature set (winner from the feature-reduction experiment).

Saves to:
    machine-learning/src/models/models_high_risk_v4/
        xgb_high_recall.joblib
        dt_high_recall.joblib
        hybrid_v4_config.json

Usage:
    python src/models/train_v4.py

Hyperparameters are identical to v3; only the feature set changes.
The winning config (threshold=0.10, conf_margin=0.20) is taken directly
from the experiment output at:
    machine-learning/experiments/feature-reduction/results/feature_reduction_config.json
"""

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier

# ============================================================================
# PATHS  (all resolved relative to this file — no CWD assumptions)
# ============================================================================

_HERE = Path(__file__).resolve().parent          # machine-learning/src/models/
_SRC  = _HERE.parent                             # machine-learning/src/
_ML   = _SRC.parent                              # machine-learning/
_PROJ = _ML.parent                               # repo root

DATA_PKL        = _ML / "data" / "processed" / "discontinuation_design1_data_v2.pkl"
EXPERIMENT_CFG  = _ML / "experiments" / "feature-reduction" / "results" / "feature_reduction_config.json"
OUTPUT_DIR      = _HERE / "models_high_risk_v4"

# Preprocessor lives in machine-learning/src/preprocessing/
sys.path.insert(0, str(_SRC))
from preprocessing.preprocessor import build_preprocessor  # noqa: E402

# ============================================================================
# WINNING FEATURE SET  (reduced_C — 10 features)
# ============================================================================

REDUCED_C_FEATURES = [
    "REGION",
    "CONTRACEPTIVE_METHOD",
    "RELIGION",
    "HUSBAND_AGE",
    "PARITY",
    "AGE",
    "REASON_DISCONTINUED",
    "HUSBANDS_EDUC",
    "MARITAL_STATUS",
    "PATTERN_USE",
]

# ============================================================================
# HYPERPARAMETERS  (mirrors v3 exactly)
# ============================================================================

XGB_PARAMS = {
    "n_estimators":     300,
    "max_depth":        5,
    "learning_rate":    0.05,
    "subsample":        0.8,
    "colsample_bytree": 0.8,
    "eval_metric":      "logloss",
    "tree_method":      "hist",
    "random_state":     42,
}

DT_PARAMS = {
    "max_depth":        6,
    "class_weight":     {0: 1.0, 1: 3.0},
    "min_samples_leaf": 20,
    "criterion":        "gini",
    "splitter":         "best",
    "random_state":     42,
}

# Winning inference settings from experiment
THRESHOLD  = 0.10
CONF_MARGIN = 0.20

# ============================================================================
# HELPERS
# ============================================================================

def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Load the v2 processed data pickle and select the 10-feature subset."""
    print(f"Loading data from {DATA_PKL} ...")
    X_train_full, X_test_full, y_train, y_test = joblib.load(DATA_PKL)

    # Validate that every required feature is present in the pickle
    missing = [f for f in REDUCED_C_FEATURES if f not in X_train_full.columns]
    if missing:
        raise ValueError(f"Features missing from data pickle: {missing}")

    X_train = X_train_full[REDUCED_C_FEATURES].copy()
    X_test  = X_test_full[REDUCED_C_FEATURES].copy()

    print(f"  X_train shape : {X_train.shape}")
    print(f"  X_test shape  : {X_test.shape}")
    print(f"  Train class dist: {dict(y_train.value_counts().sort_index())}")
    print(f"  Test class dist : {dict(y_test.value_counts().sort_index())}")
    return X_train, X_test, y_train, y_test


def build_and_fit_xgb(X_train: pd.DataFrame, y_train: pd.Series) -> Pipeline:
    n_pos = int((y_train == 1).sum())
    n_neg = int((y_train == 0).sum())
    scale_pos_weight = n_neg / n_pos
    print(f"  scale_pos_weight = {scale_pos_weight:.4f}  "
          f"(n_neg={n_neg}, n_pos={n_pos})")

    xgb = XGBClassifier(**XGB_PARAMS, scale_pos_weight=scale_pos_weight)
    preprocessor = build_preprocessor(X_train)
    pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", xgb)])
    pipeline.fit(X_train, y_train)
    return pipeline


def build_and_fit_dt(X_train: pd.DataFrame, y_train: pd.Series) -> Pipeline:
    dt = DecisionTreeClassifier(**DT_PARAMS)
    preprocessor = build_preprocessor(X_train)
    pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", dt)])
    pipeline.fit(X_train, y_train)
    return pipeline


def evaluate_hybrid(
    xgb_pipeline: Pipeline,
    dt_pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict:
    """Run hybrid inference and return classification metrics."""
    from sklearn.metrics import (
        recall_score, precision_score, f1_score, roc_auc_score,
        classification_report,
    )

    xgb_probs = xgb_pipeline.predict_proba(X_test)[:, 1]
    xgb_preds = (xgb_probs >= THRESHOLD).astype(int)
    dt_preds  = dt_pipeline.predict(X_test)

    hybrid = xgb_preds.copy()
    low_conf = np.abs(xgb_probs - THRESHOLD) < CONF_MARGIN
    upgrade  = low_conf & (dt_preds == 1)
    hybrid[upgrade] = 1

    recall    = recall_score(y_test, hybrid)
    precision = precision_score(y_test, hybrid, zero_division=0)
    f1        = f1_score(y_test, hybrid)
    roc_auc   = roc_auc_score(y_test, xgb_probs)

    print("\n  Classification Report:")
    print(classification_report(y_test, hybrid, target_names=["LOW", "HIGH"]))
    print(f"  recall   = {recall:.4f}")
    print(f"  precision= {precision:.4f}")
    print(f"  f1       = {f1:.4f}")
    print(f"  roc_auc  = {roc_auc:.4f}")

    return {
        "recall": round(recall, 5),
        "precision": round(precision, 6),
        "f1": round(f1, 5),
        "roc_auc": round(roc_auc, 6),
        "meets_target": recall > 0.87,
    }


def save_config(metrics: dict) -> None:
    """Write hybrid_v4_config.json alongside the saved models."""
    config = {
        "description": "Hybrid v4: reduced_C 10-feature high-recall model",
        "xgb_model_file": "xgb_high_recall.joblib",
        "dt_model_file":  "dt_high_recall.joblib",
        "onnx_xgb_file":  "xgb_high_recall.onnx",
        "onnx_dt_file":   "dt_high_recall.onnx",
        "features": REDUCED_C_FEATURES,
        "n_features": len(REDUCED_C_FEATURES),
        "threshold_v4": THRESHOLD,
        "conf_margin_v4": CONF_MARGIN,
        "hybrid_rule": "upgrade_only_if_low_confidence_and_dt_predicts_1",
        "target_name": "HIGH_RISK_DISCONTINUE",
        "xgb_params": XGB_PARAMS,
        "dt_params": {k: str(v) if not isinstance(v, (int, float, str, bool)) else v
                      for k, v in DT_PARAMS.items()},
        "eval_metrics": metrics,
        "notes": (
            "Retrained on 10-feature reduced_C set (winner of feature-reduction "
            "experiment). Threshold lowered from 0.15 (v3) to 0.10 to maximise "
            "recall while holding conf_margin at 0.20."
        ),
    }

    config_path = OUTPUT_DIR / "hybrid_v4_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    print(f"\n  Config saved to {config_path}")


# ============================================================================
# MAIN
# ============================================================================

def main() -> None:
    print("=" * 60)
    print("ContraceptIQ -- Train v4 (reduced_C, 10 features)")
    print("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # --- Load data ---
    X_train, X_test, y_train, y_test = load_data()

    # --- Train XGBoost ---
    print("\nTraining XGBoost pipeline ...")
    xgb_pipeline = build_and_fit_xgb(X_train, y_train)
    xgb_path = OUTPUT_DIR / "xgb_high_recall.joblib"
    joblib.dump(xgb_pipeline, xgb_path)
    print(f"  Saved -> {xgb_path}")

    # --- Train Decision Tree ---
    print("\nTraining Decision Tree pipeline ...")
    dt_pipeline = build_and_fit_dt(X_train, y_train)
    dt_path = OUTPUT_DIR / "dt_high_recall.joblib"
    joblib.dump(dt_pipeline, dt_path)
    print(f"  Saved -> {dt_path}")

    # --- Evaluate ---
    print("\nEvaluating hybrid model on test set ...")
    print(f"  threshold={THRESHOLD}, conf_margin={CONF_MARGIN}")
    metrics = evaluate_hybrid(xgb_pipeline, dt_pipeline, X_test, y_test)

    # --- Save config ---
    save_config(metrics)

    # --- Summary ---
    print("\n" + "=" * 60)
    status = "PASS" if metrics["meets_target"] else "FAIL"
    print(f"  Recall target (>87%): {status}  "
          f"({metrics['recall']*100:.2f}%)")
    print(f"  ROC-AUC : {metrics['roc_auc']:.4f}")
    print("=" * 60)

    if not metrics["meets_target"]:
        print("WARNING: recall target not met.")
        sys.exit(1)

    print("\nv4 models are ready.")
    print("Next step: run src/models/convert_to_onnx_v4.py")


if __name__ == "__main__":
    main()
