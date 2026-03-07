import joblib
from pathlib import Path

MODEL_DIR = Path("src/models/models_high_risk_v4")

xgb_pipeline = joblib.load(MODEL_DIR / "xgb_high_recall.joblib")
dt_pipeline  = joblib.load(MODEL_DIR / "dt_high_recall.joblib")

for name, pl in [("XGB", xgb_pipeline), ("DT", dt_pipeline)]:
    print(f"\n=== {name} pipeline steps ===")
    for step_name, step in pl.steps:
        print(f"  step: {step_name}  ->  {type(step).__name__}")

    # Dig into the preprocessor ColumnTransformer
    prep = pl.steps[0][1]
    print(f"\n  Preprocessor type: {type(prep).__name__}")

    if hasattr(prep, "transformers_"):
        for tname, tobj, tcols in prep.transformers_:
            print(f"\n    transformer: {tname}  cols: {tcols}")
            print(f"      type: {type(tobj).__name__}")
            if hasattr(tobj, "steps"):
                for sname, sobj in tobj.steps:
                    print(f"        step: {sname}  ->  {type(sobj).__name__}")
                    if hasattr(sobj, "missing_values"):
                        print(f"          missing_values: {repr(sobj.missing_values)}")
                    if hasattr(sobj, "strategy"):
                        print(f"          strategy: {sobj.strategy}")
