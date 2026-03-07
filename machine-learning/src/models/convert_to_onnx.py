"""
Convert sklearn Pipeline (XGBoost + Decision Tree) models from .joblib to .onnx
for on-device inference in the ContraceptIQ mobile app.

Usage:
    python src/models/convert_to_onnx.py

Output:
    src/models/models_high_risk_v3/xgb_high_recall.onnx
    src/models/models_high_risk_v3/dt_high_recall.onnx

Validation:
    Automatically compares ONNX model outputs against joblib model outputs
    using test samples from mobile-app/backend/test_data.json.
"""

import json
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

# ONNX conversion libraries
import onnxruntime as ort
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# XGBoost ONNX converter registration
from onnxmltools.convert.xgboost.operator_converters.XGBoost import convert_xgboost
from skl2onnx import update_registered_converter
from xgboost import XGBClassifier
from skl2onnx.common.shape_calculator import calculate_linear_classifier_output_shapes

# ============================================================================
# PATHS
# ============================================================================
MODEL_DIR = Path(__file__).resolve().parent / "models_high_risk_v3"
OUTPUT_DIR = MODEL_DIR  # Save ONNX files alongside joblib files
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
TEST_DATA_PATH = PROJECT_ROOT / "mobile-app" / "backend" / "test_data.json"

# ============================================================================
# STEP 1: Register XGBoost converter for skl2onnx
# ============================================================================

def register_xgboost_converter():
    """Register XGBoost converter so skl2onnx can handle it inside a Pipeline."""
    update_registered_converter(
        XGBClassifier,
        "XGBoostXGBClassifier",
        calculate_linear_classifier_output_shapes,
        convert_xgboost,
        options={"nocl": [True, False], "zipmap": [True, False, "columns"]},
    )
    print("✅ XGBoost converter registered with skl2onnx")


# ============================================================================
# STEP 2: Convert a sklearn Pipeline to ONNX
# ============================================================================

def convert_pipeline_to_onnx(pipeline, n_features: int, output_path: Path, model_name: str):
    """
    Convert a sklearn Pipeline to ONNX format.
    
    Args:
        pipeline: Loaded sklearn Pipeline (preprocessor + model)
        n_features: Number of input features
        output_path: Path to save the .onnx file
        model_name: Human-readable name for logging
    """
    print(f"\n{'='*60}")
    print(f"Converting {model_name}...")
    print(f"{'='*60}")
    
    # Define input type: all features as float
    initial_type = [("float_input", FloatTensorType([None, n_features]))]
    
    # Convert to ONNX
    onnx_model = convert_sklearn(
        pipeline,
        initial_types=initial_type,
        target_opset=15,
        options={id(pipeline): {"zipmap": False}},  # Return raw probabilities, not dict
    )
    
    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    
    file_size = output_path.stat().st_size
    print(f"✅ Saved {model_name} to {output_path}")
    print(f"   File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    
    return onnx_model


# ============================================================================
# STEP 3: Validate ONNX against joblib
# ============================================================================

def load_test_data() -> list[dict]:
    """Load test samples from test_data.json."""
    with open(TEST_DATA_PATH, "r") as f:
        test_data = json.load(f)
    
    samples = []
    for key, sample in test_data.items():
        samples.append({
            "name": key,
            "description": sample["description"],
            "data": sample["data"],
            "expected_risk": sample.get("expected_risk", "UNKNOWN"),
        })
    
    return samples


def validate_model(
    joblib_pipeline,
    onnx_path: Path,
    test_samples: list[dict],
    model_name: str,
    is_classifier: bool = True,
):
    """
    Compare ONNX model output against joblib model output on test samples.
    
    Returns True if all predictions match within tolerance.
    """
    print(f"\n--- Validating {model_name} ---")
    
    # Create ONNX inference session
    session = ort.InferenceSession(str(onnx_path))
    input_name = session.get_inputs()[0].name
    
    all_passed = True
    
    for sample in test_samples:
        df = pd.DataFrame([sample["data"]])
        X_float = df.values.astype(np.float32)
        
        # Joblib prediction
        if is_classifier and hasattr(joblib_pipeline, "predict_proba"):
            joblib_probs = joblib_pipeline.predict_proba(df)[:, 1]
            joblib_pred = joblib_pipeline.predict(df)
        else:
            joblib_pred = joblib_pipeline.predict(df)
            joblib_probs = None
        
        # ONNX prediction
        onnx_outputs = session.run(None, {input_name: X_float})
        onnx_pred = onnx_outputs[0]
        onnx_probs = onnx_outputs[1] if len(onnx_outputs) > 1 else None
        
        # Compare predictions
        pred_match = np.array_equal(joblib_pred.flatten(), onnx_pred.flatten())
        
        # Compare probabilities if available
        prob_match = True
        max_diff = 0.0
        if joblib_probs is not None and onnx_probs is not None:
            # onnx_probs may be a structured array — extract class 1 probability
            if isinstance(onnx_probs, list):
                onnx_prob_val = float(onnx_probs[0].get(1, onnx_probs[0].get("1", 0)))
            elif hasattr(onnx_probs, 'shape') and len(onnx_probs.shape) == 2:
                onnx_prob_val = float(onnx_probs[0, 1])
            else:
                onnx_prob_val = float(onnx_probs[0])
            
            max_diff = abs(float(joblib_probs[0]) - onnx_prob_val)
            prob_match = max_diff < 0.001
        
        status = "✅" if (pred_match and prob_match) else "❌"
        if not (pred_match and prob_match):
            all_passed = False
        
        print(f"  {status} {sample['name']}: pred_match={pred_match}, prob_diff={max_diff:.6f}")
    
    return all_passed


# ============================================================================
# STEP 4: Run hybrid prediction validation
# ============================================================================

def validate_hybrid(xgb_pipeline, dt_pipeline, xgb_onnx_path, dt_onnx_path, test_samples):
    """Validate the full hybrid prediction logic using ONNX models."""
    print(f"\n{'='*60}")
    print("Validating Hybrid Prediction Logic (ONNX vs Joblib)")
    print(f"{'='*60}")
    
    # Load config
    config_path = MODEL_DIR / "hybrid_v3_config.json"
    with open(config_path) as f:
        config = json.load(f)
    
    THRESH = config["threshold_v3"]
    MARGIN = config["conf_margin_v3"]
    
    # ONNX sessions
    xgb_session = ort.InferenceSession(str(xgb_onnx_path))
    dt_session = ort.InferenceSession(str(dt_onnx_path))
    xgb_input = xgb_session.get_inputs()[0].name
    dt_input = dt_session.get_inputs()[0].name
    
    all_passed = True
    
    for sample in test_samples:
        df = pd.DataFrame([sample["data"]])
        X_float = df.values.astype(np.float32)
        
        # --- Joblib hybrid ---
        jl_xgb_probs = xgb_pipeline.predict_proba(df)[:, 1]
        jl_xgb_pred = (jl_xgb_probs >= THRESH).astype(int)
        jl_dt_pred = dt_pipeline.predict(df)
        jl_hybrid = jl_xgb_pred.copy()
        low_conf = np.abs(jl_xgb_probs - THRESH) < MARGIN
        upgrade = low_conf & (jl_dt_pred == 1)
        jl_hybrid[upgrade] = 1
        jl_risk = "HIGH" if jl_hybrid[0] == 1 else "LOW"
        
        # --- ONNX hybrid ---
        ox_xgb_out = xgb_session.run(None, {xgb_input: X_float})
        ox_dt_out = dt_session.run(None, {dt_input: X_float})
        
        # Extract XGB probability for class 1
        ox_probs_raw = ox_xgb_out[1]
        if isinstance(ox_probs_raw, list):
            ox_xgb_prob = float(ox_probs_raw[0].get(1, ox_probs_raw[0].get("1", 0)))
        elif hasattr(ox_probs_raw, 'shape') and len(ox_probs_raw.shape) == 2:
            ox_xgb_prob = float(ox_probs_raw[0, 1])
        else:
            ox_xgb_prob = float(ox_probs_raw[0])
        
        ox_xgb_pred = 1 if ox_xgb_prob >= THRESH else 0
        ox_dt_pred = int(ox_dt_out[0][0])
        
        ox_hybrid = ox_xgb_pred
        ox_low_conf = abs(ox_xgb_prob - THRESH) < MARGIN
        if ox_low_conf and ox_dt_pred == 1:
            ox_hybrid = 1
        ox_risk = "HIGH" if ox_hybrid == 1 else "LOW"
        
        match = jl_risk == ox_risk
        status = "✅" if match else "❌"
        if not match:
            all_passed = False
        
        print(f"  {status} {sample['name']}: "
              f"joblib={jl_risk}(p={float(jl_xgb_probs[0]):.4f}) "
              f"onnx={ox_risk}(p={ox_xgb_prob:.4f}) "
              f"expected={sample['expected_risk']}")
    
    return all_passed


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 60)
    print("ContraceptIQ — Model Conversion: joblib → ONNX")
    print("=" * 60)
    
    # Register XGBoost converter
    register_xgboost_converter()
    
    # Load joblib models
    print("\nLoading joblib models...")
    xgb_path = MODEL_DIR / "xgb_high_recall.joblib"
    dt_path = MODEL_DIR / "dt_high_recall.joblib"
    
    xgb_pipeline = joblib.load(xgb_path)
    dt_pipeline = joblib.load(dt_path)
    print(f"  ✅ XGBoost pipeline loaded from {xgb_path}")
    print(f"  ✅ Decision Tree pipeline loaded from {dt_path}")
    
    n_features = 26  # As specified in config
    
    # Convert XGBoost pipeline
    xgb_onnx_path = OUTPUT_DIR / "xgb_high_recall.onnx"
    convert_pipeline_to_onnx(xgb_pipeline, n_features, xgb_onnx_path, "XGBoost Pipeline")
    
    # Convert Decision Tree pipeline
    dt_onnx_path = OUTPUT_DIR / "dt_high_recall.onnx"
    convert_pipeline_to_onnx(dt_pipeline, n_features, dt_onnx_path, "Decision Tree Pipeline")
    
    # Load test data
    print("\nLoading test data...")
    test_samples = load_test_data()
    print(f"  Loaded {len(test_samples)} test samples from {TEST_DATA_PATH}")
    
    # Validate individual models
    xgb_ok = validate_model(xgb_pipeline, xgb_onnx_path, test_samples, "XGBoost")
    dt_ok = validate_model(dt_pipeline, dt_onnx_path, test_samples, "Decision Tree")
    
    # Validate hybrid logic
    hybrid_ok = validate_hybrid(xgb_pipeline, dt_pipeline, xgb_onnx_path, dt_onnx_path, test_samples)
    
    # Summary
    print(f"\n{'='*60}")
    print("CONVERSION SUMMARY")
    print(f"{'='*60}")
    print(f"  XGBoost validation:  {'✅ PASS' if xgb_ok else '❌ FAIL'}")
    print(f"  Decision Tree validation: {'✅ PASS' if dt_ok else '❌ FAIL'}")
    print(f"  Hybrid logic validation:  {'✅ PASS' if hybrid_ok else '❌ FAIL'}")
    print(f"\n  Output files:")
    print(f"    {xgb_onnx_path}")
    print(f"    {dt_onnx_path}")
    print(f"{'='*60}")
    
    if not (xgb_ok and dt_ok and hybrid_ok):
        print("\n⚠️  Some validations failed! Review output above before deploying.")
        sys.exit(1)
    else:
        print("\n🎉 All validations passed! ONNX models are ready for mobile deployment.")
        print(f"\nNext steps:")
        print(f"  1. Copy .onnx files to mobile-app/assets/models/")
        print(f"  2. Copy hybrid_v3_config.json to mobile-app/assets/models/")
        sys.exit(0)


if __name__ == "__main__":
    main()
