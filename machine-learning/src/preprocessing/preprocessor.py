from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

def build_preprocessor(X):
    numeric_cols = ['AGE', 'HUSBAND_AGE', 'MONTH_USE_CURRENT_METHOD', 'PARITY', 'EDUC', 'AGE_GRP']
    categorical_cols = [col for col in X.columns if col not in numeric_cols and col not in ['CASEID', 'HIGH_RISK_DISCONTINUE', 'CONTRACEPTIVE_USE_AND_INTENTION', 'INTENTION_USE']]

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value=-1.0)),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median"))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", categorical_transformer, categorical_cols),
            ("num", numeric_transformer, numeric_cols),
        ]
    )

    return preprocessor
