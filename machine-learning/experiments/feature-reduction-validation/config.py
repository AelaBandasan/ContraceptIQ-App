"""
config.py

All constants for the feature-reduction-validation experiment:
  - Filesystem paths (resolved relative to this file)
  - Candidate feature sets (same as the original experiment)
  - Hyperparameter search spaces for RandomizedSearchCV
  - CV and threshold settings
"""

from __future__ import annotations

from pathlib import Path
from scipy.stats import loguniform, uniform

# ============================================================================
# PATHS
# ============================================================================

# Anchor: this file lives at
#   machine-learning/experiments/feature-reduction-validation/config.py
# So parents[2] == machine-learning/
_HERE    = Path(__file__).resolve().parent
_ML_ROOT = _HERE.parents[1]

# Input: full dataset (X, y) before any split
FULL_DATA_PKL = _ML_ROOT / "data" / "processed" / "discontinuation_design1_full_data_v2.pkl"

# src/ for the shared preprocessor
SRC_PATH = _ML_ROOT / "src"

# Results directories
RESULTS_DIR       = _HERE / "results"
SPLITS_DIR        = RESULTS_DIR / "splits"
CHECKPOINTS_DIR   = RESULTS_DIR / "checkpoints"
TUNED_PARAMS_DIR  = RESULTS_DIR / "tuned_params"
CV_RESULTS_DIR    = RESULTS_DIR / "cv_fold_results"

# Output file paths
VALIDATION_REPORT_PATH = RESULTS_DIR / "validation_report.txt"
VALIDATED_CONFIG_PATH  = RESULTS_DIR / "validated_feature_reduction_config.json"

# Checkpoint paths
CHECKPOINT_01 = CHECKPOINTS_DIR / "task_01_complete.json"
CHECKPOINT_02 = CHECKPOINTS_DIR / "task_02_complete.json"
CHECKPOINT_03 = CHECKPOINTS_DIR / "task_03_complete.json"
CHECKPOINT_04 = CHECKPOINTS_DIR / "task_04_complete.json"
CHECKPOINT_05 = CHECKPOINTS_DIR / "task_05_complete.json"

# ============================================================================
# FEATURE SETS  (identical to the original experiment's config.py)
# ============================================================================

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

_REDUCED_A = [f for f in _ALL_FEATURES if f not in {
    "TOLD_ABT_SIDE_EFFECTS",
    "LAST_SOURCE_TYPE",
}]

# Legacy _REDUCED_B (pre-fix, derived with look-ahead bias + REGION included):
#   "AGE", "REGION", "RELIGION", "MARITAL_STATUS", "RESIDING_WITH_PARTNER",
#   "SMOKE_CIGAR", "HUSBANDS_EDUC", "HUSBAND_AGE", "PARITY", "PATTERN_USE",
#   "CONTRACEPTIVE_METHOD", "REASON_DISCONTINUED"
# Replaced by derive_feature_sets.py (inner-split permutation importance,
# REGION excluded as geographic sampling artifact, strictly positive importance).
_REDUCED_B = [
    "PATTERN_USE",
    "HUSBAND_AGE",
    "AGE",
    "ETHNICITY",
    "HOUSEHOLD_HEAD_SEX",
    "CONTRACEPTIVE_METHOD",
    "SMOKE_CIGAR",
    "DESIRE_FOR_MORE_CHILDREN",
    "PARITY",
    "RELIGION",
    "WANT_LAST_PREGNANCY",
    "RESIDING_WITH_PARTNER",
    "HSBND_DESIRE_FOR_MORE_CHILDREN",
    "LAST_METHOD_DISCONTINUED",
]

# Legacy _REDUCED_C (pre-fix, derived with look-ahead bias + REGION included):
#   "REGION", "CONTRACEPTIVE_METHOD", "RELIGION", "HUSBAND_AGE", "PARITY",
#   "AGE", "REASON_DISCONTINUED", "HUSBANDS_EDUC", "MARITAL_STATUS", "PATTERN_USE"
# Replaced by derive_feature_sets.py (cumulative >= 80%, min=9, REGION excluded).
_REDUCED_C = [
    "PATTERN_USE",
    "HUSBAND_AGE",
    "AGE",
    "ETHNICITY",
    "HOUSEHOLD_HEAD_SEX",
    "CONTRACEPTIVE_METHOD",
    "SMOKE_CIGAR",
    "DESIRE_FOR_MORE_CHILDREN",
    "PARITY",
]

FEATURE_SETS: dict[str, list[str]] = {
    "full_25":   _ALL_FEATURES,
    "reduced_A": _REDUCED_A,
    "reduced_B": _REDUCED_B,
    "reduced_C": _REDUCED_C,
}

# ============================================================================
# SPLIT PARAMETERS
# ============================================================================

RANDOM_SEED: int = 42
TRAIN_FRAC:  float = 0.70
VAL_FRAC:    float = 0.15
TEST_FRAC:   float = 0.15

# ============================================================================
# HYPERPARAMETER SEARCH SPACES
# ============================================================================

# XGBoost search space
# Note: scale_pos_weight is computed per feature set from the label distribution
#       and is NOT included in the search space.
XGB_PARAM_SPACE: dict = {
    "model__n_estimators":     [100, 200, 300, 400, 500],
    "model__max_depth":        [3, 4, 5, 6, 7],
    "model__learning_rate":    loguniform(0.01, 0.19),   # ~[0.01, 0.20]
    "model__subsample":        uniform(0.6, 0.4),        # [0.6, 1.0]
    "model__colsample_bytree": uniform(0.6, 0.4),        # [0.6, 1.0]
    "model__min_child_weight": [1, 3, 5, 7],
    "model__gamma":            uniform(0.0, 0.3),        # [0.0, 0.3]
}

# Decision Tree search space
DT_PARAM_SPACE: dict = {
    "model__max_depth":         [4, 5, 6, 7, 8, 10],
    "model__min_samples_leaf":  [10, 15, 20, 30, 50],
    "model__min_samples_split": [2, 5, 10, 20],
    "model__class_weight":      [
        {0: 1.0, 1: 2.0},
        {0: 1.0, 1: 3.0},
        {0: 1.0, 1: 4.0},
    ],
    "model__criterion":         ["gini", "entropy"],
}

# ============================================================================
# SEARCH SETTINGS
# ============================================================================

N_ITER_SEARCH:   int = 30
INNER_CV_FOLDS:  int = 5

# ============================================================================
# OUTER CV SETTINGS
# ============================================================================

OUTER_CV_FOLDS:  int = 10
BOOTSTRAP_N:     int = 1000    # iterations for 95% CI

# ============================================================================
# HYBRID INFERENCE SETTINGS
# ============================================================================

CONF_MARGIN:      float = 0.05
THRESHOLD_SWEEP:  list[float] = [0.25, 0.30, 0.35, 0.40, 0.45, 0.50]

# ============================================================================
# SUCCESS CRITERION
# ============================================================================

RECALL_TARGET: float = 0.90
FBETA_BETA:    float = 2.0
