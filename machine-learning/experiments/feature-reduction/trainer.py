"""
trainer.py

Builds and fits the XGBoost and Decision Tree sklearn pipelines used in the
feature-reduction experiment.

Design decisions
----------------
- Both builders accept (X_train, y_train) and return a *fitted* Pipeline.
- ``scale_pos_weight`` for XGBoost is computed from the label distribution of
  the supplied y_train — it is never hard-coded, so it auto-adjusts when the
  training set changes (e.g. after column subsets).
- The preprocessor is built from the project's shared
  ``src/preprocessing/preprocessor.py::build_preprocessor``.  The caller is
  responsible for adding ``src/`` to sys.path before importing this module.
- No file I/O is performed here; saving models is the caller's responsibility.

Public API
----------
build_and_fit_xgb(X_train, y_train)  -> fitted sklearn Pipeline
build_and_fit_dt(X_train, y_train)   -> fitted sklearn Pipeline
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier

# build_preprocessor is imported from src/preprocessing/preprocessor.py
# sys.path must include the project's src/ directory before this module is
# imported — that is handled in run_experiment.py.
from preprocessing.preprocessor import build_preprocessor

from config import DT_PARAMS, XGB_PARAMS

# ============================================================================
# PUBLIC API
# ============================================================================

def build_and_fit_xgb(
    X_train: pd.DataFrame,
    y_train: pd.Series,
) -> Pipeline:
    """
    Build the preprocessor + XGBoost pipeline and fit it on training data.

    ``scale_pos_weight`` is computed as ``n_negative / n_positive`` from
    ``y_train``, matching the v3 production model's approach.

    Parameters
    ----------
    X_train : pd.DataFrame
        Feature matrix (any subset of the 25 columns).
    y_train : pd.Series
        Binary target (0 = low-risk, 1 = high-risk).

    Returns
    -------
    sklearn.pipeline.Pipeline
        A fitted pipeline with steps ``["preprocess", "model"]``.
    """
    scale_pos_weight = _compute_scale_pos_weight(y_train)

    xgb = XGBClassifier(
        **XGB_PARAMS,
        scale_pos_weight=scale_pos_weight,
    )

    preprocessor = build_preprocessor(X_train)

    pipeline = Pipeline(steps=[
        ("preprocess", preprocessor),
        ("model",      xgb),
    ])

    pipeline.fit(X_train, y_train)
    return pipeline


def build_and_fit_dt(
    X_train: pd.DataFrame,
    y_train: pd.Series,
) -> Pipeline:
    """
    Build the preprocessor + Decision Tree pipeline and fit it on training data.

    Parameters
    ----------
    X_train : pd.DataFrame
        Feature matrix (any subset of the 25 columns).
    y_train : pd.Series
        Binary target.

    Returns
    -------
    sklearn.pipeline.Pipeline
        A fitted pipeline with steps ``["preprocess", "model"]``.
    """
    dt = DecisionTreeClassifier(**DT_PARAMS)

    preprocessor = build_preprocessor(X_train)

    pipeline = Pipeline(steps=[
        ("preprocess", preprocessor),
        ("model",      dt),
    ])

    pipeline.fit(X_train, y_train)
    return pipeline


# ============================================================================
# PRIVATE HELPERS
# ============================================================================

def _compute_scale_pos_weight(y: pd.Series) -> float:
    """
    Compute XGBoost's ``scale_pos_weight`` as n_negative / n_positive.

    Raises
    ------
    ValueError
        If the training labels contain no positive examples (class 1).
    """
    n_pos = int((y == 1).sum())
    n_neg = int((y == 0).sum())

    if n_pos == 0:
        raise ValueError(
            "Training labels contain no positive examples (class 1). "
            "Cannot compute scale_pos_weight."
        )

    return n_neg / n_pos
