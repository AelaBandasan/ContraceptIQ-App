"""
config.py

All constants for the feature-reduction experiment:
  - Filesystem paths (resolved relative to this file — no CWD assumptions)
  - Candidate feature sets
  - Hyperparameters that mirror the v3 production model exactly
  - Hybrid inference settings and threshold sweep range
"""

from pathlib import Path

# ============================================================================
# PATHS
# ============================================================================

# Anchor: this file lives at
#   machine-learning/experiments/feature-reduction/config.py
# So parents[2] == machine-learning/
_HERE = Path(__file__).resolve().parent
_ML_ROOT = _HERE.parents[1]

DATA_PKL = _ML_ROOT / "data" / "processed" / "discontinuation_design1_data_v2.pkl"

# Pre-trained v3 models — used as the baseline (no retrain)
BASELINE_XGB_JOBLIB = _ML_ROOT / "src" / "models" / "models_high_risk_v3" / "xgb_high_recall.joblib"
BASELINE_DT_JOBLIB  = _ML_ROOT / "src" / "models" / "models_high_risk_v3" / "dt_high_recall.joblib"

# Output directory
RESULTS_DIR = _HERE / "results"

REPORT_PATH = RESULTS_DIR / "feature_reduction_report.txt"
CONFIG_PATH = RESULTS_DIR / "feature_reduction_config.json"

# Path to the shared preprocessor builder (added to sys.path in run_experiment)
SRC_PATH = _ML_ROOT / "src"

# ============================================================================
# FEATURE SETS
# ============================================================================

# Full 25-column list (matches discontinuation_design1_data_v2.pkl exactly)
_ALL_FEATURES = [
    "AGE",
    "REGION",
    "EDUC_LEVEL",
    "RELIGION",
    "ETHNICITY",
    "MARITAL_STATUS",
    "RESIDING_WITH_PARTNER",
    "HOUSEHOLD_HEAD_SEX",
    "OCCUPATION",
    "HUSBANDS_EDUC",
    "HUSBAND_AGE",
    "PARTNER_EDUC",
    "SMOKE_CIGAR",
    "PARITY",
    "DESIRE_FOR_MORE_CHILDREN",
    "WANT_LAST_CHILD",
    "WANT_LAST_PREGNANCY",
    "CONTRACEPTIVE_METHOD",
    "MONTH_USE_CURRENT_METHOD",
    "PATTERN_USE",
    "TOLD_ABT_SIDE_EFFECTS",
    "LAST_SOURCE_TYPE",
    "LAST_METHOD_DISCONTINUED",
    "REASON_DISCONTINUED",
    "HSBND_DESIRE_FOR_MORE_CHILDREN",
]

# Reduced-A: drop the two zero-importance features only (23 features)
_REDUCED_A = [f for f in _ALL_FEATURES if f not in {
    "TOLD_ABT_SIDE_EFFECTS",
    "LAST_SOURCE_TYPE",
}]

# Reduced-B: keep only features with strictly positive permutation importance
# (drops all negatives + zeros = 13 features removed → 12 kept)
_REDUCED_B = [
    "AGE",
    "REGION",
    "RELIGION",
    "MARITAL_STATUS",
    "RESIDING_WITH_PARTNER",
    "SMOKE_CIGAR",
    "HUSBANDS_EDUC",
    "HUSBAND_AGE",
    "PARITY",
    "PATTERN_USE",
    "CONTRACEPTIVE_METHOD",
    "REASON_DISCONTINUED",
]

# Reduced-C: top 6 by permutation importance + 4 high-SHAP borderline features
# (10 features)
_REDUCED_C = [
    "REGION",
    "CONTRACEPTIVE_METHOD",
    "RELIGION",
    "HUSBAND_AGE",
    "PARITY",
    "AGE",
    "REASON_DISCONTINUED",
    "HUSBANDS_EDUC",
    "MARITAL_STATUS",
    "PATTERN_USE",
]

# Registry: ordered from least-aggressive to most-aggressive reduction
# The baseline ("full_25") is evaluated using the pre-trained v3 joblib models,
# not a fresh retrain. All reduced sets are freshly retrained.
FEATURE_SETS: dict[str, list[str]] = {
    "full_25":   _ALL_FEATURES,
    "reduced_A": _REDUCED_A,
    "reduced_B": _REDUCED_B,
    "reduced_C": _REDUCED_C,
}

# ============================================================================
# MODEL HYPERPARAMETERS  (mirrors v3 production model exactly)
# ============================================================================

XGB_PARAMS: dict = {
    "n_estimators":     300,
    "max_depth":        5,
    "learning_rate":    0.05,
    "subsample":        0.8,
    "colsample_bytree": 0.8,
    "eval_metric":      "logloss",
    "tree_method":      "hist",
    "random_state":     42,
    # scale_pos_weight is computed at train time from the label distribution
}

DT_PARAMS: dict = {
    "max_depth":         6,
    "class_weight":      {0: 1.0, 1: 3.0},
    "min_samples_leaf":  20,
    "criterion":         "gini",
    "splitter":          "best",
    "random_state":      42,
}

# ============================================================================
# HYBRID INFERENCE SETTINGS
# ============================================================================

# Confidence margin is fixed; only threshold is swept
CONF_MARGIN: float = 0.05

# Thresholds to sweep for each reduced feature set
THRESHOLD_SWEEP: list[float] = [0.25, 0.30, 0.35, 0.40, 0.45, 0.50]

# ============================================================================
# SUCCESS CRITERION
# ============================================================================

RECALL_TARGET: float = 0.90
