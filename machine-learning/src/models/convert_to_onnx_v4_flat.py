"""
convert_to_onnx_v4_flat.py

Convert XGBoost + Decision Tree v4 pipelines to ONNX models that accept a
SINGLE flat float32 input of shape [None, 133] instead of per-column string
tensors.

Why: onnxruntime-react-native v1.24.1 has a bug with string tensor inputs.
Fix: Pre-compute the OHE vector in TypeScript and pass one float32 tensor.

The 133 features = preprocessor output (ColumnTransformer):
  - 7 categorical cols (OHE) + 2 numeric cols (passthrough)

The classifiers (XGBClassifier, DecisionTreeClassifier) are extracted from
the pipeline and re-exported with FloatTensorType([None, 133]).

Usage:
    cd machine-learning
    python src/models/convert_to_onnx_v4_flat.py

Output (also copies to mobile-app/assets/models/):
    src/models/models_high_risk_v4/xgb_high_recall_flat.onnx
    src/models/models_high_risk_v4/dt_high_recall_flat.onnx
"""

import sys
import shutil
from pathlib import Path

import joblib
import numpy as np
import onnxruntime as ort
from skl2onnx import convert_sklearn, update_registered_converter
from skl2onnx.common.data_types import FloatTensorType
from skl2onnx.common.shape_calculator import calculate_linear_classifier_output_shapes
from onnxmltools.convert.xgboost.operator_converters.XGBoost import convert_xgboost
from xgboost import XGBClassifier

# ============================================================================
# PATHS
# ============================================================================

_HERE     = Path(__file__).resolve().parent
_ML       = _HERE.parent.parent
_PROJ     = _ML.parent

MODEL_DIR   = _HERE / "models_high_risk_v4"
MOBILE_DIR  = _PROJ / "mobile-app" / "assets" / "models"
DATA_PKL    = _ML / "data" / "processed" / "discontinuation_design1_data_v2.pkl"

FEATURES = [
    "PATTERN_USE", "HUSBAND_AGE", "AGE", "ETHNICITY", "HOUSEHOLD_HEAD_SEX",
    "CONTRACEPTIVE_METHOD", "SMOKE_CIGAR", "DESIRE_FOR_MORE_CHILDREN", "PARITY",
]

THRESHOLD   = 0.25
CONF_MARGIN = 0.05


# ============================================================================
# STEP 1: Register XGBoost converter
# ============================================================================

def register_xgboost():
    update_registered_converter(
        XGBClassifier,
        "XGBoostXGBClassifier",
        calculate_linear_classifier_output_shapes,
        convert_xgboost,
        options={"nocl": [True, False], "zipmap": [True, False, "columns"]},
    )
    print("XGBoost converter registered.")


# ============================================================================
# STEP 2: Inspect pipeline — print OHE schema for TypeScript encoder
# ============================================================================

def inspect_and_print_schema(pipeline, label: str) -> int:
    """
    Print the exact OHE category lists and numeric feature positions so the
    TypeScript featureEncoder can be kept in sync.
    Returns n_output_features.
    """
    prep = pipeline.named_steps["preprocess"]

    print(f"\n--- {label} preprocessor output schema ---")
    col_offset = 0
    for tname, tobj, tcols in prep.transformers_:
        if tname == "remainder":
            continue
        if hasattr(tobj, "steps"):
            ohe = tobj.named_steps.get("onehot") or tobj.named_steps.get("ohe")
            if ohe is not None and hasattr(ohe, "categories_"):
                for col, cat_arr in zip(tcols, ohe.categories_):
                    n = len(cat_arr)
                    print(f"  [{col_offset:3d}–{col_offset+n-1:3d}] OHE({col})  n={n}  cats={list(cat_arr)}")
                    col_offset += n
            else:
                for col in tcols:
                    print(f"  [{col_offset:3d}]       NUM({col})")
                    col_offset += 1
        else:
            for col in tcols:
                print(f"  [{col_offset:3d}]       NUM({col})")
                col_offset += 1

    print(f"  Total output features: {col_offset}")
    return col_offset


def get_ohe_schema(pipeline):
    """
    Returns a list of ('ohe'|'num', feature_name, [cats]|None) tuples
    in ColumnTransformer output order.
    """
    prep = pipeline.named_steps["preprocess"]
    schema = []

    for tname, tobj, tcols in prep.transformers_:
        if tname == "remainder":
            continue
        if hasattr(tobj, "steps"):
            # Find the OHE step (named 'onehot' or 'ohe'); numeric pipelines
            # only have an imputer and no OHE.
            ohe = tobj.named_steps.get("onehot") or tobj.named_steps.get("ohe")
            if ohe is not None and hasattr(ohe, "categories_"):
                for col, cat_arr in zip(tcols, ohe.categories_):
                    schema.append(("ohe", col, list(cat_arr)))
            else:
                # Numeric pipeline — just imputer, no OHE
                for col in tcols:
                    schema.append(("num", col, None))
        else:
            for col in tcols:
                schema.append(("num", col, None))

    return schema


# ============================================================================
# STEP 3: Convert classifier (not the full pipeline) to flat ONNX
# ============================================================================

def convert_classifier_to_flat_onnx(pipeline, output_path: Path, n_features: int, model_name: str):
    print(f"\nConverting {model_name} classifier to flat ONNX ({n_features} float32 inputs)...")

    classifier = pipeline.named_steps["model"]  # XGBClassifier or DecisionTreeClassifier

    initial_types = [("float_input", FloatTensorType([None, n_features]))]

    onnx_model = convert_sklearn(
        classifier,
        initial_types=initial_types,
        target_opset={"": 15, "ai.onnx.ml": 3},
        options={id(classifier): {"zipmap": False}},
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(onnx_model.SerializeToString())

    size_kb = output_path.stat().st_size / 1024
    print(f"  Saved: {output_path}  ({size_kb:.1f} KB)")


# ============================================================================
# STEP 4: Validate flat ONNX against joblib pipeline on 20 test rows
# ============================================================================

def build_ohe_vector(row_series, schema) -> np.ndarray:
    """Build the 133-dim float32 vector from one row using the OHE schema."""
    parts = []
    for kind, feat, cats in schema:
        val = row_series[feat]
        if kind == "ohe":
            vec = np.zeros(len(cats), dtype=np.float32)
            val_str = str(val) if not isinstance(val, float) or not np.isnan(val) else ""
            if val_str in cats:
                vec[cats.index(val_str)] = 1.0
            # unknown category → all zeros (handle_unknown='ignore' behaviour)
            parts.append(vec)
        else:
            # numeric — cast to float32
            try:
                parts.append(np.array([float(val)], dtype=np.float32))
            except (ValueError, TypeError):
                parts.append(np.array([0.0], dtype=np.float32))
    return np.concatenate(parts)


def validate(xgb_pipeline, dt_pipeline, xgb_flat_onnx: Path, dt_flat_onnx: Path, schema) -> bool:
    print(f"\n{'='*60}")
    print("Validating flat ONNX vs joblib on 20 test samples")
    print(f"{'='*60}")

    X_train, X_test, y_train, y_test = joblib.load(DATA_PKL)
    X_test = X_test[FEATURES].copy()

    sample_idx = list(range(10)) + list(range(len(X_test) - 10, len(X_test)))
    X_sample = X_test.iloc[sample_idx].reset_index(drop=True)
    y_sample = y_test.iloc[sample_idx].reset_index(drop=True)

    xgb_sess = ort.InferenceSession(str(xgb_flat_onnx))
    dt_sess  = ort.InferenceSession(str(dt_flat_onnx))

    all_passed = True

    for i in range(len(X_sample)):
        row = X_sample.iloc[i]
        vec = build_ohe_vector(row, schema).reshape(1, -1)

        # Joblib hybrid
        jl_prob   = float(xgb_pipeline.predict_proba(row.to_frame().T)[0, 1])
        jl_pred   = int(jl_prob >= THRESHOLD)
        jl_dt     = int(dt_pipeline.predict(row.to_frame().T)[0])
        jl_low    = abs(jl_prob - THRESHOLD) < CONF_MARGIN
        jl_hybrid = 1 if (jl_pred == 1 or (jl_low and jl_dt == 1)) else 0

        # Flat ONNX hybrid
        xgb_out  = xgb_sess.run(None, {"float_input": vec})
        ox_prob  = float(xgb_out[1][0, 1]) if xgb_out[1].shape[1] == 2 else float(xgb_out[1][0, 0])
        ox_pred  = int(ox_prob >= THRESHOLD)
        dt_out   = dt_sess.run(None, {"float_input": vec})
        ox_dt    = int(dt_out[0][0])
        ox_low   = abs(ox_prob - THRESHOLD) < CONF_MARGIN
        ox_hybrid = 1 if (ox_pred == 1 or (ox_low and ox_dt == 1)) else 0

        match  = jl_hybrid == ox_hybrid
        pdiff  = abs(jl_prob - ox_prob)
        status = "PASS" if match else "FAIL"
        if not match:
            all_passed = False

        true_label = int(y_sample.iloc[i])
        print(f"  [{status}] row {i:02d}: true={true_label}  "
              f"jl={jl_hybrid}(p={jl_prob:.4f})  onnx={ox_hybrid}(p={ox_prob:.4f})  pdiff={pdiff:.6f}")

    return all_passed


# ============================================================================
# STEP 5: Print TypeScript OHE table for featureEncoder.ts
# ============================================================================

def print_ts_schema(schema):
    print(f"\n{'='*60}")
    print("TypeScript OHE schema for featureEncoder.ts")
    print(f"{'='*60}")
    print("// Paste this into buildOHEVector() in featureEncoder.ts\n")
    print("const OHE_SCHEMA: Array<{ feat: string; cats?: string[]; isNum?: boolean }> = [")
    for kind, feat, cats in schema:
        if kind == "ohe":
            cats_ts = ", ".join(f'"{c}"' for c in cats)
            print(f'  {{ feat: "{feat}", cats: [{cats_ts}] }},')
        else:
            print(f'  {{ feat: "{feat}", isNum: true }},')
    print("];")


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 60)
    print("ContraceptIQ — ONNX Flat Conversion v4 (133 float32 inputs)")
    print("=" * 60)

    register_xgboost()

    # Load joblib models
    print("\nLoading v4 joblib pipelines...")
    xgb_pipeline = joblib.load(MODEL_DIR / "xgb_high_recall.joblib")
    dt_pipeline  = joblib.load(MODEL_DIR / "dt_high_recall.joblib")
    print("  Loaded xgb_high_recall.joblib")
    print("  Loaded dt_high_recall.joblib")

    # Inspect schema (use xgb pipeline — both have same preprocessor)
    schema = get_ohe_schema(xgb_pipeline)
    n_features = inspect_and_print_schema(xgb_pipeline, "XGBoost")

    # Convert classifiers to flat ONNX
    xgb_flat = MODEL_DIR / "xgb_high_recall_flat.onnx"
    dt_flat  = MODEL_DIR / "dt_high_recall_flat.onnx"

    convert_classifier_to_flat_onnx(xgb_pipeline, xgb_flat, n_features, "XGBoost")
    convert_classifier_to_flat_onnx(dt_pipeline,  dt_flat,  n_features, "Decision Tree")

    # Validate
    passed = validate(xgb_pipeline, dt_pipeline, xgb_flat, dt_flat, schema)

    # Print TypeScript schema
    print_ts_schema(schema)

    # Copy to mobile-app/assets/models/
    print(f"\nCopying flat ONNX files to {MOBILE_DIR}...")
    MOBILE_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(xgb_flat, MOBILE_DIR / "xgb_high_recall.onnx")
    shutil.copy2(dt_flat,  MOBILE_DIR / "dt_high_recall.onnx")
    print("  Copied xgb_high_recall.onnx")
    print("  Copied dt_high_recall.onnx")

    # Summary
    print(f"\n{'='*60}")
    print(f"DONE  —  validation: {'PASS' if passed else 'FAIL'}")
    print(f"{'='*60}")

    if not passed:
        sys.exit(1)

    print("\nNext steps:")
    print("  1. Update featureEncoder.ts with the OHE_SCHEMA above")
    print("  2. Update onDeviceRiskService.ts to pass one float32 tensor")


if __name__ == "__main__":
    main()
