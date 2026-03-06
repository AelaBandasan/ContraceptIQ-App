"""
evaluator.py

Hybrid inference logic, metric computation, and threshold sweep for the
feature-reduction experiment.

The hybrid rule mirrors the v3 production model exactly:
  1. XGBoost predicts P(y=1).
  2. Base prediction = 1 if P >= threshold, else 0.
  3. If |P - threshold| < conf_margin  AND  DT predicts 1  →  upgrade to 1.
     (Upgrade-only: a positive prediction is never downgraded.)

Public API
----------
run_hybrid(xgb_pipeline, dt_pipeline, X_test, threshold, conf_margin)
    Apply the hybrid rule and return (predictions, probabilities).

compute_metrics(y_test, predictions, probabilities)
    Return a dict of recall, precision, f1, roc_auc, confusion_matrix.

threshold_sweep(xgb_pipeline, dt_pipeline, X_test, y_test, thresholds, conf_margin)
    Run run_hybrid + compute_metrics for every threshold.
    Returns a list of result dicts sorted by recall (desc), each flagged
    with whether it meets RECALL_TARGET.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline

from config import RECALL_TARGET

# ============================================================================
# TYPE ALIAS
# ============================================================================

MetricsDict = dict[str, object]   # recall, precision, f1, roc_auc, ...
SweepResult = list[MetricsDict]

# ============================================================================
# PUBLIC API
# ============================================================================

def run_hybrid(
    xgb_pipeline: Pipeline,
    dt_pipeline: Pipeline,
    X_test: pd.DataFrame,
    threshold: float,
    conf_margin: float,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Apply the upgrade-only hybrid rule.

    Parameters
    ----------
    xgb_pipeline : fitted sklearn Pipeline
    dt_pipeline  : fitted sklearn Pipeline
    X_test       : pd.DataFrame  (same feature columns as training)
    threshold    : float         Decision threshold for XGBoost probability
    conf_margin  : float         Low-confidence band half-width

    Returns
    -------
    predictions  : np.ndarray, shape (n,)  Final binary predictions
    probabilities: np.ndarray, shape (n,)  XGBoost P(y=1)
    """
    xgb_probs = xgb_pipeline.predict_proba(X_test)[:, 1]
    xgb_pred  = (xgb_probs >= threshold).astype(int)
    dt_pred   = dt_pipeline.predict(X_test)

    hybrid_pred = xgb_pred.copy()

    low_conf_mask = np.abs(xgb_probs - threshold) < conf_margin
    upgrade_mask  = low_conf_mask & (dt_pred == 1) & (xgb_pred == 0)
    hybrid_pred[upgrade_mask] = 1

    return hybrid_pred, xgb_probs


def compute_metrics(
    y_test: pd.Series,
    predictions: np.ndarray,
    probabilities: np.ndarray,
) -> MetricsDict:
    """
    Compute evaluation metrics for a set of predictions.

    Parameters
    ----------
    y_test       : true binary labels
    predictions  : predicted binary labels
    probabilities: XGBoost P(y=1) (used for ROC-AUC only)

    Returns
    -------
    dict with keys:
        recall, precision, f1, roc_auc,
        confusion_matrix (2x2 list),
        classification_report (str)
    """
    recall    = recall_score(y_test, predictions, zero_division=0)
    precision = precision_score(y_test, predictions, zero_division=0)
    f1        = f1_score(y_test, predictions, zero_division=0)

    # roc_auc requires at least one sample of each class
    try:
        roc_auc = roc_auc_score(y_test, probabilities)
    except ValueError:
        roc_auc = float("nan")

    cm     = confusion_matrix(y_test, predictions).tolist()
    report = classification_report(y_test, predictions, digits=4, zero_division=0)

    return {
        "recall":                recall,
        "precision":             precision,
        "f1":                    f1,
        "roc_auc":               roc_auc,
        "confusion_matrix":      cm,
        "classification_report": report,
        "meets_target":          recall > RECALL_TARGET,
    }


def threshold_sweep(
    xgb_pipeline: Pipeline,
    dt_pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    thresholds: list[float],
    conf_margin: float,
) -> SweepResult:
    """
    Evaluate the hybrid model across multiple decision thresholds.

    Parameters
    ----------
    xgb_pipeline : fitted sklearn Pipeline
    dt_pipeline  : fitted sklearn Pipeline
    X_test       : pd.DataFrame
    y_test       : pd.Series
    thresholds   : list of floats to sweep
    conf_margin  : fixed confidence margin for the hybrid rule

    Returns
    -------
    List of metric dicts (one per threshold), sorted by recall descending.
    Each dict includes a ``threshold`` key.
    """
    results: SweepResult = []

    for thresh in thresholds:
        preds, probs = run_hybrid(
            xgb_pipeline, dt_pipeline, X_test, thresh, conf_margin
        )
        metrics = compute_metrics(y_test, preds, probs)
        metrics["threshold"] = thresh
        results.append(metrics)

    # Sort by recall descending; break ties by precision descending
    results.sort(key=lambda r: (r["recall"], r["precision"]), reverse=True)
    return results


def best_result(sweep: SweepResult) -> MetricsDict:
    """
    Return the best threshold result from a sweep.

    Selection rule:
      1. Among results that meet RECALL_TARGET, pick the one with the highest
         precision (to keep the model as useful as possible).
      2. If none meet RECALL_TARGET, fall back to the highest recall result.

    Parameters
    ----------
    sweep : output of threshold_sweep()

    Returns
    -------
    The selected MetricsDict (includes a ``threshold`` key).
    """
    passing = [r for r in sweep if r["meets_target"]]

    if passing:
        # Highest precision among passing results
        return max(passing, key=lambda r: (r["precision"], r["recall"]))

    # Fallback: highest recall overall
    return max(sweep, key=lambda r: (r["recall"], r["precision"]))
