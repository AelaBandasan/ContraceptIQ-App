"""
sample_predict_v4.py

Runs hybrid v4 inference on the held-out test set and prints one True Positive
(predicted HIGH RISK, actually high risk) and one True Negative (predicted LOW
RISK, actually low risk) with human-readable label values.

Usage:
    python src/models/sample_predict_v4.py
"""

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

# ============================================================================
# PATHS
# ============================================================================

_HERE = Path(__file__).resolve().parent          # machine-learning/src/models/
_SRC  = _HERE.parent                             # machine-learning/src/
_ML   = _SRC.parent                              # machine-learning/

DATA_PKL   = _ML / "data" / "processed" / "discontinuation_design1_data_v2.pkl"
OUTPUT_DIR = _HERE / "models_high_risk_v4"
XGB_MODEL  = OUTPUT_DIR / "xgb_high_recall.joblib"
DT_MODEL   = OUTPUT_DIR / "dt_high_recall.joblib"

# ============================================================================
# FEATURE SET  (reduced_C — must match train_v4.py exactly)
# ============================================================================

FEATURES = [
    "PATTERN_USE",
    "HUSBAND_AGE",
    "AGE",
    "ETHNICITY",
    "HOUSEHOLD_HEAD_SEX",
    "CONTRACEPTIVE_METHOD",
    "SMOKE_CIGAR",
    "DESIRE_FOR_MORE_CHILDREN",
    "PARITY",
]

# Inference settings (must match train_v4.py exactly)
THRESHOLD   = 0.25
CONF_MARGIN = 0.05

# ============================================================================
# HUMAN-READABLE LABEL MAPS
# (encoded integers -> survey answer text)
# ============================================================================

LABEL_MAPS = {
    "PATTERN_USE": {
        1: "Current user",
        2: "Recent user (stopped within 12 months)",
        3: "Past user (stopped >12 months ago)",
    },
    "ETHNICITY": {
        1: "Tagalog", 2: "Ilocano", 3: "Bisaya/Cebuano", 4: "Hiligaynon/Ilonggo",
        5: "Bikol/Bicol", 6: "Waray", 7: "Kapampangan", 8: "Pangasinan",
        9: "Other Filipinos", 10: "Other ethnicity",
    },
    "HOUSEHOLD_HEAD_SEX": {1: "Male", 2: "Female"},
    "CONTRACEPTIVE_METHOD": {
        1: "Pill", 2: "IUD", 3: "Injectable", 4: "Implant",
        5: "Female sterilisation", 6: "Male sterilisation",
        7: "Condom", 8: "NFP/Periodic abstinence", 9: "SDM",
        10: "LAM", 11: "Other modern", 12: "Other traditional",
    },
    "SMOKE_CIGAR": {0: "No", 1: "Yes"},
    "DESIRE_FOR_MORE_CHILDREN": {
        1: "Wants more children", 2: "Wants no more children",
        3: "Undecided/ambivalent", 4: "Sterilised (self or partner)", 9: "Not applicable",
    },
}

CONTINUOUS_FEATURES = {"HUSBAND_AGE", "AGE", "PARITY"}


def decode_row(row: pd.Series) -> dict:
    """Return a dict mapping feature names to human-readable values."""
    decoded = {}
    for feat in FEATURES:
        val = row[feat]
        if feat in CONTINUOUS_FEATURES:
            decoded[feat] = val
        elif feat in LABEL_MAPS:
            if isinstance(val, str):
                decoded[feat] = val
            else:
                decoded[feat] = LABEL_MAPS[feat].get(int(val), f"code {int(val)}")
        else:
            decoded[feat] = val
    return decoded


# ============================================================================
# INFERENCE HELPERS
# ============================================================================

def hybrid_predict(xgb_pipe, dt_pipe, X: pd.DataFrame):
    """Return (xgb_prob, hybrid_prediction) arrays."""
    xgb_probs = xgb_pipe.predict_proba(X)[:, 1]
    xgb_preds = (xgb_probs >= THRESHOLD).astype(int)
    dt_preds  = dt_pipe.predict(X)

    hybrid = xgb_preds.copy()
    low_conf = np.abs(xgb_probs - THRESHOLD) < CONF_MARGIN
    upgrade  = low_conf & (dt_preds == 1)
    hybrid[upgrade] = 1

    return xgb_probs, hybrid


# ============================================================================
# FORMATTING
# ============================================================================

def print_case(label: str, row: pd.Series, xgb_prob: float,
               hybrid_pred: int, true_label: int) -> None:
    decoded = decode_row(row)
    risk_label   = "HIGH RISK" if hybrid_pred == 1 else "LOW RISK"
    actual_label = "HIGH RISK" if true_label  == 1 else "LOW RISK"

    print(f"\n{'-' * 60}")
    print(f"  {label}")
    print(f"{'-' * 60}")
    print(f"  {'Feature':<32} {'Value'}")
    print(f"  {'-'*30} {'-'*22}")
    for feat, val in decoded.items():
        print(f"  {feat:<32} {val}")
    print(f"{'-' * 60}")
    print(f"  XGB probability score  : {xgb_prob:.4f}")
    print(f"  Decision threshold     : {THRESHOLD}")
    print(f"  Model prediction       : {risk_label}")
    print(f"  Actual outcome         : {actual_label}")
    print(f"{'-' * 60}")


# ============================================================================
# MAIN
# ============================================================================

def main() -> None:
    print("=" * 60)
    print("  ContraceptIQ v4 -- Sample Predictions")
    print("=" * 60)

    # --- Load models ---
    print(f"\nLoading models from {OUTPUT_DIR} ...")
    xgb_pipe = joblib.load(XGB_MODEL)
    dt_pipe  = joblib.load(DT_MODEL)
    print("  xgb_high_recall.joblib  loaded")
    print("  dt_high_recall.joblib   loaded")

    # --- Load data ---
    print(f"\nLoading test data from {DATA_PKL} ...")
    X_train_full, X_test_full, y_train, y_test = joblib.load(DATA_PKL)
    X_test = X_test_full[FEATURES].copy()
    print(f"  Test set : {X_test.shape[0]} rows, {X_test.shape[1]} features")
    print(f"  Class dist: {dict(y_test.value_counts().sort_index())}")

    # --- Run inference on entire test set ---
    xgb_probs, hybrid_preds = hybrid_predict(xgb_pipe, dt_pipe, X_test)
    y_test_arr = np.array(y_test)

    # True Positive: actually high-risk AND predicted HIGH RISK
    tp_mask    = (y_test_arr == 1) & (hybrid_preds == 1)
    # True Negative: actually low-risk AND predicted LOW RISK
    tn_mask    = (y_test_arr == 0) & (hybrid_preds == 0)

    tp_indices = np.where(tp_mask)[0]
    tn_indices = np.where(tn_mask)[0]

    print(f"\n  True Positives in test set : {len(tp_indices)}")
    print(f"  True Negatives in test set : {len(tn_indices)}")

    if len(tp_indices) == 0 or len(tn_indices) == 0:
        print("ERROR: could not find at least one TP and one TN -- check model/data.")
        sys.exit(1)

    # TP: highest XGB confidence (clearest high-risk case)
    tp_idx = tp_indices[np.argmax(xgb_probs[tp_indices])]

    # TN: XGB probability closest to median of all TN probs (most representative)
    tn_probs = xgb_probs[tn_indices]
    tn_idx   = tn_indices[np.argmin(np.abs(tn_probs - np.median(tn_probs)))]

    tp_row = X_test.iloc[tp_idx]
    tn_row = X_test.iloc[tn_idx]

    print_case(
        "EXAMPLE 1 -- True Positive  (actual: HIGH RISK, predicted: HIGH RISK)",
        tp_row,
        xgb_probs[tp_idx],
        hybrid_preds[tp_idx],
        y_test_arr[tp_idx],
    )

    print_case(
        "EXAMPLE 2 -- True Negative  (actual: LOW RISK,  predicted: LOW RISK)",
        tn_row,
        xgb_probs[tn_idx],
        hybrid_preds[tn_idx],
        y_test_arr[tn_idx],
    )

    print("\n  Done.\n")


if __name__ == "__main__":
    main()
