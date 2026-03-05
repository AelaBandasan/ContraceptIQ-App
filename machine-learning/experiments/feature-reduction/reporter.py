"""
reporter.py

Formats the experiment results into a human-readable text report and saves
two output files to the results/ directory:

  feature_reduction_report.txt   — full comparison table + per-set details
  feature_reduction_config.json  — machine-readable config for the winner

Public API
----------
build_report(all_results)       -> str
save_report(report_str, path)   -> None
save_config(winner, features, path) -> None
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from config import RECALL_TARGET

# ============================================================================
# TYPE ALIASES
# ============================================================================

# all_results: { set_name: { "features": [...], "sweep": [...], "best": {...} } }
AllResults = dict[str, dict]

# ============================================================================
# PUBLIC API
# ============================================================================

def build_report(all_results: AllResults) -> str:
    """
    Build a multi-section text report comparing all feature sets.

    Sections
    --------
    1. Header — timestamp, recall target, feature set sizes
    2. Summary table — one row per feature set at its best threshold
    3. Per-set detail — full threshold sweep for each set
    4. Recommendation — most aggressive passing set, or best failing set

    Parameters
    ----------
    all_results : dict keyed by feature-set name.
        Each value must have:
            "features" : list[str]
            "sweep"    : list[dict]  (output of evaluator.threshold_sweep)
            "best"     : dict        (output of evaluator.best_result)
            "is_baseline": bool      (True for the full_25 set)

    Returns
    -------
    str  — the full report text
    """
    lines: list[str] = []

    _section(lines, "FEATURE REDUCTION EXPERIMENT REPORT")
    lines.append(f"  Generated : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"  Recall target (class 1) : > {RECALL_TARGET:.0%}")
    lines.append("")

    # ---- Summary table ----
    _section(lines, "SUMMARY -- BEST THRESHOLD PER FEATURE SET")
    _summary_table(lines, all_results)

    # ---- Per-set detail ----
    _section(lines, "THRESHOLD SWEEP DETAIL")
    for set_name, result in all_results.items():
        _set_detail(lines, set_name, result)

    # ---- Recommendation ----
    _section(lines, "RECOMMENDATION")
    _recommendation(lines, all_results)

    return "\n".join(lines)


def save_report(report_str: str, path: Path) -> None:
    """
    Write the report string to *path*, creating parent directories as needed.

    Parameters
    ----------
    report_str : str   Content returned by build_report().
    path       : Path  Destination file path.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(report_str, encoding="utf-8")
    print(f"  [saved] {path}")


def save_config(
    winner_name: str,
    winner_features: list[str],
    best: dict,
    path: Path,
) -> None:
    """
    Write the winning configuration as a JSON file.

    Parameters
    ----------
    winner_name     : str        Feature-set name (e.g. "reduced_B")
    winner_features : list[str]  Feature columns in the winning set
    best            : dict       Best threshold result dict from evaluator
    path            : Path       Destination file path

    JSON schema
    -----------
    {
        "feature_set_name" : str,
        "n_features"       : int,
        "features"         : list[str],
        "best_threshold"   : float,
        "conf_margin"      : float,
        "recall"           : float,
        "precision"        : float,
        "f1"               : float,
        "roc_auc"          : float,
        "meets_target"     : bool
    }
    """
    from config import CONF_MARGIN

    config: dict = {
        "feature_set_name": winner_name,
        "n_features":       len(winner_features),
        "features":         winner_features,
        "best_threshold":   best["threshold"],
        "conf_margin":      CONF_MARGIN,
        "recall":           round(float(best["recall"]),    6),
        "precision":        round(float(best["precision"]), 6),
        "f1":               round(float(best["f1"]),        6),
        "roc_auc":          round(float(best["roc_auc"]),   6),
        "meets_target":     bool(best["meets_target"]),
    }

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(config, indent=2), encoding="utf-8")
    print(f"  [saved] {path}")


# ============================================================================
# PRIVATE HELPERS — REPORT SECTIONS
# ============================================================================

def _section(lines: list[str], title: str) -> None:
    lines.append("")
    lines.append("=" * 70)
    lines.append(f"  {title}")
    lines.append("=" * 70)


def _summary_table(lines: list[str], all_results: AllResults) -> None:
    """Print a fixed-width comparison table, one row per feature set."""
    col_w = [14, 10, 8, 9, 8, 9, 6, 10]
    headers = [
        "Feature Set", "N Features", "Thresh",
        "Recall", "Prec", "F1", "AUC", "Passes?",
    ]

    header_row = "  " + "  ".join(h.ljust(w) for h, w in zip(headers, col_w))
    lines.append(header_row)
    lines.append("  " + "-" * (sum(col_w) + 2 * len(col_w)))

    for set_name, result in all_results.items():
        b          = result["best"]
        n_features = len(result["features"])
        tag        = "PASS" if b["meets_target"] else "FAIL"
        baseline   = " (baseline)" if result.get("is_baseline") else ""

        row_vals = [
            f"{set_name}{baseline}",
            str(n_features),
            f"{b['threshold']:.2f}",
            f"{b['recall']:.4f}",
            f"{b['precision']:.4f}",
            f"{b['f1']:.4f}",
            f"{b['roc_auc']:.4f}",
            tag,
        ]
        lines.append("  " + "  ".join(v.ljust(w) for v, w in zip(row_vals, col_w)))

    lines.append("")


def _set_detail(lines: list[str], set_name: str, result: dict) -> None:
    """Print the full threshold sweep table for one feature set."""
    baseline_tag = " [baseline -- pre-trained v3 models]" if result.get("is_baseline") else ""
    lines.append(f"\n  [{set_name}]{baseline_tag}")
    lines.append(f"  Features ({len(result['features'])}): {', '.join(result['features'])}")
    lines.append("")

    col_w = [8, 9, 9, 8, 9, 10]
    headers = ["Thresh", "Recall", "Prec", "F1", "AUC", "Passes?"]
    lines.append("    " + "  ".join(h.ljust(w) for h, w in zip(headers, col_w)))
    lines.append("    " + "-" * (sum(col_w) + 2 * len(col_w)))

    for r in result["sweep"]:
        tag = "PASS" if r["meets_target"] else "FAIL"
        row = [
            f"{r['threshold']:.2f}",
            f"{r['recall']:.4f}",
            f"{r['precision']:.4f}",
            f"{r['f1']:.4f}",
            f"{r['roc_auc']:.4f}",
            tag,
        ]
        lines.append("    " + "  ".join(v.ljust(w) for v, w in zip(row, col_w)))

    lines.append("")


def _recommendation(lines: list[str], all_results: AllResults) -> None:
    """
    Identify and describe the recommended feature set.

    Recommendation logic:
      - Among sets that pass RECALL_TARGET at their best threshold, pick the
        one with the fewest features (most aggressive reduction).
      - If multiple sets tie on n_features, pick the one with higher recall.
      - If no set passes, report the closest miss.
    """
    passing = [
        (name, res)
        for name, res in all_results.items()
        if res["best"]["meets_target"] and not res.get("is_baseline")
    ]

    if passing:
        # Most aggressive (fewest features); break ties by highest recall
        winner_name, winner_res = min(
            passing,
            key=lambda x: (len(x[1]["features"]), -x[1]["best"]["recall"]),
        )
        b = winner_res["best"]
        lines.append(
            f"  Recommended set : {winner_name}"
            f"  ({len(winner_res['features'])} features)"
        )
        lines.append(f"  Best threshold  : {b['threshold']:.2f}")
        lines.append(f"  Recall          : {b['recall']:.4f}  (target > {RECALL_TARGET:.0%})")
        lines.append(f"  Precision       : {b['precision']:.4f}")
        lines.append(f"  F1              : {b['f1']:.4f}")
        lines.append(f"  ROC-AUC         : {b['roc_auc']:.4f}")
        lines.append("")
        lines.append(f"  Features kept:")
        for f in winner_res["features"]:
            lines.append(f"    - {f}")
        lines.append("")
        lines.append(
            "  Configuration saved to results/feature_reduction_config.json"
        )
    else:
        # No reduced set passed — report best miss
        non_baseline = {
            k: v for k, v in all_results.items() if not v.get("is_baseline")
        }
        if non_baseline:
            closest_name, closest_res = max(
                non_baseline.items(),
                key=lambda x: x[1]["best"]["recall"],
            )
            b = closest_res["best"]
            lines.append(
                f"  No reduced feature set achieved recall > {RECALL_TARGET:.0%}."
            )
            lines.append(
                f"  Closest: {closest_name} at threshold {b['threshold']:.2f} "
                f"with recall {b['recall']:.4f}."
            )
            lines.append("")
            lines.append(
                "  Consider loosening the recall target or retaining more features."
            )
        else:
            lines.append("  No non-baseline results to evaluate.")

    lines.append("")
