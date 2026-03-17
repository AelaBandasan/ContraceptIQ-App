"""
evaluate_v4.py

Standalone evaluation script for the v4 hybrid XGBoost + Decision Tree model.

Loads the production joblib pipelines and the 30% held-out test split from
`discontinuation_design1_data_v2.pkl`, runs hybrid inference, and prints:

  - Recall
  - Precision
  - F-beta  (β=2, recall-weighted — consistent with the tuning objective)
  - ROC-AUC
  - Confusion matrix  (TP / FP / TN / FN)

Inference configuration (threshold, conf_margin, feature list) is read from
`hybrid_v4_config.json` at runtime so the script stays in sync with whatever
is currently deployed.

Usage
-----
    # From any working directory:
    python machine-learning/src/evaluation/evaluate_v4.py

    # Or from the machine-learning/ root:
    python src/evaluation/evaluate_v4.py

No files are written.  No models are trained.  All inputs are read-only.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    confusion_matrix,
    fbeta_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline

# ============================================================================
# PATHS
# ============================================================================

# This file lives at:  machine-learning/src/evaluation/evaluate_v4.py
# parents[0] = evaluation/
# parents[1] = src/
# parents[2] = machine-learning/
_HERE    = Path(__file__).resolve().parent
_ML_ROOT = _HERE.parents[1]

DATA_PKL    = _ML_ROOT / "data" / "processed" / "discontinuation_design1_data_v2.pkl"
CONFIG_JSON = _ML_ROOT / "src" / "models" / "models_high_risk_v4" / "hybrid_v4_config.json"
XGB_JOBLIB  = _ML_ROOT / "src" / "models" / "models_high_risk_v4" / "xgb_high_recall.joblib"
DT_JOBLIB   = _ML_ROOT / "src" / "models" / "models_high_risk_v4" / "dt_high_recall.joblib"

# ============================================================================
# CONSTANTS
# ============================================================================

FBETA_BETA:    float = 2.0   # recall weighted 2× over precision
RECALL_TARGET: float = 0.90  # production pass/fail threshold


# ============================================================================
# ARTIFACT LOADING
# ============================================================================

def load_artifacts() -> tuple[pd.DataFrame, pd.Series, Pipeline, Pipeline, dict]:
    """Load the test split, both pipelines, and the inference config.

    Returns
    -------
    X_test    : DataFrame subset to the 9 reduced_C features
    y_test    : binary Series  (HIGH_RISK_DISCONTINUE)
    xgb_pipe  : fitted XGBoost sklearn Pipeline
    dt_pipe   : fitted Decision Tree sklearn Pipeline
    cfg       : parsed hybrid_v4_config.json as a dict
    """
    # --- Inference config -------------------------------------------------
    if not CONFIG_JSON.exists():
        sys.exit(f"[ERROR] Config not found: {CONFIG_JSON}")

    with CONFIG_JSON.open() as f:
        cfg = json.load(f)

    features: list[str] = cfg["features"]

    # --- Dataset ----------------------------------------------------------
    if not DATA_PKL.exists():
        sys.exit(f"[ERROR] Dataset not found: {DATA_PKL}")

    _, X_test_full, _, y_test = joblib.load(DATA_PKL)
    X_test = X_test_full[features].copy()

    # --- Pipelines --------------------------------------------------------
    for path in (XGB_JOBLIB, DT_JOBLIB):
        if not path.exists():
            sys.exit(f"[ERROR] Model file not found: {path}")

    xgb_pipe: Pipeline = joblib.load(XGB_JOBLIB)
    dt_pipe:  Pipeline = joblib.load(DT_JOBLIB)

    return X_test, y_test, xgb_pipe, dt_pipe, cfg


# ============================================================================
# HYBRID INFERENCE
# ============================================================================

def hybrid_predict(
    xgb_pipe:   Pipeline,
    dt_pipe:    Pipeline,
    X:          pd.DataFrame,
    threshold:  float,
    conf_margin: float,
) -> tuple[np.ndarray, np.ndarray]:
    """Apply the upgrade-only hybrid inference rule.

    XGBoost is the primary classifier.  Where its probability falls within the
    low-confidence band  (|p − threshold| < conf_margin)  and the Decision
    Tree independently predicts HIGH (1), the label is upgraded to HIGH.
    XGBoost predictions already at or above the threshold are never downgraded.

    Parameters
    ----------
    xgb_pipe    : fitted XGBoost Pipeline
    dt_pipe     : fitted Decision Tree Pipeline
    X           : feature DataFrame (9 reduced_C columns)
    threshold   : XGBoost classification threshold
    conf_margin : half-width of the low-confidence band

    Returns
    -------
    hybrid_preds : (n,) int array  — final binary predictions
    xgb_probs    : (n,) float array — raw XGBoost probabilities (used for AUC)
    """
    xgb_probs: np.ndarray = xgb_pipe.predict_proba(X)[:, 1]
    xgb_preds: np.ndarray = (xgb_probs >= threshold).astype(int)
    dt_preds:  np.ndarray = dt_pipe.predict(X)

    hybrid_preds = xgb_preds.copy()
    low_conf_mask = np.abs(xgb_probs - threshold) < conf_margin
    upgrade_mask  = low_conf_mask & (dt_preds == 1) & (xgb_preds == 0)
    hybrid_preds[upgrade_mask] = 1

    return hybrid_preds, xgb_probs


# ============================================================================
# METRIC COMPUTATION
# ============================================================================

def compute_metrics(
    y_true: pd.Series,
    preds:  np.ndarray,
    probs:  np.ndarray,
    beta:   float = FBETA_BETA,
) -> dict:
    """Compute evaluation metrics for the hybrid model output.

    ROC-AUC is computed from raw XGBoost probabilities, not the binary hybrid
    predictions, to preserve the full ranking information.

    Parameters
    ----------
    y_true : ground-truth binary labels
    preds  : binary hybrid predictions
    probs  : raw XGBoost probabilities
    beta   : F-beta weighting factor (default 2.0)

    Returns
    -------
    dict with keys:
        recall, precision, fbeta, roc_auc,
        tp, fp, tn, fn,
        meets_recall_target
    """
    recall    = float(recall_score(y_true, preds, zero_division=0))
    precision = float(precision_score(y_true, preds, zero_division=0))
    fbeta     = float(fbeta_score(y_true, preds, beta=beta, zero_division=0))
    roc_auc   = float(roc_auc_score(y_true, probs))

    tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()

    return {
        "recall":               recall,
        "precision":            precision,
        "fbeta":                fbeta,
        "roc_auc":              roc_auc,
        "tp":                   int(tp),
        "fp":                   int(fp),
        "tn":                   int(tn),
        "fn":                   int(fn),
        "meets_recall_target":  recall > RECALL_TARGET,
    }


# ============================================================================
# REPORT PRINTING
# ============================================================================

def print_report(
    metrics:   dict,
    cfg:       dict,
    n_test:    int,
    n_pos:     int,
) -> None:
    """Print a formatted evaluation report to stdout.

    Parameters
    ----------
    metrics : output of compute_metrics()
    cfg     : parsed hybrid_v4_config.json
    n_test  : total number of test rows
    n_pos   : number of positive (class-1) examples in the test set
    """
    threshold   = cfg["threshold_v4"]
    conf_margin = cfg["conf_margin_v4"]
    pos_pct     = 100.0 * n_pos / n_test if n_test else 0.0
    target_str  = "YES" if metrics["meets_recall_target"] else "NO"

    divider = "=" * 62

    print()
    print(divider)
    print("  V4 Hybrid Model - Evaluation Report")
    print(f"  Dataset    : {DATA_PKL.relative_to(_ML_ROOT)}")
    print(f"  Test set   : {n_test} rows  |  Positives: {n_pos}  ({pos_pct:.2f}%)")
    print(f"  Threshold  : {threshold}  |  Conf margin: {conf_margin}  |  F-beta b={FBETA_BETA:.1f}")
    print(divider)
    print(f"  Recall              :  {metrics['recall']:.4f}")
    print(f"  Precision           :  {metrics['precision']:.4f}")
    print(f"  F-beta  (b={FBETA_BETA:.2f})    :  {metrics['fbeta']:.4f}")
    print(f"  ROC-AUC             :  {metrics['roc_auc']:.4f}")
    print()
    print("  Confusion Matrix")
    print("  +-----------------------------+")
    print(f"  |  TP: {metrics['tp']:4d}    FP: {metrics['fp']:4d}         |")
    print(f"  |  FN: {metrics['fn']:4d}    TN: {metrics['tn']:4d}         |")
    print("  +-----------------------------+")
    print()
    print(f"  Meets recall target (>{RECALL_TARGET})  :  {target_str}")
    print(divider)
    print()


# ============================================================================
# MAIN
# ============================================================================

def main() -> None:
    """Load artifacts, run hybrid inference, compute metrics, print report."""
    print("[evaluate_v4] Loading artifacts ...", flush=True)
    X_test, y_test, xgb_pipe, dt_pipe, cfg = load_artifacts()

    n_test = len(y_test)
    n_pos  = int(y_test.sum())

    threshold   = cfg["threshold_v4"]
    conf_margin = cfg["conf_margin_v4"]

    print(f"[evaluate_v4] Running hybrid inference on {n_test} rows ...", flush=True)
    preds, probs = hybrid_predict(xgb_pipe, dt_pipe, X_test, threshold, conf_margin)

    print("[evaluate_v4] Computing metrics ...", flush=True)
    metrics = compute_metrics(y_test, preds, probs)

    print_report(metrics, cfg, n_test, n_pos)


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    main()
