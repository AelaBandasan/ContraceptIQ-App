"""
run_validation.py

CLI entry point — orchestrates all 5 validation tasks in order.

Usage
-----
From the project root:
    python machine-learning/experiments/feature-reduction-validation/run_validation.py

To resume from a checkpoint after interruption:
    python machine-learning/experiments/feature-reduction-validation/run_validation.py --resume

What this script does
---------------------
1. Task 01 — Data Split Refactor        (data_splitter.py)
2. Task 02 — Hyperparameter Search      (tuner.py)
3. Task 03+04 — 10-fold CV + Threshold  (cv_runner.py)
4. Task 05 — Results Report             (reporter.py)

Each task is skipped if its checkpoint already exists (--resume mode).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# ============================================================================
# PATH SETUP  (must come before any project imports)
# ============================================================================

_HERE    = Path(__file__).resolve().parent       # experiments/feature-reduction-validation/
_ML_ROOT = _HERE.parents[1]                      # machine-learning/
_SRC     = _ML_ROOT / "src"                      # machine-learning/src/

if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

# ============================================================================
# PROJECT IMPORTS  (after path setup)
# ============================================================================

import config as cfg
import data_splitter
import tuner
import cv_runner
import reporter


# ============================================================================
# HELPERS
# ============================================================================

def _checkpoint_exists(path: Path) -> bool:
    if not path.exists():
        return False
    try:
        ckpt = json.loads(path.read_text())
        return ckpt.get("status") == "complete"
    except Exception:
        return False


def _banner(msg: str) -> None:
    print("\n" + "=" * 70, flush=True)
    print(f"  {msg}", flush=True)
    print("=" * 70, flush=True)


# ============================================================================
# MAIN ORCHESTRATOR
# ============================================================================

def main(resume: bool = False) -> None:
    _banner("FEATURE REDUCTION VALIDATION PIPELINE")
    print(f"  Recall target : > {cfg.RECALL_TARGET:.0%}", flush=True)
    print(f"  Full data     : {cfg.FULL_DATA_PKL}", flush=True)
    print(f"  Results dir   : {cfg.RESULTS_DIR}", flush=True)
    print(f"  Resume mode   : {resume}", flush=True)

    # ------------------------------------------------------------------
    # Task 01 — Data Split Refactor
    # ------------------------------------------------------------------
    _banner("TASK 01 — Data Split Refactor")
    if resume and _checkpoint_exists(cfg.CHECKPOINT_01):
        print("[Task 01] Checkpoint found — skipping.", flush=True)
        if not data_splitter.verify_checkpoint(cfg.CHECKPOINTS_DIR, cfg.SPLITS_DIR):
            raise RuntimeError(
                "Task 01 checkpoint exists but verification failed. "
                "Delete the checkpoint and re-run without --resume."
            )
    else:
        data_splitter.produce_splits(
            full_data_path=cfg.FULL_DATA_PKL,
            splits_dir=cfg.SPLITS_DIR,
            checkpoints_dir=cfg.CHECKPOINTS_DIR,
            seed=cfg.RANDOM_SEED,
        )

    # ------------------------------------------------------------------
    # Task 02 — Hyperparameter Search
    # ------------------------------------------------------------------
    _banner("TASK 02 — Hyperparameter Search")
    if resume and _checkpoint_exists(cfg.CHECKPOINT_02):
        print("[Task 02] Checkpoint found — skipping.", flush=True)
        if not tuner.verify_checkpoint(cfg.CHECKPOINTS_DIR, cfg.TUNED_PARAMS_DIR):
            raise RuntimeError(
                "Task 02 checkpoint exists but verification failed."
            )
    else:
        tuner.run_tuning(
            train_pkl=cfg.SPLITS_DIR / "train.pkl",
            output_dir=cfg.TUNED_PARAMS_DIR,
            checkpoints_dir=cfg.CHECKPOINTS_DIR,
            skip_completed=resume,
        )

    # ------------------------------------------------------------------
    # Task 03 + 04 — Outer CV + Leak-Free Threshold Selection
    # ------------------------------------------------------------------
    _banner("TASK 03+04 — Stratified 10-Fold CV + Threshold Selection")
    if resume and _checkpoint_exists(cfg.CHECKPOINT_03):
        print("[Task 03] Checkpoint found — skipping.", flush=True)
        if not cv_runner.verify_checkpoint_03(cfg.CHECKPOINTS_DIR, cfg.CV_RESULTS_DIR):
            raise RuntimeError(
                "Task 03 checkpoint exists but verification failed."
            )
    else:
        cv_runner.run_cv(
            train_pkl=cfg.SPLITS_DIR / "train.pkl",
            tuned_params_dir=cfg.TUNED_PARAMS_DIR,
            output_dir=cfg.CV_RESULTS_DIR,
            checkpoints_dir=cfg.CHECKPOINTS_DIR,
            resume=resume,
        )

    # ------------------------------------------------------------------
    # Task 05 — Results Report
    # ------------------------------------------------------------------
    _banner("TASK 05 — Results Report")
    if resume and _checkpoint_exists(cfg.CHECKPOINT_05):
        print("[Task 05] Checkpoint found — skipping.", flush=True)
    else:
        reporter.run_report(
            train_pkl=cfg.SPLITS_DIR / "train.pkl",
            test_pkl=cfg.SPLITS_DIR / "test.pkl",
            tuned_params_dir=cfg.TUNED_PARAMS_DIR,
            cv_results_dir=cfg.CV_RESULTS_DIR,
            output_dir=cfg.RESULTS_DIR,
            checkpoints_dir=cfg.CHECKPOINTS_DIR,
        )

    _banner("ALL TASKS COMPLETE")
    print(f"  Validation report : {cfg.RESULTS_DIR / 'validation_report.txt'}",
          flush=True)
    print(f"  Validated config  : {cfg.RESULTS_DIR / 'validated_feature_reduction_config.json'}",
          flush=True)


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Feature Reduction Validation Pipeline"
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Skip tasks whose checkpoint already exists and resume from "
             "the first incomplete task.",
    )
    args = parser.parse_args()
    main(resume=args.resume)
