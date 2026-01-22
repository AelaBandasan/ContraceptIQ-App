import argparse
import sys
import os
import joblib
import numpy as np

# Add machine-learning to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from src.models_2.decision_tree import get_decision_tree_high_recall
from src.models_2.xgb_model import get_xgb_high_recall
DATA_PATH = "machine-learning/data/processed/train_test_data.pkl"


def load_data():
    data = joblib.load(DATA_PATH)
    if isinstance(data, dict):
        return data["X_train"], data["y_train"]
    return data[0], data[2]


def compute_scale_pos_weight(y):
    neg = np.sum(y == 0)
    pos = np.sum(y == 1)
    return neg / pos


def train(model_name):
    X_train, y_train = load_data()

    if model_name == "dt":
        model = get_decision_tree_high_recall()
        save_path = "models/DecisionTree_high_recall.pkl"

    elif model_name == "xgb":
        spw = compute_scale_pos_weight(y_train)
        model = get_xgb_high_recall(spw)
        save_path = "models/XGBoost_high_recall.pkl"

    else:
        raise ValueError("Model must be 'dt' or 'xgb'")

    model.fit(X_train, y_train)
    joblib.dump(model, save_path)

    print(f"✅ {model_name.upper()} high-recall model trained and saved.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, choices=["dt", "xgb"])
    args = parser.parse_args()

    train(args.model)
