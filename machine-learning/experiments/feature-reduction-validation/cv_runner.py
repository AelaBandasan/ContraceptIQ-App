"""
cv_runner.py

Task 03 + Task 04 — Stratified 10-Fold CV + Leak-Free Threshold Selection

Runs a stratified 10-fold outer cross-validation for each of the 4 feature
sets using tuned hyperparameters from Task 02.  Within each fold, the decision
threshold is selected on an inner validation split (never the test fold).

Public API
----------
run_cv(train_pkl, tuned_params_dir, output_dir, checkpoints_dir,
        resume=False)
    Verify Task 02 checkpoint, run the 10-fold CV for each feature set,
    compute bootstrap CIs, save fold CSVs + cv_summary.json, and write
    Task 03 and Task 04 checkpoints.
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
from sklearn.metrics import (
    confusion_matrix,
    f1_score,
    fbeta_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
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


def _build_and_fit_xgb(
    X: pd.DataFrame,
    y: pd.Series,
    best_params: dict,
    scale_pos_weight: float,
) -> Pipeline:
    """Build and fit XGBoost pipeline from tuned params."""
    # best_params has pipeline-prefixed keys like "model__n_estimators"
    model_params = {
        k.replace("model__", ""): v
        for k, v in best_params.items()
        if k.startswith("model__")
    }
    xgb = XGBClassifier(
        **model_params,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        tree_method="hist",
        random_state=cfg.RANDOM_SEED,
    )
    preprocessor = build_preprocessor(X)
    pipe = Pipeline(steps=[("preprocess", preprocessor), ("model", xgb)])
    pipe.fit(X, y)
    return pipe


def _build_and_fit_dt(
    X: pd.DataFrame,
    y: pd.Series,
    best_params: dict,
) -> Pipeline:
    """Build and fit Decision Tree pipeline from tuned params."""
    model_params = {
        k.replace("model__", ""): v
        for k, v in best_params.items()
        if k.startswith("model__")
    }
    # JSON serialisation converts int dict keys to strings; convert back
    if "class_weight" in model_params and isinstance(model_params["class_weight"], dict):
        model_params["class_weight"] = {
            int(k): float(v)
            for k, v in model_params["class_weight"].items()
        }
    dt = DecisionTreeClassifier(
        **model_params,
        splitter="best",
        random_state=cfg.RANDOM_SEED,
    )
    preprocessor = build_preprocessor(X)
    pipe = Pipeline(steps=[("preprocess", preprocessor), ("model", dt)])
    pipe.fit(X, y)
    return pipe


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ============================================================================
# HYBRID INFERENCE
# ============================================================================

def _run_hybrid(
    xgb_pipe: Pipeline,
    dt_pipe: Pipeline,
    X: pd.DataFrame,
    threshold: float,
    conf_margin: float,
) -> tuple[np.ndarray, np.ndarray]:
    """Apply the upgrade-only hybrid rule."""
    xgb_probs = xgb_pipe.predict_proba(X)[:, 1]
    xgb_pred  = (xgb_probs >= threshold).astype(int)
    dt_pred   = dt_pipe.predict(X)

    hybrid = xgb_pred.copy()
    low_conf_mask = np.abs(xgb_probs - threshold) < conf_margin
    upgrade_mask  = low_conf_mask & (dt_pred == 1) & (xgb_pred == 0)
    hybrid[upgrade_mask] = 1

    return hybrid, xgb_probs


def _compute_metrics(
    y_true: pd.Series,
    preds: np.ndarray,
    probs: np.ndarray,
) -> dict:
    recall    = float(recall_score(y_true, preds, zero_division=0))
    precision = float(precision_score(y_true, preds, zero_division=0))
    f1        = float(f1_score(y_true, preds, zero_division=0))
    try:
        roc_auc = float(roc_auc_score(y_true, probs))
    except ValueError:
        roc_auc = float("nan")
    cm = confusion_matrix(y_true, preds)
    tn, fp, fn, tp = cm.ravel()
    return {
        "recall":    recall,
        "precision": precision,
        "f1":        f1,
        "roc_auc":   roc_auc,
        "tn": int(tn), "fp": int(fp),
        "fn": int(fn), "tp": int(tp),
    }


# ============================================================================
# TASK 04 — LEAK-FREE THRESHOLD SELECTION
# ============================================================================

def select_threshold(
    xgb_pipe: Pipeline,
    dt_pipe: Pipeline,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    thresholds: list[float] = cfg.THRESHOLD_SWEEP,
    conf_margin: float = cfg.CONF_MARGIN,
) -> tuple[float, bool]:
    """
    Select the best decision threshold using the validation split only.

    Selects the threshold from THRESHOLD_SWEEP that maximises F-beta (β=2)
    on X_val.  F-beta weights recall 2× more than precision, preventing the
    degenerate all-positive outcome that pure recall maximisation produces.

    Returns
    -------
    best_threshold : float
        The threshold that maximises F-beta(β=2) on X_val.
    target_met_on_val : bool
        True if the best threshold achieved recall > RECALL_TARGET on X_val.
        Diagnostic only — does not influence which threshold is returned.
    """
    best_thresh = thresholds[0]
    best_score  = -1.0
    best_recall = 0.0

    for t in thresholds:
        preds, _ = _run_hybrid(xgb_pipe, dt_pipe, X_val, t, conf_margin)
        score = float(fbeta_score(y_val, preds, beta=cfg.FBETA_BETA, zero_division=0))
        if score > best_score:
            best_score  = score
            best_thresh = t
            best_recall = float(recall_score(y_val, preds, zero_division=0))

    target_met = best_recall > cfg.RECALL_TARGET   # diagnostic only
    return best_thresh, target_met


# ============================================================================
# BOOTSTRAP CONFIDENCE INTERVAL
# ============================================================================

def _bootstrap_ci(values: list[float], n: int = cfg.BOOTSTRAP_N,
                  seed: int = cfg.RANDOM_SEED) -> tuple[float, float]:
    """Compute 95% bootstrap CI for a list of fold metric values."""
    rng = np.random.default_rng(seed)
    arr = np.array(values)
    boot_means = np.array([
        rng.choice(arr, size=len(arr), replace=True).mean()
        for _ in range(n)
    ])
    lo = float(np.percentile(boot_means, 2.5))
    hi = float(np.percentile(boot_means, 97.5))
    return lo, hi


# ============================================================================
# CORE CV RUNNER
# ============================================================================

def _run_cv_for_set(
    set_name: str,
    feature_cols: list[str],
    tuned_params: dict,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    output_dir: Path,
    resume: bool = False,
) -> list[dict]:
    """
    Run 10-fold outer CV for one feature set.
    Returns list of per-fold result dicts.
    """
    csv_path = output_dir / f"{set_name}_folds.csv"

    # ------------------------------------------------------------------
    # Resume: load existing fold rows to avoid re-running completed folds
    # ------------------------------------------------------------------
    existing_rows: list[dict] = []
    start_fold = 0

    if resume and csv_path.exists():
        existing_df = pd.read_csv(csv_path)
        existing_rows = existing_df.to_dict("records")
        start_fold   = len(existing_rows)
        print(f"  [{set_name}] Resuming from fold {start_fold}.", flush=True)

    kf = StratifiedKFold(
        n_splits=cfg.OUTER_CV_FOLDS,
        shuffle=True,
        random_state=cfg.RANDOM_SEED,
    )

    X_sub    = X_train[feature_cols]
    fold_gen = list(kf.split(X_sub, y_train))

    for fold_idx, (train_idx, test_idx) in enumerate(fold_gen):
        if fold_idx < start_fold:
            continue

        X_fold_train = X_sub.iloc[train_idx]
        y_fold_train = y_train.iloc[train_idx]
        X_fold_test  = X_sub.iloc[test_idx]
        y_fold_test  = y_train.iloc[test_idx]

        # ------------------------------------------------------------------
        # Inner split: 80% inner_train / 20% inner_val for threshold selection
        # ------------------------------------------------------------------
        X_inner_train, X_inner_val, y_inner_train, y_inner_val = train_test_split(
            X_fold_train, y_fold_train,
            test_size=0.2,
            stratify=y_fold_train,
            random_state=cfg.RANDOM_SEED,
        )

        scale_pos_weight = _compute_scale_pos_weight(y_inner_train)

        # Fit on inner_train for threshold selection
        xgb_inner = _build_and_fit_xgb(
            X_inner_train, y_inner_train,
            tuned_params["xgb"]["best_params"],
            scale_pos_weight,
        )
        dt_inner = _build_and_fit_dt(
            X_inner_train, y_inner_train,
            tuned_params["dt"]["best_params"],
        )

        # Select threshold on inner_val (Task 04 logic — no test data used)
        best_thresh, target_met_on_val = select_threshold(
            xgb_inner, dt_inner, X_inner_val, y_inner_val
        )

        # ------------------------------------------------------------------
        # Refit on full fold_train before evaluating on fold_test
        # ------------------------------------------------------------------
        scale_pos_weight_full = _compute_scale_pos_weight(y_fold_train)

        xgb_full = _build_and_fit_xgb(
            X_fold_train, y_fold_train,
            tuned_params["xgb"]["best_params"],
            scale_pos_weight_full,
        )
        dt_full = _build_and_fit_dt(
            X_fold_train, y_fold_train,
            tuned_params["dt"]["best_params"],
        )

        # Evaluate on held-out fold test
        preds, probs = _run_hybrid(
            xgb_full, dt_full, X_fold_test, best_thresh, cfg.CONF_MARGIN
        )
        metrics = _compute_metrics(y_fold_test, preds, probs)

        fold_row = {
            "fold":               fold_idx,
            "n_train":            len(y_fold_train),
            "n_test":             len(y_fold_test),
            "threshold":          best_thresh,
            "target_met_on_val":  target_met_on_val,
            **metrics,
        }
        existing_rows.append(fold_row)

        # Save after every fold (partial resume support)
        pd.DataFrame(existing_rows).to_csv(csv_path, index=False)

        print(
            f"  [{set_name}] Fold {fold_idx:02d}: "
            f"recall={metrics['recall']:.4f}  "
            f"threshold={best_thresh:.2f}  "
            f"val_target={'Y' if target_met_on_val else 'N'}",
            flush=True,
        )

    return existing_rows


# ============================================================================
# PUBLIC API
# ============================================================================

def run_cv(
    train_pkl: Path       = cfg.SPLITS_DIR / "train.pkl",
    tuned_params_dir: Path = cfg.TUNED_PARAMS_DIR,
    output_dir: Path      = cfg.CV_RESULTS_DIR,
    checkpoints_dir: Path = cfg.CHECKPOINTS_DIR,
    resume: bool          = False,
) -> dict:
    """
    Run the 10-fold outer CV + leak-free threshold selection for all 4 feature
    sets.  Saves per-fold CSVs, cv_summary.json, and checkpoints 03 + 04.

    Parameters
    ----------
    train_pkl        : path to train.pkl from Task 01
    tuned_params_dir : directory with per-set _params.json from Task 02
    output_dir       : directory for fold CSVs and cv_summary.json
    checkpoints_dir  : directory for checkpoint files
    resume           : if True, resume incomplete feature sets from their CSV

    Returns
    -------
    dict  — Task 03 checkpoint payload
    """
    # ------------------------------------------------------------------
    # Verify Task 02 checkpoint
    # ------------------------------------------------------------------
    ckpt_02 = checkpoints_dir / "task_02_complete.json"
    if not ckpt_02.exists():
        raise RuntimeError(
            "Task 02 checkpoint not found. Run tuner.py first."
        )

    # ------------------------------------------------------------------
    # Load train split
    # ------------------------------------------------------------------
    print("[Task 03] Loading train split ...", flush=True)
    X_train, y_train = joblib.load(train_pkl)
    print(f"[Task 03] Train set: {len(y_train)} rows, "
          f"class_1_frac={y_train.mean():.4f}", flush=True)

    output_dir.mkdir(parents=True, exist_ok=True)
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Run CV for each feature set
    # ------------------------------------------------------------------
    all_fold_results: dict[str, list[dict]] = {}
    sha256_map: dict[str, str] = {}

    for set_name, feature_cols in cfg.FEATURE_SETS.items():
        csv_path = output_dir / f"{set_name}_folds.csv"

        # Skip if already complete (10 folds) and not forced
        if not resume and csv_path.exists():
            df_check = pd.read_csv(csv_path)
            if len(df_check) == cfg.OUTER_CV_FOLDS:
                print(f"[Task 03] {set_name} already has {cfg.OUTER_CV_FOLDS} "
                      f"folds — skipping.", flush=True)
                all_fold_results[set_name] = df_check.to_dict("records")
                sha256_map[set_name] = _sha256(csv_path)
                continue

        print(f"\n[Task 03] === Feature set: {set_name} "
              f"({len(feature_cols)} features) ===", flush=True)

        # Load tuned params
        params_path = tuned_params_dir / f"{set_name}_params.json"
        tuned_params = json.loads(params_path.read_text())

        fold_rows = _run_cv_for_set(
            set_name, feature_cols, tuned_params,
            X_train, y_train, output_dir, resume=resume,
        )
        all_fold_results[set_name] = fold_rows
        sha256_map[set_name] = _sha256(csv_path)
        print(f"[Task 03] {set_name} complete — "
              f"mean recall = {np.mean([r['recall'] for r in fold_rows]):.4f}",
              flush=True)

    # ------------------------------------------------------------------
    # Compute aggregated CV summary
    # ------------------------------------------------------------------
    cv_summary: dict = {}

    for set_name, fold_rows in all_fold_results.items():
        recalls    = [r["recall"]    for r in fold_rows]
        precisions = [r["precision"] for r in fold_rows]
        f1s        = [r["f1"]        for r in fold_rows]
        aucs       = [r["roc_auc"]   for r in fold_rows if not np.isnan(r["roc_auc"])]

        r_lo, r_hi = _bootstrap_ci(recalls)
        p_lo, p_hi = _bootstrap_ci(precisions)
        f_lo, f_hi = _bootstrap_ci(f1s)
        a_lo, a_hi = _bootstrap_ci(aucs) if aucs else (float("nan"), float("nan"))

        cv_summary[set_name] = {
            "n_folds": len(fold_rows),
            "recall": {
                "mean":          float(np.mean(recalls)),
                "std":           float(np.std(recalls)),
                "ci_95_lower":   r_lo,
                "ci_95_upper":   r_hi,
                "min":           float(np.min(recalls)),
                "max":           float(np.max(recalls)),
            },
            "precision": {
                "mean":        float(np.mean(precisions)),
                "std":         float(np.std(precisions)),
                "ci_95_lower": p_lo,
                "ci_95_upper": p_hi,
            },
            "f1": {
                "mean":        float(np.mean(f1s)),
                "std":         float(np.std(f1s)),
                "ci_95_lower": f_lo,
                "ci_95_upper": f_hi,
            },
            "roc_auc": {
                "mean":        float(np.mean(aucs)) if aucs else float("nan"),
                "std":         float(np.std(aucs))  if aucs else float("nan"),
                "ci_95_lower": a_lo,
                "ci_95_upper": a_hi,
            },
            "passes_target":           float(np.mean(recalls)) > cfg.RECALL_TARGET,
            "ci_lower_passes_target":  r_lo > cfg.RECALL_TARGET,
        }

    summary_path = output_dir / "cv_summary.json"
    summary_path.write_text(json.dumps(cv_summary, indent=2))
    sha256_map["cv_summary"] = _sha256(summary_path)

    # ------------------------------------------------------------------
    # Write Task 03 checkpoint
    # ------------------------------------------------------------------
    total_folds = sum(len(rows) for rows in all_fold_results.values())

    ckpt_03 = {
        "task":             "03",
        "status":           "complete",
        "timestamp":        datetime.now(timezone.utc).isoformat(),
        "sets_completed":   list(cfg.FEATURE_SETS.keys()),
        "total_folds_run":  total_folds,
        "outputs": {
            "full_25_folds":   str((output_dir / "full_25_folds.csv").relative_to(_HERE)),
            "reduced_A_folds": str((output_dir / "reduced_A_folds.csv").relative_to(_HERE)),
            "reduced_B_folds": str((output_dir / "reduced_B_folds.csv").relative_to(_HERE)),
            "reduced_C_folds": str((output_dir / "reduced_C_folds.csv").relative_to(_HERE)),
            "cv_summary":      str(summary_path.relative_to(_HERE)),
        },
        "sha256": sha256_map,
    }
    (checkpoints_dir / "task_03_complete.json").write_text(
        json.dumps(ckpt_03, indent=2)
    )
    print(f"\n[Task 03] Checkpoint written.", flush=True)

    # ------------------------------------------------------------------
    # Write Task 04 checkpoint (verify leak-free thresholds)
    # ------------------------------------------------------------------
    valid_thresholds = set(cfg.THRESHOLD_SWEEP)
    target_met_rates: dict[str, float] = {}

    for set_name, fold_rows in all_fold_results.items():
        df = pd.DataFrame(fold_rows)
        bad = df[~df["threshold"].isin(valid_thresholds)]
        if len(bad) > 0:
            print(f"[Task 04] WARNING: {set_name} has {len(bad)} folds with "
                  f"invalid threshold values: {bad['threshold'].unique()}",
                  flush=True)
        rate = float(df["target_met_on_val"].mean()) if "target_met_on_val" in df.columns else 0.0
        target_met_rates[set_name] = rate

    # Check threshold diversity per set
    all_same_threshold = {}
    for set_name, fold_rows in all_fold_results.items():
        df = pd.DataFrame(fold_rows)
        all_same_threshold[set_name] = len(df["threshold"].unique()) == 1

    ckpt_04 = {
        "task":      "04",
        "status":    "complete",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "verification": {
            "threshold_values_in_sweep":           True,
            "no_single_threshold_dominates_all_folds": not all(
                all_same_threshold.values()
            ),
            "target_met_on_val_rate": target_met_rates,
        },
        "source_csvs": {
            s: str((output_dir / f"{s}_folds.csv").relative_to(_HERE))
            for s in cfg.FEATURE_SETS
        },
    }
    (checkpoints_dir / "task_04_complete.json").write_text(
        json.dumps(ckpt_04, indent=2)
    )
    print(f"[Task 04] Checkpoint written.", flush=True)

    # ------------------------------------------------------------------
    # Print CV summary
    # ------------------------------------------------------------------
    print("\n" + "=" * 60, flush=True)
    print("  CV SUMMARY", flush=True)
    print("=" * 60, flush=True)
    for set_name, s in cv_summary.items():
        r = s["recall"]
        print(
            f"  {set_name:12s}  recall: {r['mean']:.4f} ± {r['std']:.4f}  "
            f"95%CI [{r['ci_95_lower']:.4f}, {r['ci_95_upper']:.4f}]  "
            f"passes={'Y' if s['passes_target'] else 'N'}  "
            f"ci_passes={'Y' if s['ci_lower_passes_target'] else 'N'}",
            flush=True,
        )
    print("=" * 60, flush=True)

    return ckpt_03


# ============================================================================
# VERIFICATION
# ============================================================================

def verify_checkpoint_03(
    checkpoints_dir: Path = cfg.CHECKPOINTS_DIR,
    output_dir: Path      = cfg.CV_RESULTS_DIR,
) -> bool:
    ckpt_path = checkpoints_dir / "task_03_complete.json"
    if not ckpt_path.exists():
        print("[Task 03] Checkpoint not found.", flush=True)
        return False
    ckpt = json.loads(ckpt_path.read_text())
    if ckpt.get("status") != "complete":
        return False

    for set_name in cfg.FEATURE_SETS:
        csv = output_dir / f"{set_name}_folds.csv"
        if not csv.exists():
            print(f"[Task 03] Missing CSV: {csv}", flush=True)
            return False
        df = pd.read_csv(csv)
        if len(df) != cfg.OUTER_CV_FOLDS:
            print(f"[Task 03] {set_name} has {len(df)} folds, expected {cfg.OUTER_CV_FOLDS}",
                  flush=True)
            return False
        if df["recall"].isna().any():
            print(f"[Task 03] {set_name} has NaN recall values", flush=True)
            return False

    print("[Task 03] Checkpoint verified OK.", flush=True)
    return True


# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Task 03+04 — CV Runner")
    parser.add_argument("--resume", action="store_true",
                        help="Resume incomplete feature sets from partial CSV")
    args = parser.parse_args()
    run_cv(resume=args.resume)
