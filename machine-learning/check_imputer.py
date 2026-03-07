import joblib, numpy as np, math
from pathlib import Path
pl = joblib.load(Path("src/models/models_high_risk_v4/xgb_high_recall.joblib"))
prep = pl.steps[0][1]
for tname, tobj, _ in prep.transformers_:
    if tname == "cat":
        for sname, sobj in tobj.steps:
            if sname == "imputer":
                mv = sobj.missing_values
                print(f"missing_values = {repr(mv)}")
                print(f"type           = {type(mv)}")
                print(f"is np.nan      = {mv is np.nan}")
                print(f"isinstance float = {isinstance(mv, float)}")
                try:
                    print(f"math.isnan     = {math.isnan(mv)}")
                except:
                    print("math.isnan: N/A")
