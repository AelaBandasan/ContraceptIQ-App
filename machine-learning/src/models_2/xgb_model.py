import sys
import os
import joblib
from xgboost import XGBClassifier
from sklearn.pipeline import Pipeline

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from preprocessing.preprocessor import build_preprocessor

# Load split
data = joblib.load("machine-learning/data/processed/train_test_data.pkl")
X_train, y_train = data["X_train"], data["y_train"]

# Build preprocessor
preprocessor = build_preprocessor(X_train)

# XGBoost model (high-recall aware)
xgb = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=(y_train == 0).sum() / (y_train == 1).sum(),
    eval_metric="logloss",
    random_state=42
)

pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("model", xgb)
])

pipeline.fit(X_train, y_train)

# Create models directory and save pipeline
models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(models_dir, exist_ok=True)
model_path = os.path.join(models_dir, 'xgb_pipeline.joblib')
joblib.dump(pipeline, model_path)
print(f"✅ XGBoost pipeline trained and saved to {model_path}")
