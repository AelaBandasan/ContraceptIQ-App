"""
generate_signed_shap.py

Generates risk_factors_v4_signed.json — a per-value signed mean SHAP lookup
table for on-device directional explainability (Option A).

Unlike mean |SHAP| (which only gives magnitude), this stores the SIGNED mean
SHAP contribution for each OHE feature-value bin.  Positive = increases
discontinuation risk, negative = decreases risk.

Output format:
{
  "baseline": 0.053,           # expected P(discontinue) across training set
  "features": {
    "cat__PATTERN_USE_1":          0.312,
    "cat__PATTERN_USE_Intermittent": 0.041,
    "cat__PATTERN_USE_Consistent": -0.021,
    ...
    "num__AGE":                   -0.018,   # signed mean SHAP for numeric (when > median)
    "num__PARITY":                 0.009,
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

    # ── Compute signed mean SHAP per feature ──────────────────────────────────
    # For each OHE bin: mean SHAP across ALL rows (not just rows where bin=1).
    # This gives the population-average directional contribution per feature bin.
    print("\nComputing signed mean SHAP per feature ...")
    mean_signed_shap = shap_values.mean(axis=0)             # shape: (n_features,)

    features_dict = {
        name: round(float(val), 7)
        for name, val in zip(feature_names, mean_signed_shap)
    }

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
