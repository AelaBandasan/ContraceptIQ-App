"""
generate_signed_shap.py

Generates risk_factors_v4_signed.json — a per-value signed SHAP lookup table
for on-device directional explainability.

Uses conditional mean SHAP:
  - Categorical OHE bins (cat__*): mean SHAP only for rows where that bin = 1,
    i.e., only patients who actually have that value.  This avoids diluting the
    signal with zeros from patients in other categories.
  - Numeric features (num__AGE, num__PARITY): values are binned into clinically
    meaningful ranges, then conditional mean SHAP is computed per bin.  A
    20-year-old therefore gets a different SHAP signal than a 40-year-old.

Output format:
{
  "baseline_log_odds": 0.755,
  "baseline_probability": 0.680,
  "features": {
    "cat__PATTERN_USE_1":           0.312,
    "cat__PATTERN_USE_Intermittent": 0.041,
    ...
    "num__AGE_15_24":              -0.112,   # conditional mean SHAP for ages 15–24
    "num__AGE_25_34":              -0.298,   # conditional mean SHAP for ages 25–34
    "num__AGE_35_49":              -0.451,   # conditional mean SHAP for ages 35–49
    "num__PARITY_0":                0.082,   # nulliparous
    "num__PARITY_1_2":             -0.095,
    "num__PARITY_3_4":             -0.187,
    "num__PARITY_5_plus":          -0.231,
    ...
  }
}

Usage (from machine-learning/ directory):
    python src/models/generate_signed_shap.py

Output files:
    machine-learning/src/models/models_high_risk_v4/risk_factors_v4_signed.json
    mobile-app/assets/models/risk_factors_v4_signed.json  (copy for bundling)
"""

import json
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
_PROJ = _ML.parent                               # repo root

DATA_PKL       = _ML / "data" / "processed" / "discontinuation_design1_data_v2.pkl"
MODEL_JOBLIB   = _HERE / "models_high_risk_v4" / "xgb_high_recall.joblib"
OUTPUT_ML      = _HERE / "models_high_risk_v4" / "risk_factors_v4_signed.json"
OUTPUT_MOBILE  = _PROJ / "mobile-app" / "assets" / "models" / "risk_factors_v4_signed.json"

V4_FEATURES = [
    "PATTERN_USE", "HUSBAND_AGE", "AGE", "ETHNICITY",
    "HOUSEHOLD_HEAD_SEX", "CONTRACEPTIVE_METHOD", "SMOKE_CIGAR",
    "DESIRE_FOR_MORE_CHILDREN", "PARITY",
]

# Bin definitions for numeric features: (low_inclusive, high_inclusive, bin_label)
# Must cover the full observed range; any out-of-range value is skipped.
NUMERIC_BINS: dict[str, list[tuple[float, float, str]]] = {
    "num__AGE": [
        (0,  19, "under_20"),
        (20, 29, "20_29"),
        (30, 39, "30_39"),
        (40, 99, "40_plus"),
    ],
    "num__PARITY": [
        (0, 0,   "0"),
        (1, 2,   "1_2"),
        (3, 4,   "3_4"),
        (5, 99,  "5_plus"),
    ],
}

# ============================================================================
# MAIN
# ============================================================================

def main():
    try:
        import shap
    except ImportError:
        print("[ERROR] shap not installed. Run: pip install shap", file=sys.stderr)
        sys.exit(1)

    print("=" * 60)
    print("ContraceptIQ — Generate Signed SHAP Lookup Table (v4)")
    print("=" * 60)

    # ── Load data ────────────────────────────────────────────────────────────
    print(f"\nLoading data from {DATA_PKL} ...")
    raw = joblib.load(DATA_PKL)
    if isinstance(raw, tuple) and len(raw) == 4:
        X_train, X_test, y_train, y_test = raw
    else:
        raise ValueError(f"Unexpected data format: {type(raw)}")

    # Select v4 features
    missing = [f for f in V4_FEATURES if f not in X_test.columns]
    if missing:
        raise ValueError(f"Missing v4 features in data: {missing}")

    X_test_v4 = X_test[V4_FEATURES].copy()
    print(f"  X_test shape: {X_test_v4.shape}")

    # ── Load model ───────────────────────────────────────────────────────────
    print(f"\nLoading model from {MODEL_JOBLIB} ...")
    pipeline = joblib.load(MODEL_JOBLIB)
    preprocessor = pipeline.named_steps["preprocess"]
    xgb_model    = pipeline.named_steps["model"]

    # ── Transform to OHE space ───────────────────────────────────────────────
    print("\nTransforming test set through preprocessor ...")
    X_transformed = preprocessor.transform(X_test_v4)
    if hasattr(X_transformed, "toarray"):
        X_transformed = X_transformed.toarray()

    feature_names  = list(preprocessor.get_feature_names_out())
    X_transformed_df = pd.DataFrame(X_transformed, columns=feature_names)
    print(f"  Transformed shape: {X_transformed_df.shape}")

    # ── Run SHAP TreeExplainer ────────────────────────────────────────────────
    print("\nRunning SHAP TreeExplainer ...")
    explainer   = shap.TreeExplainer(xgb_model)
    shap_values = explainer.shap_values(X_transformed_df)   # shape: (n, n_features)
    baseline    = float(explainer.expected_value)           # log-odds baseline

    print(f"  SHAP values shape: {shap_values.shape}")
    print(f"  Baseline (expected log-odds): {baseline:.4f}")

    # Convert baseline log-odds to probability for display
    baseline_prob = float(1 / (1 + np.exp(-baseline)))
    print(f"  Baseline probability: {baseline_prob:.4f} ({baseline_prob*100:.1f}%)")

    # ── Compute conditional mean SHAP per feature ────────────────────────────
    # Categorical OHE bins: average only rows where bin == 1 (patients in that
    # category), not across all patients.  Avoids diluting signal with zeros.
    #
    # Numeric features: bin first, then conditional mean SHAP per bin so that
    # different values (e.g. age 20 vs age 45) produce different SHAP signals.
    print("\nComputing conditional mean SHAP per feature ...")

    features_dict: dict = {}
    n_cols = shap_values.shape[1]

    for i in range(n_cols):
        name     = feature_names[i]
        col_shap = shap_values[:, i]
        col_vals = X_transformed_df.iloc[:, i].values

        if name in NUMERIC_BINS:
            # ── Numeric: one entry per bin ────────────────────────────────────
            for lo, hi, bin_label in NUMERIC_BINS[name]:
                mask = (col_vals >= lo) & (col_vals <= hi)
                if mask.sum() == 0:
                    continue  # no training samples in this bin; omit key
                bin_mean = float(col_shap[mask].mean())
                features_dict[f"{name}_{bin_label}"] = round(bin_mean, 7)
        else:
            # ── Categorical OHE: conditional mean for rows where bin == 1 ────
            mask = col_vals == 1
            if mask.sum() == 0:
                # Bin never appears in test set; fall back to population mean
                features_dict[name] = round(float(col_shap.mean()), 7)
            else:
                features_dict[name] = round(float(col_shap[mask].mean()), 7)

    _total_bins = sum(len(v) for v in NUMERIC_BINS.values())
    print(f"  {len(features_dict)} entries "
          f"({len(feature_names) - len(NUMERIC_BINS)} categorical + "
          f"~{_total_bins} numeric bins)")

    # Sort by absolute value descending for readability
    features_sorted = dict(
        sorted(features_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    )

    output = {
        "baseline_log_odds": round(baseline, 6),
        "baseline_probability": round(baseline_prob, 6),
        "features": features_sorted,
    }

    # ── Save ─────────────────────────────────────────────────────────────────
    OUTPUT_ML.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_MOBILE.parent.mkdir(parents=True, exist_ok=True)

    for out_path in (OUTPUT_ML, OUTPUT_MOBILE):
        with open(out_path, "w") as f:
            json.dump(output, f, indent=2)
        print(f"\nSaved: {out_path}")

    # ── Print top features ────────────────────────────────────────────────────
    print("\nTop 15 features by |signed mean SHAP|:")
    print(f"  {'Feature':<45} {'Signed Mean SHAP':>18}  Direction")
    print(f"  {'-'*45} {'-'*18}  ---------")
    for name, val in list(features_sorted.items())[:15]:
        direction = "↑ increases risk" if val > 0 else "↓ decreases risk"
        print(f"  {name:<45} {val:>18.6f}  {direction}")

    print("\n" + "=" * 60)
    print("Done. risk_factors_v4_signed.json is ready.")
    print("=" * 60)


if __name__ == "__main__":
    main()
