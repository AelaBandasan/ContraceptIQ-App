from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression


def get_hybrid_stack(dt_model, xgb_model):
    """
    Stacked DT + XGB hybrid model
    """
    return StackingClassifier(
        estimators=[
            ("DecisionTree", dt_model),
            ("XGBoost", xgb_model)
        ],
        final_estimator=LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42
        ),
        cv=5,
        n_jobs=-1
    )
