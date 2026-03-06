"""
derive_feature_sets.py

Re-derives _REDUCED_B and _REDUCED_C using permutation importance computed on
an inner fold of X_train only — never on the held-out test set.

Corrects the look-ahead bias in the original feature_importance_runner.py,
which computed permutation importance on X_test and then used those scores to
select _REDUCED_B / _REDUCED_C that were later evaluated on the same X_test.

Algorithm
---------
1. Load train.pkl from the validation pipeline splits directory.
   (X_train, y_train) — the 70% training split; test set is never touched.
2. Create a single stratified 80/20 inner split of X_train.
3. Fit an XGBoost pipeline on the inner 80%.
4. Run permutation_importance on the inner 20% (scoring="roc_auc", n_repeats=20).
5. Derive feature sets:
   - _REDUCED_B : all features with mean_importance > 0 (strictly positive)
   - _REDUCED_C : elbow method on sorted importances (cumulative >= 80% of
                  total positive importance), capped at 12, minimum 6 features
6. Write results/feature_sets_derived.txt (read-only — does NOT edit config.py).

Usage
-----
    python derive_feature_sets.py

Run from the feature-reduction/ experiment directory or any working directory;
all paths are resolved relative to this file.
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.inspection import permutation_importance
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

# ============================================================================
# PATH SETUP
# ============================================================================

_HERE    = Path(__file__).resolve().parent          # feature-reduction/
_ML_ROOT = _HERE.parents[1]                         # machine-learning/
_SRC     = _ML_ROOT / "src"

if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from preprocessing.preprocessor import build_preprocessor  # noqa: E402
import config as cfg                                        # noqa: E402

# ============================================================================
# PATHS
# ============================================================================

# train.pkl produced by data_splitter.py (Task 01 of validation pipeline)
TRAIN_PKL = (
    _ML_ROOT
    / "experiments"
    / "feature-reduction-validation"
    / "results"
    / "splits"
    / "train.pkl"
)

RESULTS_DIR = _HERE / "results"
OUTPUT_TXT  = RESULTS_DIR / "feature_sets_derived.txt"

# ============================================================================
# CONSTANTS
# ============================================================================

INNER_TEST_SIZE = 0.20
RANDOM_STATE    = 42
N_REPEATS       = 20
SCORING         = "roc_auc"
CUMULATIVE_CAP  = 0.80   # cumulative importance threshold for _REDUCED_C
REDUCED_C_MAX   = 12
REDUCED_C_MIN   = 9

# Features to exclude from importance analysis (geographic sampling artifact:
# all class 1 cases come exclusively from NCR — this is a dataset construction
# artifact, not a clinical predictor valid for general deployment).
EXCLUDE_FEATURES = {"REGION"}

# ============================================================================
# HELPERS
# ============================================================================

def _build_xgb_pipeline(X_fit, y_fit) -> Pipeline:
    """Build and fit an XGBoost pipeline using v3/config XGB_PARAMS."""
    n_pos = int((y_fit == 1).sum())
    n_neg = int((y_fit == 0).sum())
    if n_pos == 0:
        raise ValueError("No positive examples in inner fit set.")
    scale_pos_weight = n_neg / n_pos

    xgb = XGBClassifier(
        **cfg.XGB_PARAMS,
        scale_pos_weight=scale_pos_weight,
    )
    preprocessor = build_preprocessor(X_fit)
    pipe = Pipeline(steps=[("preprocess", preprocessor), ("model", xgb)])
    pipe.fit(X_fit, y_fit)
    return pipe


def _elbow_features(
    names: list[str],
    importances: np.ndarray,
    *,
    cum_threshold: float = CUMULATIVE_CAP,
    max_features: int = REDUCED_C_MAX,
    min_features: int = REDUCED_C_MIN,
) -> list[str]:
    """
    Return the smallest prefix of `names` (sorted by descending importance)
    whose cumulative importance covers at least `cum_threshold` of the total
    positive importance, capped at `max_features` and floored at `min_features`.

    Only features with strictly positive importance are considered.
    """
    pos_mask = importances > 0
    if pos_mask.sum() == 0:
        return names[:min_features]

    pos_names = [n for n, m in zip(names, pos_mask) if m]
    pos_imps  = importances[pos_mask]

    # already sorted descending from caller
    total     = pos_imps.sum()
    cumsum    = np.cumsum(pos_imps)
    cutoff    = int(np.searchsorted(cumsum, cum_threshold * total)) + 1
    cutoff    = max(min_features, min(cutoff, max_features, len(pos_names)))

    return pos_names[:cutoff]


# ============================================================================
# MAIN
# ============================================================================

def main() -> None:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 1. Load train.pkl
    # ------------------------------------------------------------------
    if not TRAIN_PKL.exists():
        raise FileNotFoundError(
            f"train.pkl not found at:\n  {TRAIN_PKL}\n"
            "Run run_validation.py (Task 01 of the validation pipeline) first "
            "to produce the train/val/test splits."
        )

    print(f"Loading train split from:\n  {TRAIN_PKL} ...", flush=True)
    X_train, y_train = joblib.load(TRAIN_PKL)
    print(f"  X_train shape : {X_train.shape}", flush=True)
    print(f"  y_train dist  : {dict(y_train.value_counts().sort_index())}",
          flush=True)

    # ------------------------------------------------------------------
    # 2. Inner 80/20 stratified split of X_train
    # ------------------------------------------------------------------
    print("\nCreating inner 80/20 stratified split ...", flush=True)
    all_features = [f for f in cfg._ALL_FEATURES if f not in EXCLUDE_FEATURES]
    if EXCLUDE_FEATURES:
        print(f"  Excluding features (sampling artifact): {sorted(EXCLUDE_FEATURES)}",
              flush=True)
    X_sub = X_train[all_features].copy()

    sss = StratifiedShuffleSplit(
        n_splits=1,
        test_size=INNER_TEST_SIZE,
        random_state=RANDOM_STATE,
    )
    train_idx, val_idx = next(sss.split(X_sub, y_train))

    X_fit = X_sub.iloc[train_idx]
    y_fit = y_train.iloc[train_idx]
    X_val = X_sub.iloc[val_idx]
    y_val = y_train.iloc[val_idx]

    print(f"  Inner fit  : {len(y_fit)} rows  "
          f"class_1_frac={y_fit.mean():.4f}", flush=True)
    print(f"  Inner val  : {len(y_val)} rows  "
          f"class_1_frac={y_val.mean():.4f}", flush=True)

    # ------------------------------------------------------------------
    # 3. Fit XGBoost pipeline on inner fit set
    # ------------------------------------------------------------------
    print("\nFitting XGBoost pipeline on inner fit set ...", flush=True)
    pipe = _build_xgb_pipeline(X_fit, y_fit)
    print("  Fit complete.", flush=True)

    # ------------------------------------------------------------------
    # 4. Permutation importance on inner val set
    # ------------------------------------------------------------------
    print(f"\nRunning permutation_importance "
          f"(scoring={SCORING!r}, n_repeats={N_REPEATS}) ...", flush=True)

    result = permutation_importance(
        pipe,
        X_val,
        y_val,
        scoring=SCORING,
        n_repeats=N_REPEATS,
        n_jobs=1,
        random_state=RANDOM_STATE,
    )

    # Map back to feature names
    feature_names = list(X_fit.columns)
    mean_imp = result.importances_mean
    std_imp  = result.importances_std

    # Sort descending by mean importance
    order     = np.argsort(mean_imp)[::-1]
    sorted_names = [feature_names[i] for i in order]
    sorted_mean  = mean_imp[order]
    sorted_std   = std_imp[order]

    print("  Permutation importance complete.", flush=True)

    # ------------------------------------------------------------------
    # 5. Derive feature sets
    # ------------------------------------------------------------------

    # _REDUCED_B: strictly positive mean importance
    reduced_b = [n for n, m in zip(sorted_names, sorted_mean) if m > 0]

    # _REDUCED_C: elbow method on sorted importances
    reduced_c = _elbow_features(sorted_names, sorted_mean)

    print(f"\n_REDUCED_B ({len(reduced_b)} features): {reduced_b}", flush=True)
    print(f"_REDUCED_C ({len(reduced_c)} features): {reduced_c}", flush=True)

    # ------------------------------------------------------------------
    # 6. Write output text file
    # ------------------------------------------------------------------
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    sep = "=" * 70

    lines: list[str] = [
        sep,
        "  DERIVED FEATURE SETS — ContraceptIQ Discontinuation Risk",
        sep,
        f"  Generated        : {now}",
        f"  Source           : {TRAIN_PKL.name} (inner {int(INNER_TEST_SIZE*100)}% of X_train)",
        f"  Inner split      : StratifiedShuffleSplit 80/20 of X_train only",
        f"  Importance method: permutation_importance ({SCORING}, n_repeats={N_REPEATS})",
        f"  Random state     : {RANDOM_STATE}",
        f"  X_train shape    : {X_train.shape}",
        f"  Inner fit rows   : {len(y_fit)}",
        f"  Inner val rows   : {len(y_val)}",
        f"  Excluded features: {sorted(EXCLUDE_FEATURES) if EXCLUDE_FEATURES else 'none'}",
        (f"  Exclusion reason : REGION is a perfect class separator due to dataset "
         f"construction artifact (all class 1 cases from NCR only). "
         f"Including it would make the model a geography classifier, not a clinical one.")
        if EXCLUDE_FEATURES else "",
        "",
        sep,
        "  SECTION 1 — FULL RANKED IMPORTANCE TABLE",
        sep,
        f"  {'Rank':<6}{'Feature':<32}{'Mean Importance':>17}  {'Std':>8}",
        f"  {'----':<6}{'-------':<32}{'---------------':>17}  {'---':>8}",
    ]

    for rank, (name, mean, std) in enumerate(
        zip(sorted_names, sorted_mean, sorted_std), start=1
    ):
        marker = "  " if mean > 0 else "* "   # * = zero/negative
        lines.append(
            f"  {marker}{rank:<4}  {name:<30}  {mean:>15.6f}   {std:>8.6f}"
        )

    lines += [
        "",
        "  (* = zero or negative importance — excluded from _REDUCED_B and _REDUCED_C)",
        "",
        sep,
        f"  SECTION 2 — RECOMMENDED _REDUCED_B (strictly positive importance)",
        sep,
        f"  Features (N={len(reduced_b)}):",
    ]
    for f in reduced_b:
        lines.append(f"    - {f}")

    lines += [
        "",
        sep,
        f"  SECTION 3 — RECOMMENDED _REDUCED_C "
        f"(elbow / cumulative >= {int(CUMULATIVE_CAP*100)}%)",
        sep,
        f"  Features (N={len(reduced_c)}, "
        f"min={REDUCED_C_MIN}, max={REDUCED_C_MAX}):",
    ]
    # show cumulative importance percentage for transparency
    pos_total = sorted_mean[sorted_mean > 0].sum()
    cum = 0.0
    for f in reduced_c:
        idx  = sorted_names.index(f)
        imp  = sorted_mean[idx]
        cum += max(imp, 0.0)
        pct  = (cum / pos_total * 100) if pos_total > 0 else 0.0
        lines.append(f"    - {f:<30}  cumulative={pct:.1f}%")

    lines += [
        "",
        sep,
        "  NOTE: This script is READ-ONLY.",
        "  It does NOT modify any config.py file.",
        "  After reviewing this output, manually update _REDUCED_B and",
        "  _REDUCED_C in both config files as described in Task 07.",
        sep,
    ]

    output_text = "\n".join(lines) + "\n"
    OUTPUT_TXT.write_text(output_text, encoding="utf-8")
    print(f"\nOutput written to:\n  {OUTPUT_TXT}", flush=True)


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    main()
