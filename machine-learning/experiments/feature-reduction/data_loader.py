"""
data_loader.py

Loads and subsets the train/test data for the feature-reduction experiment.

Public API
----------
load_data(feature_cols)
    Load discontinuation_design1_data_v2.pkl and subset to the requested
    feature columns. Returns (X_train, X_test, y_train, y_test).
"""

from __future__ import annotations

import joblib
import pandas as pd
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import numpy as np

# ============================================================================
# TYPE ALIAS
# ============================================================================

DataSplit = tuple[
    pd.DataFrame,   # X_train
    pd.DataFrame,   # X_test
    "pd.Series",    # y_train
    "pd.Series",    # y_test
]

# ============================================================================
# PUBLIC API
# ============================================================================

def load_data(feature_cols: list[str], data_path: Path) -> DataSplit:
    """
    Load the v2 data pickle and subset to ``feature_cols``.

    Parameters
    ----------
    feature_cols : list[str]
        Column names to keep. Must be a subset of the 25 raw feature columns.
    data_path : Path
        Absolute path to ``discontinuation_design1_data_v2.pkl``.

    Returns
    -------
    (X_train, X_test, y_train, y_test)

    Raises
    ------
    FileNotFoundError
        If ``data_path`` does not exist.
    ValueError
        If any column in ``feature_cols`` is absent from the loaded data.
    """
    if not data_path.exists():
        raise FileNotFoundError(
            f"Data pickle not found: {data_path}\n"
            "Run the preprocessing notebook to regenerate it."
        )

    raw = joblib.load(data_path)
    X_train, X_test, y_train, y_test = _unpack_pickle(raw, data_path)

    _validate_columns(feature_cols, X_train.columns.tolist(), data_path)

    return (
        X_train[feature_cols].copy(),
        X_test[feature_cols].copy(),
        y_train.copy(),
        y_test.copy(),
    )


# ============================================================================
# PRIVATE HELPERS
# ============================================================================

def _unpack_pickle(
    raw: object,
    data_path: Path,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Accept both dict and 4-tuple pickle formats produced by the project's
    preprocessing notebooks.
    """
    if isinstance(raw, dict):
        required = {"X_train", "X_test", "y_train", "y_test"}
        missing = required - set(raw.keys())
        if missing:
            raise ValueError(
                f"Data pickle at {data_path} is missing keys: {missing}. "
                f"Expected: {required}"
            )
        return raw["X_train"], raw["X_test"], raw["y_train"], raw["y_test"]

    if isinstance(raw, tuple) and len(raw) == 4:
        return raw[0], raw[1], raw[2], raw[3]

    raise ValueError(
        f"Unsupported data pickle format at {data_path}: {type(raw)}. "
        "Expected a dict with X_train/X_test/y_train/y_test or a 4-tuple."
    )


def _validate_columns(
    requested: list[str],
    available: list[str],
    data_path: Path,
) -> None:
    """Raise ValueError listing any columns that are not in the loaded data."""
    missing = [c for c in requested if c not in available]
    if missing:
        raise ValueError(
            f"The following requested feature columns are not present in "
            f"{data_path}:\n  {missing}\n"
            f"Available columns are:\n  {available}"
        )
