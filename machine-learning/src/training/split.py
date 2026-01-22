import joblib
from sklearn.model_selection import train_test_split

# Load the full dataframe (not the train/test tuple)
df = joblib.load(
    "machine-learning/data/processed/discontinuation_design1_full_data_v2.pkl"
)

TARGET = "HIGH_RISK_DISCONTINUE"
LEAKAGE_COLS = [
    "CONTRACEPTIVE_USE_AND_INTENTION",
    "INTENTION_USE"
]

X = df.drop(columns=[TARGET] + LEAKAGE_COLS)
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.3,
    stratify=y,
    random_state=42
)

joblib.dump(
    {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test
    },
    "machine-learning/data/processed/train_test_data.pkl"
)

print("✅ Fixed train/test split saved.")
