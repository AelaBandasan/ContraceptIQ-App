import sys
import os
import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.pipeline import Pipeline

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from preprocessing.preprocessor import build_preprocessor

# Load split
data = joblib.load("machine-learning/data/processed/train_test_data.pkl")
X_train, y_train = data["X_train"], data["y_train"]

# Build the preprocessor with training data
preprocessor = build_preprocessor(X_train)

dt = DecisionTreeClassifier(
    max_depth=7,
    class_weight="balanced",
    random_state=42
)

pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("model", dt)
])

pipeline.fit(X_train, y_train)

# Create models directory and save pipeline
models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(models_dir, exist_ok=True)
model_path = os.path.join(models_dir, 'dt_pipeline.joblib')
joblib.dump(pipeline, model_path)
print(f"✅ Decision Tree pipeline trained and saved to {model_path}")
