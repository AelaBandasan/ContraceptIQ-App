"""
calibration_v4.py

Calibration analysis for the V4 hybrid XGBoost + Decision Tree model.

Calibration measures whether a model's predicted probabilities actually reflect
real-world likelihoods — a model is "well-calibrated" if, among all patients it
predicts a 70% discontinuation risk, roughly 70% truly discontinue.

What this script computes
-------------------------
- Calibration curve (reliability diagram) using sklearn's calibration_curve
  with n_bins=10, strategy='uniform'.  Raw XGBoost probabilities are used
  (not the hybrid binary predictions) so the full probability range is visible.
- Brier score: mean squared error between predicted probabilities and true
  binary labels.  Lower is better; < 0.25 is the accepted threshold for a
  useful binary classifier.

Output
------
  machine-learning/src/evaluation/outputs/calibration_plot_v4.png  (300 DPI)

Usage
-----
    cd machine-learning
    python src/evaluation/calibration_v4.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # non-interactive backend — no display required
import matplotlib.pyplot as plt
import numpy as np
from sklearn.calibration import calibration_curve
from sklearn.metrics import brier_score_loss

# ── Import shared helpers from evaluate_v4 ───────────────────────────────────
# Both scripts live in the same package directory; a direct sibling import works
# regardless of whether the package has an __init__.py.
_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE))

from evaluate_v4 import load_artifacts, hybrid_predict  # noqa: E402

# ============================================================================
# CONFIG
# ============================================================================

N_BINS           = 10
STRATEGY         = "uniform"
BRIER_THRESHOLD  = 0.25   # widely used acceptability cut-off for binary tasks
OUTPUT_DIR       = _HERE / "outputs"
OUTPUT_PNG       = OUTPUT_DIR / "calibration_plot_v4.png"
DPI              = 300


# ============================================================================
# CALIBRATION ANALYSIS
# ============================================================================

def run_calibration() -> None:
    print("=" * 62)
    print("  ContraceptIQ — Calibration Analysis (V4 Hybrid Model)")
    print("=" * 62)

    # ── Load artifacts ────────────────────────────────────────────────────────
    print("\nLoading artifacts ...", flush=True)
    X_test, y_test, xgb_pipe, dt_pipe, cfg = load_artifacts()

    threshold   = cfg["threshold_v4"]
    conf_margin = cfg["conf_margin_v4"]
    n_test      = len(y_test)
    n_pos       = int(y_test.sum())

    # ── Run hybrid inference to get raw XGBoost probabilities ─────────────────
    print(f"Running hybrid inference on {n_test} rows ...", flush=True)
    _, xgb_probs = hybrid_predict(xgb_pipe, dt_pipe, X_test, threshold, conf_margin)

    # ── Calibration curve ─────────────────────────────────────────────────────
    print(f"Computing calibration curve (n_bins={N_BINS}, strategy='{STRATEGY}') ...",
          flush=True)
    fraction_of_positives, mean_predicted_prob = calibration_curve(
        y_test,
        xgb_probs,
        n_bins=N_BINS,
        strategy=STRATEGY,
    )

    # ── Brier score ───────────────────────────────────────────────────────────
    brier = float(brier_score_loss(y_test, xgb_probs))
    well_calibrated = brier < BRIER_THRESHOLD

    # ── Plot ──────────────────────────────────────────────────────────────────
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(7, 6))

    # Perfect calibration diagonal
    ax.plot(
        [0, 1], [0, 1],
        linestyle="--",
        color="#94A3B8",
        linewidth=1.5,
        label="Perfectly calibrated",
        zorder=1,
    )

    # Model calibration curve
    ax.plot(
        mean_predicted_prob,
        fraction_of_positives,
        marker="o",
        markersize=6,
        linewidth=2,
        color="#E45A92",
        label=f"Hybrid XGBoost  (Brier = {brier:.3f})",
        zorder=2,
    )

    # Styling
    ax.set_title("Calibration Plot — V4 Hybrid Model", fontsize=14, fontweight="bold", pad=14)
    ax.set_xlabel("Mean Predicted Probability", fontsize=12)
    ax.set_ylabel("Fraction of Positives", fontsize=12)
    ax.set_xlim(0.0, 1.0)
    ax.set_ylim(0.0, 1.0)
    ax.legend(fontsize=11, loc="upper left")
    ax.grid(True, linestyle=":", alpha=0.5)
    fig.tight_layout()

    fig.savefig(OUTPUT_PNG, dpi=DPI)
    plt.close(fig)
    print(f"\nPlot saved: {OUTPUT_PNG}")

    # ── Summary ───────────────────────────────────────────────────────────────
    calibration_verdict = (
        f"ACCEPTABLE  (Brier {brier:.3f} < {BRIER_THRESHOLD})"
        if well_calibrated
        else f"POOR  (Brier {brier:.3f} >= {BRIER_THRESHOLD})"
    )

    divider = "=" * 62
    print()
    print(divider)
    print("  Calibration Summary")
    print(divider)
    print(f"  Test set size          : {n_test} rows  |  {n_pos} positives")
    print(f"  Calibration bins       : {N_BINS}  (strategy = '{STRATEGY}')")
    print(f"  Brier score            : {brier:.6f}")
    print(f"  Well-calibrated?       : {calibration_verdict}")
    print(divider)
    print()


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    run_calibration()
