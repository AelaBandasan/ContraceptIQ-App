"""
convert_to_onnx_v4.py

Convert the v4 sklearn Pipelines (XGBoost + Decision Tree) from .joblib
to .onnx for on-device inference in the ContraceptIQ mobile app.

Usage:
    python src/models/convert_to_onnx_v4.py

Output:
    src/models/models_high_risk_v4/xgb_high_recall.onnx
    src/models/models_high_risk_v4/dt_high_recall.onnx

Validation:
    Runs a spot-check: converts a handful of test-set rows, compares
    joblib vs ONNX predictions.  Exits with code 1 on any mismatch.

After this script succeeds, copy the two .onnx files to:
    mobile-app/assets/models/
"""

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import onnxruntime as ort
from skl2onnx import convert_sklearn, update_registered_converter
from skl2onnx.common.data_types import FloatTensorType, StringTensorType
from skl2onnx.common.shape_calculator import calculate_linear_classifier_output_shapes
from onnxmltools.convert.xgboost.operator_converters.XGBoost import convert_xgboost
from xgboost import XGBClassifier

# ============================================================================
# PATHS
# ============================================================================

_HERE      = Path(__file__).resolve().parent          # machine-learning/src/models/
_SRC       = _HERE.parent                             # machine-learning/src/
_ML        = _SRC.parent                              # machine-learning/
_PROJ      = _ML.parent                               # repo root

MODEL_DIR  = _HERE / "models_high_risk_v4"
DATA_PKL   = _ML / "data" / "processed" / "discontinuation_design1_data_v2.pkl"

# Preprocessor
sys.path.insert(0, str(_SRC))

# ============================================================================
# FEATURE SET  (must match train_v4.py)
# ============================================================================

FEATURES = [
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

N_FEATURES = len(FEATURES)   # 10

# Winning inference settings
THRESHOLD   = 0.10
CONF_MARGIN = 0.20

# Dtypes of the 10 features (from the training data pickle)
# Used to build per-column initial_types for skl2onnx.
FEATURE_DTYPES: dict[str, str] = {
    "REGION":                "object",
    "CONTRACEPTIVE_METHOD":  "object",
    "RELIGION":              "object",
    "HUSBAND_AGE":           "object",
    "PARITY":                "int64",
    "AGE":                   "int64",
    "REASON_DISCONTINUED":   "object",
    "HUSBANDS_EDUC":         "object",
    "MARITAL_STATUS":        "object",
    "PATTERN_USE":           "object",
}

# ============================================================================
# STEP 1: Register XGBoost converter
# ============================================================================

def register_xgboost_converter() -> None:
    update_registered_converter(
        XGBClassifier,
        "XGBoostXGBClassifier",
        calculate_linear_classifier_output_shapes,
        convert_xgboost,
        options={"nocl": [True, False], "zipmap": [True, False, "columns"]},
    )
    print("XGBoost converter registered with skl2onnx")


# ============================================================================
# STEP 2: Convert a pipeline to ONNX
# ============================================================================

def convert_pipeline_to_onnx(pipeline, output_path: Path, model_name: str) -> None:
    print(f"\n{'='*60}")
    print(f"Converting {model_name} ...")
    print(f"{'='*60}")

    # Build per-column initial_types so skl2onnx can resolve ColumnTransformer
    # column references by name.
    initial_type = []
    for feat in FEATURES:
        dtype = FEATURE_DTYPES[feat]
        if dtype in ("int64", "float64"):
            initial_type.append((feat, FloatTensorType([None, 1])))
        else:
            initial_type.append((feat, StringTensorType([None, 1])))

    onnx_model = convert_sklearn(
        pipeline,
        initial_types=initial_type,
        target_opset=15,
        options={id(pipeline): {"zipmap": False}},
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(onnx_model.SerializeToString())

    size_kb = output_path.stat().st_size / 1024
    print(f"  Saved to {output_path}  ({size_kb:.1f} KB)")


# ============================================================================
# STEP 3: Validate ONNX against joblib on test data
# ============================================================================

def _extract_prob(onnx_probs) -> float:
    """Extract P(class=1) from whatever tensor shape the ONNX model returns."""
    if isinstance(onnx_probs, list):
        return float(onnx_probs[0].get(1, onnx_probs[0].get("1", 0)))
    if hasattr(onnx_probs, "shape") and len(onnx_probs.shape) == 2:
        return float(onnx_probs[0, 1])
    return float(onnx_probs[0])


def validate(xgb_pipeline, dt_pipeline, xgb_onnx: Path, dt_onnx: Path) -> bool:
    """Compare joblib hybrid vs ONNX hybrid on 20 test samples."""
    print(f"\n{'='*60}")
    print("Validating hybrid logic: ONNX vs joblib (20 test samples)")
    print(f"{'='*60}")

    # Load data and select feature subset
    X_train_full, X_test_full, y_train, y_test = joblib.load(DATA_PKL)
    X_test = X_test_full[FEATURES].copy()

    # Sample 20 rows (first 10 + last 10 to cover both classes)
    sample_idx = list(range(10)) + list(range(len(X_test) - 10, len(X_test)))
    X_sample = X_test.iloc[sample_idx].reset_index(drop=True)
    y_sample = y_test.iloc[sample_idx].reset_index(drop=True)

    # ONNX sessions
    xgb_sess = ort.InferenceSession(str(xgb_onnx))
    dt_sess  = ort.InferenceSession(str(dt_onnx))

    all_passed = True

    for i in range(len(X_sample)):
        row_df = X_sample.iloc[[i]]

        # Build per-column ONNX feed dict (each column as a [1,1] array)
        def make_feed(sess) -> dict:
            feed = {}
            for feat in FEATURES:
                dtype = FEATURE_DTYPES[feat]
                val = row_df[feat].values
                if dtype in ("int64", "float64"):
                    feed[feat] = val.reshape(1, 1).astype(np.float32)
                else:
                    feed[feat] = val.reshape(1, 1).astype(str)
            return feed

        # --- Joblib hybrid ---
        jl_prob   = float(xgb_pipeline.predict_proba(row_df)[0, 1])
        jl_pred   = int(jl_prob >= THRESHOLD)
        jl_dt     = int(dt_pipeline.predict(row_df)[0])
        jl_low    = abs(jl_prob - THRESHOLD) < CONF_MARGIN
        jl_hybrid = 1 if (jl_pred == 1 or (jl_low and jl_dt == 1)) else 0

        # --- ONNX hybrid ---
        ox_xgb_out = xgb_sess.run(None, make_feed(xgb_sess))
        ox_prob    = _extract_prob(ox_xgb_out[1] if len(ox_xgb_out) > 1 else ox_xgb_out[0])
        ox_pred    = int(ox_prob >= THRESHOLD)
        ox_dt_out  = dt_sess.run(None, make_feed(dt_sess))
        ox_dt      = int(ox_dt_out[0][0])
        ox_low     = abs(ox_prob - THRESHOLD) < CONF_MARGIN
        ox_hybrid  = 1 if (ox_pred == 1 or (ox_low and ox_dt == 1)) else 0

        match  = jl_hybrid == ox_hybrid
        pdiff  = abs(jl_prob - ox_prob)
        status = "PASS" if match else "FAIL"
        if not match:
            all_passed = False

        true_label = int(y_sample.iloc[i])
        print(f"  [{status}] row {i:02d}: "
              f"true={true_label}  jl={jl_hybrid}(p={jl_prob:.4f})  "
              f"onnx={ox_hybrid}(p={ox_prob:.4f})  pdiff={pdiff:.6f}")

    return all_passed


# ============================================================================
# MAIN
# ============================================================================

def main() -> None:
    print("=" * 60)
    print("ContraceptIQ -- ONNX Conversion v4 (10 features)")
    print("=" * 60)

    register_xgboost_converter()

    # Load joblib models
    print("\nLoading v4 joblib models ...")
    xgb_path = MODEL_DIR / "xgb_high_recall.joblib"
    dt_path  = MODEL_DIR / "dt_high_recall.joblib"

    xgb_pipeline = joblib.load(xgb_path)
    dt_pipeline  = joblib.load(dt_path)
    print(f"  Loaded {xgb_path}")
    print(f"  Loaded {dt_path}")

    # Convert
    xgb_onnx = MODEL_DIR / "xgb_high_recall.onnx"
    dt_onnx  = MODEL_DIR / "dt_high_recall.onnx"

    convert_pipeline_to_onnx(xgb_pipeline, xgb_onnx, "XGBoost Pipeline (v4)")
    convert_pipeline_to_onnx(dt_pipeline,  dt_onnx,  "Decision Tree Pipeline (v4)")

    # Validate
    passed = validate(xgb_pipeline, dt_pipeline, xgb_onnx, dt_onnx)

    # Summary
    print(f"\n{'='*60}")
    print("CONVERSION SUMMARY")
    print(f"{'='*60}")
    print(f"  Hybrid validation : {'PASS' if passed else 'FAIL'}")
    print(f"  Output files:")
    print(f"    {xgb_onnx}")
    print(f"    {dt_onnx}")
    print(f"{'='*60}")

    if not passed:
        print("\nWARNING: Some validations failed. Review output above.")
        sys.exit(1)

    print("\nAll validations passed. ONNX models ready for mobile deployment.")
    print("\nNext steps:")
    print("  1. Copy .onnx files to mobile-app/assets/models/")
    print("  2. Update mobile-app/src/utils/featureEncoder.ts (10 features)")
    print("  3. Update mobile-app/src/screens/GuestAssessment.tsx (8 questions)")


if __name__ == "__main__":
    main()
