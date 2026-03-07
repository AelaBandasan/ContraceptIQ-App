"""
reporter.py

Task 05 — Results Report

Consolidates CV fold results into a final validation report, evaluates each
feature set on the locked test split for the first and only time, and produces
the validated_feature_reduction_config.json.

Public API
----------
run_report(train_pkl, test_pkl, tuned_params_dir, cv_results_dir,
           output_dir, checkpoints_dir)
    Verify all prior checkpoints, compute final test-set metrics, build the
    validation report, and write the Task 05 checkpoint.
"""

from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from statistics import mode as stat_mode
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
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
# PRIVATE HELPERS — pipeline builders (same as cv_runner.py)
# ============================================================================

def _compute_scale_pos_weight(y: pd.Series) -> float:
    n_pos = int((y == 1).sum())
    n_neg = int((y == 0).sum())
    if n_pos == 0:
        raise ValueError("No positive examples in training labels.")
    return n_neg / n_pos


def _build_and_fit_xgb(X, y, best_params, scale_pos_weight) -> Pipeline:
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


def _build_and_fit_dt(X, y, best_params) -> Pipeline:
    model_params = {
        k.replace("model__", ""): v
        for k, v in best_params.items()
        if k.startswith("model__")
    }
    if "class_weight" in model_params and isinstance(model_params["class_weight"], dict):
        model_params["class_weight"] = {
            int(k): float(v) for k, v in model_params["class_weight"].items()
        }
    dt = DecisionTreeClassifier(
        **model_params, splitter="best", random_state=cfg.RANDOM_SEED
    )
    preprocessor = build_preprocessor(X)
    pipe = Pipeline(steps=[("preprocess", preprocessor), ("model", dt)])
    pipe.fit(X, y)
    return pipe


def _run_hybrid(xgb_pipe, dt_pipe, X, threshold, conf_margin):
    xgb_probs = xgb_pipe.predict_proba(X)[:, 1]
    xgb_pred  = (xgb_probs >= threshold).astype(int)
    dt_pred   = dt_pipe.predict(X)
    hybrid = xgb_pred.copy()
    mask = np.abs(xgb_probs - threshold) < conf_margin
    hybrid[mask & (dt_pred == 1) & (xgb_pred == 0)] = 1
    return hybrid, xgb_probs


def _compute_metrics(y_true, preds, probs) -> dict:
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
        "recall": recall, "precision": precision,
        "f1": f1, "roc_auc": roc_auc,
        "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp),
    }


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ============================================================================
# OPERATING THRESHOLD SELECTION (mode across folds)
# ============================================================================

def _select_operating_threshold(fold_csv: Path) -> float:
    """Return the mode threshold across folds; fall back to median if no mode."""
    df = pd.read_csv(fold_csv)
    thresholds = df["threshold"].tolist()
    counts = pd.Series(thresholds).value_counts()
    if counts.iloc[0] > 1:
        return float(counts.index[0])
    # No clear mode — use median
    return float(np.median(thresholds))


# ============================================================================
# REPORT BUILDING
# ============================================================================

def _fmt(v: Any, decimals: int = 4) -> str:
    if isinstance(v, float) and np.isnan(v):
        return "NaN"
    return f"{v:.{decimals}f}"


def _build_report(
    cv_summary: dict,
    final_results: dict[str, dict],
    recommendation: dict,
) -> str:
    ts = datetime.now(timezone.utc).isoformat()
    lines: list[str] = []

    # ---- Section 1: Header ----
    lines += [
        "=" * 70,
        "  FEATURE REDUCTION VALIDATION REPORT",
        "=" * 70,
        f"  Generated        : {ts}",
        f"  Recall target    : > {cfg.RECALL_TARGET:.0%}",
        f"  CV strategy      : Stratified {cfg.OUTER_CV_FOLDS}-fold",
        f"  Threshold rule   : Leak-free (selected on inner val split per fold)",
        f"  Final test set   : results/splits/test.pkl  (locked, 15% of full data)",
        "",
    ]

    # ---- Section 2: CV Summary Table ----
    lines += [
        "=" * 70,
        "  SECTION 2 — CV SUMMARY TABLE",
        "=" * 70,
        f"{'Feature Set':<14} {'N Feat':>6}  {'CV Recall Mean':>14}  "
        f"{'Std':>6}  {'95% CI':>20}  {'ROC-AUC':>8}  {'CI>Target':>9}",
        "-" * 90,
    ]
    for set_name in cfg.FEATURE_SETS:
        s  = cv_summary[set_name]
        r  = s["recall"]
        a  = s["roc_auc"]
        n  = len(cfg.FEATURE_SETS[set_name])
        ci_str = f"[{_fmt(r['ci_95_lower'])}, {_fmt(r['ci_95_upper'])}]"
        ci_pass = "YES" if s["ci_lower_passes_target"] else "NO "
        lines.append(
            f"{set_name:<14} {n:>6}  {_fmt(r['mean']):>14}  "
            f"{_fmt(r['std']):>6}  {ci_str:>20}  {_fmt(a['mean']):>8}  {ci_pass:>9}"
        )
    lines.append("")

    # ---- Section 3: Final Test-Set Metrics ----
    lines += [
        "=" * 70,
        "  SECTION 3 — FINAL TEST-SET METRICS",
        "=" * 70,
        f"{'Feature Set':<14} {'Threshold':>9}  {'Recall':>8}  "
        f"{'Precision':>9}  {'F1':>8}  {'ROC-AUC':>8}  "
        f"{'TP':>4} {'FP':>4} {'TN':>5} {'FN':>4}",
        "-" * 90,
    ]
    for set_name in cfg.FEATURE_SETS:
        m = final_results[set_name]
        lines.append(
            f"{set_name:<14} {m['threshold']:>9.2f}  "
            f"{_fmt(m['recall']):>8}  {_fmt(m['precision']):>9}  "
            f"{_fmt(m['f1']):>8}  {_fmt(m['roc_auc']):>8}  "
            f"{m['tp']:>4} {m['fp']:>4} {m['tn']:>5} {m['fn']:>4}"
        )
    lines.append("")

    # ---- Section 4: Per-Feature-Set Detail ----
    lines += [
        "=" * 70,
        "  SECTION 4 — PER-FEATURE-SET DETAIL",
        "=" * 70,
    ]
    for set_name in cfg.FEATURE_SETS:
        s = cv_summary[set_name]
        m = final_results[set_name]
        r = s["recall"]
        lines += [
            f"  {set_name}  ({len(cfg.FEATURE_SETS[set_name])} features)",
            f"    10-fold recall values : {[round(v,4) for v in m['fold_recalls']]}",
            f"    Mode threshold (CV)   : {m['threshold']:.2f}",
            f"    Final test recall     : {_fmt(m['recall'])}",
            f"    Final test precision  : {_fmt(m['precision'])}",
            f"    Final test F1         : {_fmt(m['f1'])}",
            f"    Final test ROC-AUC    : {_fmt(m['roc_auc'])}",
            f"    Confusion matrix      : TP={m['tp']} FP={m['fp']} "
            f"TN={m['tn']} FN={m['fn']}",
            f"    CI lower > {cfg.RECALL_TARGET:.0%}     : "
            f"{'YES' if s['ci_lower_passes_target'] else 'NO'}",
            "",
        ]

    # ---- Section 5: Recommendation ----
    lines += [
        "=" * 70,
        "  SECTION 5 — RECOMMENDATION",
        "=" * 70,
    ]
    if recommendation["validated"]:
        winner = recommendation["feature_set"]
        wm = final_results[winner]
        ws = cv_summary[winner]
        wr = ws["recall"]
        lines += [
            f"  Recommended set      : {winner}  "
            f"({recommendation['n_features']} features)",
            f"  Operating threshold  : {recommendation['operating_threshold']:.2f}",
            f"  CV recall mean       : {_fmt(wr['mean'])}  "
            f"(95% CI: [{_fmt(wr['ci_95_lower'])}, {_fmt(wr['ci_95_upper'])}])",
            f"  Final test recall    : {_fmt(wm['recall'])}",
            f"  Verdict              : VALIDATED",
            "",
            "  Features kept:",
        ]
        for feat in cfg.FEATURE_SETS[winner]:
            lines.append(f"    - {feat}")
    else:
        lines += [
            "  Verdict : NOT VALIDATED",
            "  No reduced feature set achieved CV recall CI lower > "
            f"{cfg.RECALL_TARGET:.0%} AND final test recall > {cfg.RECALL_TARGET:.0%}.",
            "",
            "  Closest sets:",
        ]
        for set_name in ["reduced_A", "reduced_B", "reduced_C"]:
            r = cv_summary[set_name]["recall"]
            lines.append(
                f"    {set_name}: CV mean={_fmt(r['mean'])}  "
                f"CI=[{_fmt(r['ci_95_lower'])}, {_fmt(r['ci_95_upper'])}]  "
                f"test_recall={_fmt(final_results[set_name]['recall'])}"
            )
        lines += [
            "",
            "  Recommendation: review feature engineering or collect more data.",
        ]

    lines.append("=" * 70)
    return "\n".join(lines)


# ============================================================================
# PUBLIC API
# ============================================================================

def run_report(
    train_pkl: Path        = cfg.SPLITS_DIR / "train.pkl",
    test_pkl: Path         = cfg.SPLITS_DIR / "test.pkl",
    tuned_params_dir: Path = cfg.TUNED_PARAMS_DIR,
    cv_results_dir: Path   = cfg.CV_RESULTS_DIR,
    output_dir: Path       = cfg.RESULTS_DIR,
    checkpoints_dir: Path  = cfg.CHECKPOINTS_DIR,
) -> dict:
    """
    Run the final evaluation on the locked test set and produce the
    validation report + validated config JSON.

    Returns
    -------
    dict  — the Task 05 checkpoint payload
    """
    # ------------------------------------------------------------------
    # Verify all prior checkpoints
    # ------------------------------------------------------------------
    for task_num, ckpt_path in [
        ("01", checkpoints_dir / "task_01_complete.json"),
        ("02", checkpoints_dir / "task_02_complete.json"),
        ("03", checkpoints_dir / "task_03_complete.json"),
        ("04", checkpoints_dir / "task_04_complete.json"),
    ]:
        if not ckpt_path.exists():
            raise RuntimeError(
                f"Task {task_num} checkpoint not found: {ckpt_path}"
            )
        ckpt = json.loads(ckpt_path.read_text())
        if ckpt.get("status") != "complete":
            raise RuntimeError(
                f"Task {task_num} checkpoint has status "
                f"'{ckpt.get('status')}', expected 'complete'."
            )

    # ------------------------------------------------------------------
    # Load train + LOCKED test splits
    # ------------------------------------------------------------------
    print("[Task 05] Loading train and test splits ...", flush=True)
    X_train, y_train = joblib.load(train_pkl)
    X_test,  y_test  = joblib.load(test_pkl)

    print(f"[Task 05] Train: {len(y_train)} rows | "
          f"Test: {len(y_test)} rows (locked)", flush=True)

    # ------------------------------------------------------------------
    # Load CV summary
    # ------------------------------------------------------------------
    cv_summary = json.loads((cv_results_dir / "cv_summary.json").read_text())

    # ------------------------------------------------------------------
    # Final evaluation on the locked test set
    # ------------------------------------------------------------------
    final_results: dict[str, dict] = {}

    for set_name, feature_cols in cfg.FEATURE_SETS.items():
        print(f"\n[Task 05] Evaluating {set_name} on locked test set ...",
              flush=True)

        # Load tuned params
        tuned = json.loads(
            (tuned_params_dir / f"{set_name}_params.json").read_text()
        )

        # Determine operating threshold (mode across CV folds)
        fold_csv  = cv_results_dir / f"{set_name}_folds.csv"
        threshold = _select_operating_threshold(fold_csv)

        # Load per-fold recalls for reporting
        fold_df = pd.read_csv(fold_csv)
        fold_recalls = fold_df["recall"].tolist()

        # Refit on full train using tuned params
        X_train_sub = X_train[feature_cols]
        X_test_sub  = X_test[feature_cols]

        scale_pos_weight = _compute_scale_pos_weight(y_train)
        xgb_pipe = _build_and_fit_xgb(
            X_train_sub, y_train, tuned["xgb"]["best_params"], scale_pos_weight
        )
        dt_pipe = _build_and_fit_dt(
            X_train_sub, y_train, tuned["dt"]["best_params"]
        )

        # Evaluate on locked test set
        preds, probs = _run_hybrid(
            xgb_pipe, dt_pipe, X_test_sub, threshold, cfg.CONF_MARGIN
        )
        metrics = _compute_metrics(y_test, preds, probs)
        metrics["threshold"]    = threshold
        metrics["fold_recalls"] = fold_recalls

        final_results[set_name] = metrics

        print(
            f"  {set_name}: recall={_fmt(metrics['recall'])}  "
            f"precision={_fmt(metrics['precision'])}  "
            f"threshold={threshold:.2f}  "
            f"TP={metrics['tp']} FN={metrics['fn']}",
            flush=True,
        )

    # ------------------------------------------------------------------
    # Determine recommendation
    # ------------------------------------------------------------------
    # Passing sets: reduced (not full_25) with CI lower > target AND test recall > target
    candidates = [
        set_name
        for set_name in ["reduced_A", "reduced_B", "reduced_C"]
        if (
            cv_summary[set_name]["ci_lower_passes_target"]
            and final_results[set_name]["recall"] > cfg.RECALL_TARGET
        )
    ]

    if candidates:
        # Fewest features wins; break ties by highest CV recall mean
        winner = min(
            candidates,
            key=lambda s: (
                len(cfg.FEATURE_SETS[s]),
                -cv_summary[s]["recall"]["mean"],
            ),
        )
        recommendation = {
            "validated":          True,
            "feature_set":        winner,
            "n_features":         len(cfg.FEATURE_SETS[winner]),
            "operating_threshold": final_results[winner]["threshold"],
            "cv_recall_mean":     cv_summary[winner]["recall"]["mean"],
            "ci_95_lower":        cv_summary[winner]["recall"]["ci_95_lower"],
            "final_test_recall":  final_results[winner]["recall"],
        }
    else:
        recommendation = {
            "validated":          False,
            "feature_set":        None,
            "n_features":         None,
            "operating_threshold": None,
            "cv_recall_mean":     None,
            "ci_95_lower":        None,
            "final_test_recall":  None,
        }

    # ------------------------------------------------------------------
    # Build and save validation report
    # ------------------------------------------------------------------
    output_dir.mkdir(parents=True, exist_ok=True)
    report_str = _build_report(cv_summary, final_results, recommendation)
    report_path = output_dir / "validation_report.txt"
    report_path.write_text(report_str, encoding="utf-8")
    print(f"\n[Task 05] Report written: {report_path}", flush=True)
    print("\n" + report_str, flush=True)

    # ------------------------------------------------------------------
    # Build and save validated_feature_reduction_config.json
    # ------------------------------------------------------------------
    validated_config: dict = {}
    if recommendation["validated"]:
        winner   = recommendation["feature_set"]
        wm       = final_results[winner]
        ws       = cv_summary[winner]
        wr       = ws["recall"]
        wa       = ws["roc_auc"]
        tuned_w  = json.loads(
            (tuned_params_dir / f"{winner}_params.json").read_text()
        )
        validated_config = {
            "feature_set_name": winner,
            "n_features":       len(cfg.FEATURE_SETS[winner]),
            "features":         cfg.FEATURE_SETS[winner],
            "operating_threshold": recommendation["operating_threshold"],
            "conf_margin":       cfg.CONF_MARGIN,
            "validation": {
                "strategy":            "stratified_10fold_cv",
                "n_folds":             cfg.OUTER_CV_FOLDS,
                "cv_recall_mean":      wr["mean"],
                "cv_recall_std":       wr["std"],
                "cv_recall_ci_95_lower": wr["ci_95_lower"],
                "cv_recall_ci_95_upper": wr["ci_95_upper"],
                "cv_roc_auc_mean":     wa["mean"],
                "final_test_recall":   wm["recall"],
                "final_test_precision": wm["precision"],
                "final_test_f1":       wm["f1"],
                "final_test_roc_auc":  wm["roc_auc"],
            },
            "hyperparameters": {
                "xgb": tuned_w["xgb"]["best_params"],
                "dt":  tuned_w["dt"]["best_params"],
            },
            "meets_target":         wm["recall"] > cfg.RECALL_TARGET,
            "ci_lower_meets_target": ws["ci_lower_passes_target"],
            "validated":             True,
            "validation_timestamp":  datetime.now(timezone.utc).isoformat(),
        }
    else:
        # Write a minimal config indicating failure
        validated_config = {
            "feature_set_name": None,
            "validated":        False,
            "validation_timestamp": datetime.now(timezone.utc).isoformat(),
            "reason": "No reduced feature set met both the CV CI target and final test target.",
        }

    config_path = output_dir / "validated_feature_reduction_config.json"
    config_path.write_text(json.dumps(validated_config, indent=2))

    # ------------------------------------------------------------------
    # Write Task 05 checkpoint
    # ------------------------------------------------------------------
    ckpt_05 = {
        "task":      "05",
        "status":    "complete",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "recommendation": recommendation,
        "outputs": {
            "report": str(report_path.relative_to(_HERE)),
            "config": str(config_path.relative_to(_HERE)),
        },
        "sha256": {
            "report": _sha256(report_path),
            "config": _sha256(config_path),
        },
    }
    ckpt_path = checkpoints_dir / "task_05_complete.json"
    ckpt_path.write_text(json.dumps(ckpt_05, indent=2))
    print(f"\n[Task 05] Checkpoint written: {ckpt_path}", flush=True)

    return ckpt_05


# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    run_report()
