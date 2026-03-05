"""
run_experiment.py

CLI entry point for the feature-reduction experiment.

Usage
-----
From the project root:
    python machine-learning/experiments/feature-reduction/run_experiment.py

Or from the experiment directory:
    python run_experiment.py

What this script does
---------------------
1.  Adds the project's src/ directory to sys.path (once, here only) so that
    the shared preprocessor and model builders can be imported.
2.  Adds this experiment directory to sys.path so sibling modules
    (config, data_loader, trainer, evaluator, reporter) resolve cleanly
    regardless of the working directory the script is invoked from.
3.  Evaluates the BASELINE using the pre-trained v3 .joblib models — no
    retrain, true apples-to-apples reference.
4.  For each reduced feature set, freshly retrains XGBoost + DT pipelines
    with the same v3 hyperparameters, then runs a threshold sweep.
5.  Builds and prints the full comparison report.
6.  Saves report + winning config to results/.
"""

from __future__ import annotations

import sys
from pathlib import Path

# ============================================================================
# PATH SETUP  (must come before any project imports)
# ============================================================================

_HERE    = Path(__file__).resolve().parent          # experiments/feature-reduction/
_ML_ROOT = _HERE.parents[1]                         # machine-learning/
_SRC     = _ML_ROOT / "src"                         # machine-learning/src/

# Allow  `from preprocessing.preprocessor import build_preprocessor`
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

# Allow  `from config import ...`  (sibling modules in same package)
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

# ============================================================================
# PROJECT IMPORTS  (after path setup)
# ============================================================================

import joblib

import config as cfg
import data_loader
import evaluator
import reporter
import trainer

# ============================================================================
# HELPERS
# ============================================================================

def _print_progress(msg: str) -> None:
    print(f"\n[INFO] {msg}", flush=True)


def _evaluate_baseline() -> dict:
    """
    Load the pre-trained v3 models and run a threshold sweep on the full
    25-feature test set.  No retraining is performed.

    Returns the result dict for the "full_25" entry in all_results.
    """
    _print_progress("Evaluating BASELINE (pre-trained v3 models, 25 features) ...")

    for path, label in [
        (cfg.BASELINE_XGB_JOBLIB, "XGB joblib"),
        (cfg.BASELINE_DT_JOBLIB,  "DT  joblib"),
    ]:
        if not path.exists():
            raise FileNotFoundError(
                f"Baseline model not found: {path}\n"
                f"  ({label}) — ensure v3 .joblib files are present."
            )

    xgb_pipeline = joblib.load(cfg.BASELINE_XGB_JOBLIB)
    dt_pipeline  = joblib.load(cfg.BASELINE_DT_JOBLIB)

    _, X_test, _, y_test = data_loader.load_data(cfg.FEATURE_SETS["full_25"], cfg.DATA_PKL)

    sweep = evaluator.threshold_sweep(
        xgb_pipeline, dt_pipeline,
        X_test, y_test,
        cfg.THRESHOLD_SWEEP, cfg.CONF_MARGIN,
    )
    best = evaluator.best_result(sweep)

    print(
        f"  Baseline best -> threshold={best['threshold']:.2f}  "
        f"recall={best['recall']:.4f}  "
        f"precision={best['precision']:.4f}  "
        f"meets_target={best['meets_target']}"
    )

    return {
        "features":    cfg.FEATURE_SETS["full_25"],
        "sweep":       sweep,
        "best":        best,
        "is_baseline": True,
    }


def _evaluate_reduced_set(set_name: str, feature_cols: list[str]) -> dict:
    """
    Retrain the hybrid model on *feature_cols* and run the threshold sweep.

    Returns the result dict for one reduced feature set.
    """
    n = len(feature_cols)
    _print_progress(
        f"Training [{set_name}]  ({n} features):  {', '.join(feature_cols)}"
    )

    X_train, X_test, y_train, y_test = data_loader.load_data(feature_cols, cfg.DATA_PKL)

    print("  Fitting XGBoost pipeline ...", flush=True)
    xgb_pipeline = trainer.build_and_fit_xgb(X_train, y_train)

    print("  Fitting Decision Tree pipeline ...", flush=True)
    dt_pipeline = trainer.build_and_fit_dt(X_train, y_train)

    print("  Running threshold sweep ...", flush=True)
    sweep = evaluator.threshold_sweep(
        xgb_pipeline, dt_pipeline,
        X_test, y_test,
        cfg.THRESHOLD_SWEEP, cfg.CONF_MARGIN,
    )
    best = evaluator.best_result(sweep)

    print(
        f"  Best -> threshold={best['threshold']:.2f}  "
        f"recall={best['recall']:.4f}  "
        f"precision={best['precision']:.4f}  "
        f"meets_target={best['meets_target']}"
    )

    return {
        "features":    feature_cols,
        "sweep":       sweep,
        "best":        best,
        "is_baseline": False,
    }


# ============================================================================
# MAIN
# ============================================================================

def main() -> None:
    print("=" * 70)
    print("  FEATURE REDUCTION EXPERIMENT")
    print(f"  Recall target : > {cfg.RECALL_TARGET:.0%}")
    print(f"  Data          : {cfg.DATA_PKL}")
    print(f"  Results dir   : {cfg.RESULTS_DIR}")
    print("=" * 70)

    all_results: dict[str, dict] = {}

    # ------------------------------------------------------------------
    # Step 1: Baseline  (pre-trained v3 models — no retrain)
    # ------------------------------------------------------------------
    all_results["full_25"] = _evaluate_baseline()

    # ------------------------------------------------------------------
    # Step 2: Reduced feature sets  (fresh retrain for each)
    # ------------------------------------------------------------------
    for set_name, feature_cols in cfg.FEATURE_SETS.items():
        if set_name == "full_25":
            continue  # already handled as baseline above
        all_results[set_name] = _evaluate_reduced_set(set_name, feature_cols)

    # ------------------------------------------------------------------
    # Step 3: Build and print report
    # ------------------------------------------------------------------
    _print_progress("Building report ...")
    report_str = reporter.build_report(all_results)
    print("\n" + report_str)

    # ------------------------------------------------------------------
    # Step 4: Save report to disk
    # ------------------------------------------------------------------
    _print_progress("Saving outputs ...")
    cfg.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    reporter.save_report(report_str, cfg.REPORT_PATH)

    # ------------------------------------------------------------------
    # Step 5: Save winning config (most aggressive passing reduced set)
    # ------------------------------------------------------------------
    passing_reduced = [
        (name, res)
        for name, res in all_results.items()
        if res["best"]["meets_target"] and not res.get("is_baseline")
    ]

    if passing_reduced:
        winner_name, winner_res = min(
            passing_reduced,
            key=lambda x: (len(x[1]["features"]), -x[1]["best"]["recall"]),
        )
        reporter.save_config(
            winner_name,
            winner_res["features"],
            winner_res["best"],
            cfg.CONFIG_PATH,
        )
    else:
        print(
            "\n  [WARN] No reduced feature set met the recall target. "
            "feature_reduction_config.json was NOT written."
        )

    print("\n[DONE]")


if __name__ == "__main__":
    main()
