"""
tuner.py

Task 02 — Hyperparameter Search

Runs RandomizedSearchCV with a 5-fold stratified inner CV independently for
each of the 4 feature sets (full_25, reduced_A, reduced_B, reduced_C).
Searches both XGBoost and Decision Tree parameters (n_iter=30 each).
Saves best params per feature set and a search summary CSV.

Public API
----------
run_tuning(train_pkl, output_dir, checkpoints_dir, skip_completed=False)
    Verify Task 01 checkpoint, load train split, run search for each feature
    set, save results and write task_02 checkpoint.
"""

from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier

# ============================================================================
# PATH SETUP
# ============================================================================

_HERE    = Path(__file__).resolve().parent
_ML_ROOT = _HERE.parents[1]
_SRC     = _ML_ROOT / "src"

if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from preprocessing.preprocessor import build_preprocessor
import config as cfg

# ============================================================================
# PRIVATE HELPERS — pipeline builders
# ============================================================================

def _compute_scale_pos_weight(y: pd.Series) -> float:
    n_pos = int((y == 1).sum())
    n_neg = int((y == 0).sum())
    if n_pos == 0:
        raise ValueError("No positive examples in training labels.")
    return n_neg / n_pos


def _build_xgb_pipeline(X_sub: pd.DataFrame, scale_pos_weight: float) -> Pipeline:
    xgb = XGBClassifier(
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        tree_method="hist",
        random_state=cfg.RANDOM_SEED,
    )
    preprocessor = build_preprocessor(X_sub)
    return Pipeline(steps=[("preprocess", preprocessor), ("model", xgb)])


def _build_dt_pipeline(X_sub: pd.DataFrame) -> Pipeline:
    dt = DecisionTreeClassifier(
        splitter="best",
        random_state=cfg.RANDOM_SEED,
    )
    preprocessor = build_preprocessor(X_sub)
    return Pipeline(steps=[("preprocess", preprocessor), ("model", dt)])


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ============================================================================
# CORE SEARCH FUNCTION
# ============================================================================

def _tune_feature_set(
    set_name: str,
    feature_cols: list[str],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    output_dir: Path,
) -> dict:
    """
    Run RandomizedSearchCV for XGBoost and Decision Tree on the given feature
    subset.  Returns a dict of search results for this feature set.
    """
    X_sub = X_train[feature_cols].copy()
    scale_pos_weight = _compute_scale_pos_weight(y_train)

    inner_cv = StratifiedKFold(
        n_splits=cfg.INNER_CV_FOLDS,
        shuffle=True,
        random_state=cfg.RANDOM_SEED,
    )

    # ---- XGBoost search ----
    print(f"  [{set_name}] XGBoost search (n_iter={cfg.N_ITER_SEARCH}) ...",
          flush=True)

    xgb_pipe = _build_xgb_pipeline(X_sub, scale_pos_weight)

    xgb_search = RandomizedSearchCV(
        estimator=xgb_pipe,
        param_distributions=cfg.XGB_PARAM_SPACE,
        n_iter=cfg.N_ITER_SEARCH,
        cv=inner_cv,
        scoring="recall",
        n_jobs=-1,
        random_state=cfg.RANDOM_SEED,
        refit=True,
        return_train_score=False,
    )
    xgb_search.fit(X_sub, y_train)

    xgb_best_params = {
        k: (v.item() if hasattr(v, "item") else v)
        for k, v in xgb_search.best_params_.items()
    }
    xgb_best_recall = float(xgb_search.best_score_)

    print(f"  [{set_name}] XGB best CV recall = {xgb_best_recall:.4f}",
          flush=True)

    # ---- Decision Tree search ----
    print(f"  [{set_name}] Decision Tree search (n_iter={cfg.N_ITER_SEARCH}) ...",
          flush=True)

    dt_pipe = _build_dt_pipeline(X_sub)

    dt_search = RandomizedSearchCV(
        estimator=dt_pipe,
        param_distributions=cfg.DT_PARAM_SPACE,
        n_iter=cfg.N_ITER_SEARCH,
        cv=inner_cv,
        scoring="recall",
        n_jobs=-1,
        random_state=cfg.RANDOM_SEED,
        refit=True,
        return_train_score=False,
    )
    dt_search.fit(X_sub, y_train)

    dt_best_params = {
        k: (v.item() if hasattr(v, "item") else v)
        for k, v in dt_search.best_params_.items()
    }
    dt_best_recall = float(dt_search.best_score_)

    print(f"  [{set_name}] DT  best CV recall = {dt_best_recall:.4f}",
          flush=True)

    # ---- Build result dict ----
    result = {
        "feature_set": set_name,
        "n_features":  len(feature_cols),
        "xgb": {
            "best_params":    xgb_best_params,
            "best_cv_recall": xgb_best_recall,
            "scale_pos_weight": scale_pos_weight,
        },
        "dt": {
            "best_params":    dt_best_params,
            "best_cv_recall": dt_best_recall,
        },
        "search_config": {
            "n_iter":          cfg.N_ITER_SEARCH,
            "inner_cv_folds":  cfg.INNER_CV_FOLDS,
            "scoring":         "recall",
            "random_state":    cfg.RANDOM_SEED,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # ---- Save per-set params JSON ----
    out_path = output_dir / f"{set_name}_params.json"
    out_path.write_text(json.dumps(result, indent=2))

    # ---- Collect CV results rows for the summary CSV ----
    xgb_rows = _extract_cv_rows(xgb_search.cv_results_, set_name, "xgb")
    dt_rows  = _extract_cv_rows(dt_search.cv_results_,  set_name, "dt")
    return result, xgb_rows + dt_rows


def _extract_cv_rows(cv_results: dict, set_name: str, model: str) -> list[dict]:
    """Extract candidate rows from cv_results_ for the summary CSV."""
    rows = []
    for i in range(len(cv_results["mean_test_score"])):
        rows.append({
            "feature_set":       set_name,
            "model":             model,
            "rank":              cv_results["rank_test_score"][i],
            "mean_cv_recall":    cv_results["mean_test_score"][i],
            "std_cv_recall":     cv_results["std_test_score"][i],
        })
    return rows


# ============================================================================
# PUBLIC API
# ============================================================================

def run_tuning(
    train_pkl: Path       = cfg.SPLITS_DIR / "train.pkl",
    output_dir: Path      = cfg.TUNED_PARAMS_DIR,
    checkpoints_dir: Path = cfg.CHECKPOINTS_DIR,
    skip_completed: bool  = False,
) -> dict:
    """
    Run hyperparameter search for all 4 feature sets using the train split.

    Parameters
    ----------
    train_pkl        : path to train.pkl from Task 01
    output_dir       : directory to save per-set param JSON files
    checkpoints_dir  : directory to save checkpoints
    skip_completed   : if True, skip feature sets whose param JSON already exists

    Returns
    -------
    dict  — the checkpoint payload
    """
    # ------------------------------------------------------------------
    # Verify Task 01 checkpoint
    # ------------------------------------------------------------------
    ckpt_01 = checkpoints_dir / "task_01_complete.json"
    if not ckpt_01.exists():
        raise RuntimeError(
            "Task 01 checkpoint not found. Run data_splitter.py first."
        )

    # ------------------------------------------------------------------
    # Load train split
    # ------------------------------------------------------------------
    print("[Task 02] Loading train split ...", flush=True)
    X_train, y_train = joblib.load(train_pkl)
    print(f"[Task 02] Train set: {len(y_train)} rows, "
          f"class_1_frac={y_train.mean():.4f}", flush=True)

    output_dir.mkdir(parents=True, exist_ok=True)
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Run search for each feature set
    # ------------------------------------------------------------------
    all_cv_rows: list[dict] = []
    sets_completed: list[str] = []
    sha256_map: dict[str, str] = {}

    for set_name, feature_cols in cfg.FEATURE_SETS.items():
        out_path = output_dir / f"{set_name}_params.json"

        if skip_completed and out_path.exists():
            print(f"[Task 02] Skipping {set_name} — already complete.",
                  flush=True)
            sets_completed.append(set_name)
            sha256_map[set_name] = _sha256(out_path)
            continue

        print(f"\n[Task 02] === Feature set: {set_name} "
              f"({len(feature_cols)} features) ===", flush=True)

        _, cv_rows = _tune_feature_set(
            set_name, feature_cols, X_train, y_train, output_dir
        )
        all_cv_rows.extend(cv_rows)
        sets_completed.append(set_name)
        sha256_map[set_name] = _sha256(out_path)

        print(f"[Task 02] {set_name} complete.", flush=True)

    # ------------------------------------------------------------------
    # Save search summary CSV
    # ------------------------------------------------------------------
    summary_path = output_dir / "search_summary.csv"
    pd.DataFrame(all_cv_rows).to_csv(summary_path, index=False)

    # ------------------------------------------------------------------
    # Write checkpoint
    # ------------------------------------------------------------------
    checkpoint = {
        "task":            "02",
        "status":          "complete",
        "timestamp":       datetime.now(timezone.utc).isoformat(),
        "sets_completed":  sets_completed,
        "outputs": {
            "full_25":        str((output_dir / "full_25_params.json")
                                  .relative_to(_HERE)),
            "reduced_A":      str((output_dir / "reduced_A_params.json")
                                  .relative_to(_HERE)),
            "reduced_B":      str((output_dir / "reduced_B_params.json")
                                  .relative_to(_HERE)),
            "reduced_C":      str((output_dir / "reduced_C_params.json")
                                  .relative_to(_HERE)),
            "search_summary": str(summary_path.relative_to(_HERE)),
        },
        "sha256": sha256_map,
    }

    ckpt_path = checkpoints_dir / "task_02_complete.json"
    ckpt_path.write_text(json.dumps(checkpoint, indent=2))

    print(f"\n[Task 02] Checkpoint written: {ckpt_path}", flush=True)
    return checkpoint


# ============================================================================
# VERIFICATION
# ============================================================================

def verify_checkpoint(
    checkpoints_dir: Path = cfg.CHECKPOINTS_DIR,
    output_dir: Path = cfg.TUNED_PARAMS_DIR,
) -> bool:
    ckpt_path = checkpoints_dir / "task_02_complete.json"
    if not ckpt_path.exists():
        print("[Task 02] Checkpoint not found.", flush=True)
        return False

    ckpt = json.loads(ckpt_path.read_text())
    if ckpt.get("status") != "complete":
        print("[Task 02] Checkpoint status is not 'complete'.", flush=True)
        return False

    for set_name, expected_hash in ckpt["sha256"].items():
        p = output_dir / f"{set_name}_params.json"
        if not p.exists():
            print(f"[Task 02] Missing param file: {p}", flush=True)
            return False
        actual = _sha256(p)
        if actual != expected_hash:
            print(f"[Task 02] Hash mismatch for {set_name}_params.json",
                  flush=True)
            return False
        # Quick structure check
        data = json.loads(p.read_text())
        if "xgb" not in data or "dt" not in data:
            print(f"[Task 02] Param file for {set_name} missing xgb or dt key.",
                  flush=True)
            return False

    print("[Task 02] Checkpoint verified OK.", flush=True)
    return True


# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Task 02 — Hyperparameter Search")
    parser.add_argument("--skip-completed", action="store_true",
                        help="Skip feature sets whose param JSON already exists")
    args = parser.parse_args()
    run_tuning(skip_completed=args.skip_completed)
