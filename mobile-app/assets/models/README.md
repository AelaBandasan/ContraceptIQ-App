# ONNX Model Assets

This directory stores the converted ONNX model files for on-device ML inference.

## Required Files

- `xgb_high_recall.onnx` — XGBoost pipeline (converted from joblib)
- `dt_high_recall.onnx` — Decision Tree pipeline (converted from joblib)
- `hybrid_v3_config.json` — Model thresholds and configuration

## How to Generate the ONNX Files

Run the conversion script from the machine-learning directory:

```bash
cd <project-root>/machine-learning
pip install skl2onnx onnxmltools onnxruntime
python src/models/convert_to_onnx.py
```

Then copy the generated `.onnx` files:

```bash
cp src/models/models_high_risk_v3/xgb_high_recall.onnx <project-root>/mobile-app/assets/models/
cp src/models/models_high_risk_v3/dt_high_recall.onnx <project-root>/mobile-app/assets/models/
```
