"""
feature_importance_runner.py

Standalone CLI runner for feature importance analysis of the high-recall
hybrid model (XGBoost + DT). Supports permutation importance (always),
grouped categorical importance (--grouped), and SHAP TreeExplainer (--shap).

Usage:
    python feature_importance_runner.py --sample-cap 500 --n-repeats 20
    python feature_importance_runner.py --full-eval --n-repeats 20
    python feature_importance_runner.py --full-eval --n-repeats 20 --grouped --shap
"""

# matplotlib must use headless backend before any pyplot import
import matplotlib
matplotlib.use("Agg")

import argparse
import os
import sys

# ============================================================================
# PATHS
# ============================================================================

_HERE = os.path.dirname(os.path.abspath(__file__))
_ML_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", ".."))

DATA_PKL = os.path.join(
    _ML_ROOT, "data", "processed", "discontinuation_design1_data_v2.pkl"
)
MODEL_JOBLIB = os.path.join(
    _HERE, "models_high_risk_v3", "xgb_high_recall.joblib"
)
ARTIFACTS_DIR = os.path.join(_HERE, "models_high_risk_v3")

# ============================================================================
# CLI
# ============================================================================

def parse_args():
    parser = argparse.ArgumentParser(
        description="Feature importance runner for high-recall XGBoost pipeline."
    )
    parser.add_argument(
        "--full-eval",
        action="store_true",
        default=False,
        help="Use the full X_test set instead of a sample (default: False).",
    )
    parser.add_argument(
        "--sample-cap",
        type=int,
        default=500,
        metavar="N",
        help="Max rows to sample from X_test when not using --full-eval (default: 500).",
    )
    parser.add_argument(
        "--n-repeats",
        type=int,
        default=20,
        metavar="N",
        help="Number of permutation repeats (default: 20).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        metavar="SEED",
        help="Random seed for reproducibility (default: 42).",
    )
    parser.add_argument(
        "--grouped",
        action="store_true",
        default=False,
        help="Also produce grouped importances (OHE columns collapsed to base feature).",
    )
    parser.add_argument(
        "--shap",
        action="store_true",
        default=False,
        help="Run SHAP TreeExplainer on the XGBoost model (requires shap>=0.46).",
    )
    return parser.parse_args()


# ============================================================================
# ASSET LOADING
# ============================================================================

def load_assets():
    """Load the train/test split pickle and the trained XGBoost pipeline."""
    import joblib

    if not os.path.exists(DATA_PKL):
        print(f"[ERROR] Data pickle not found: {DATA_PKL}", file=sys.stderr)
        print(
            "  Run the preprocessing notebook to regenerate "
            "discontinuation_design1_data_v2.pkl",
            file=sys.stderr,
        )
        sys.exit(1)

    if not os.path.exists(MODEL_JOBLIB):
        print(f"[ERROR] Model joblib not found: {MODEL_JOBLIB}", file=sys.stderr)
        print(
            "  Run the preprocessing notebook to regenerate xgb_high_recall.joblib",
            file=sys.stderr,
        )
        sys.exit(1)

    data = joblib.load(DATA_PKL)
    pipeline = joblib.load(MODEL_JOBLIB)

    required_keys = {"X_train", "X_test", "y_train", "y_test"}
    missing = required_keys - set(data.keys())
    if missing:
        print(
            f"[ERROR] Data pickle is missing keys: {missing}. "
            "Expected: X_train, X_test, y_train, y_test.",
            file=sys.stderr,
        )
        sys.exit(1)

    return data["X_train"], data["X_test"], data["y_train"], data["y_test"], pipeline


def select_eval_set(X_test, y_test, full_eval, sample_cap, seed):
    """Return the evaluation subset based on CLI flags."""
    import numpy as np

    if full_eval:
        return X_test, y_test, len(X_test)

    n = min(sample_cap, len(X_test))
    rng = np.random.RandomState(seed)
    idx = rng.choice(len(X_test), size=n, replace=False)

    # Support both DataFrame and numpy array
    try:
        X_eval = X_test.iloc[idx].reset_index(drop=True)
        y_eval = y_test.iloc[idx].reset_index(drop=True)
    except AttributeError:
        X_eval = X_test[idx]
        y_eval = y_test[idx]

    return X_eval, y_eval, n


# ============================================================================
# PERMUTATION IMPORTANCE
# ============================================================================

def run_permutation_importance(pipeline, X_eval, y_eval, n_repeats, seed):
    """
    Compute permutation importance on the full pipeline.

    Returns a sorted DataFrame with columns: feature, importance_mean, importance_std.
    """
    import numpy as np
    import pandas as pd
    from sklearn.inspection import permutation_importance

    print(f"\n[INFO] Running permutation importance "
          f"(n_repeats={n_repeats}, n_jobs=1, seed={seed}) ...")

    result = permutation_importance(
        pipeline,
        X_eval,
        y_eval,
        n_repeats=n_repeats,
        n_jobs=1,       # n_jobs=-1 can deadlock on Windows with loky backend
        random_state=seed,
        scoring="roc_auc",
    )

    feature_names = list(X_eval.columns) if hasattr(X_eval, "columns") else [
        f"feature_{i}" for i in range(X_eval.shape[1])
    ]

    df = pd.DataFrame({
        "feature": feature_names,
        "importance_mean": result.importances_mean,
        "importance_std": result.importances_std,
    }).sort_values("importance_mean", ascending=False).reset_index(drop=True)

    return df


def save_permutation_artifacts(df, artifacts_dir):
    """Save permutation importance CSV and barh PNG."""
    import matplotlib.pyplot as plt

    os.makedirs(artifacts_dir, exist_ok=True)

    csv_path = os.path.join(artifacts_dir, "feature_importance_v3_permutation.csv")
    png_path = os.path.join(artifacts_dir, "feature_importance_v3_permutation.png")

    # Warn before overwriting existing artifacts
    for p in (csv_path, png_path):
        if os.path.exists(p):
            print(f"[WARN] Overwriting existing artifact: {p}")

    df.to_csv(csv_path, index=False)
    print(f"[INFO] Saved: {csv_path}")

    # Plot top 15
    top = df.head(15)
    plt.close("all")
    fig, ax = plt.subplots(figsize=(9, 6))
    ax.barh(
        top["feature"][::-1],
        top["importance_mean"][::-1],
        xerr=top["importance_std"][::-1],
        color="#4C72B0",
        ecolor="#999999",
        capsize=3,
    )
    ax.set_xlabel("Mean decrease in ROC-AUC")
    ax.set_title("Permutation Feature Importance (Top 15)")
    ax.axvline(0, color="black", linewidth=0.8, linestyle="--")
    plt.tight_layout()
    plt.savefig(png_path, dpi=150)
    plt.close("all")
    print(f"[INFO] Saved: {png_path}")

    return csv_path, png_path


# ============================================================================
# GROUPED IMPORTANCE
# ============================================================================

def _base_feature_name(ohe_feature_name, known_columns):
    """
    Map an OHE-expanded feature name back to its base column name.

    sklearn's ColumnTransformer names columns as:
      - cat__COLNAME_VALUE  (categorical)
      - num__COLNAME        (numeric)

    We strip the transformer prefix, then match greedily against the known
    raw column list to handle column names that contain underscores
    (e.g. HOUSEHOLD_HEAD_SEX, WANT_LAST_CHILD).
    """
    if ohe_feature_name.startswith("num__"):
        return ohe_feature_name[len("num__"):]

    if ohe_feature_name.startswith("cat__"):
        remainder = ohe_feature_name[len("cat__"):]
        # Greedy match: find the longest known column that is a prefix of remainder
        # followed by '_' (the OHE value separator)
        best = None
        for col in known_columns:
            if remainder == col or remainder.startswith(col + "_"):
                if best is None or len(col) > len(best):
                    best = col
        if best is not None:
            return best

    # Fallback: return as-is
    return ohe_feature_name


def run_grouped_importance(pipeline, perm_df, X_eval, known_columns):
    """
    Collapse per-OHE-column importances to base feature groups.

    Uses the pipeline's preprocessor to get OHE feature names, maps each
    back to its raw column, then sums mean importances per group.

    Returns a sorted DataFrame with columns: feature, importance_mean, importance_std.
    """
    import numpy as np
    import pandas as pd

    preprocessor = pipeline.named_steps["preprocessor"]
    ohe_names = list(preprocessor.get_feature_names_out())

    # Build mapping: ohe_name -> base column
    mapping = {name: _base_feature_name(name, known_columns) for name in ohe_names}

    # Run permutation importance at the OHE level using a transformed pipeline step
    # We re-use the already-computed per-raw-feature importances from perm_df
    # and aggregate by base column. This is the correct approach because
    # permutation_importance was run on the full pipeline (raw features in).
    grouped = (
        perm_df
        .groupby("feature", as_index=False)
        .agg(
            importance_mean=("importance_mean", "sum"),
            importance_std=("importance_std", lambda x: float(np.sqrt((x**2).sum()))),
        )
        .sort_values("importance_mean", ascending=False)
        .reset_index(drop=True)
    )

    return grouped


def save_grouped_artifacts(grouped_df, artifacts_dir):
    """Save grouped importance CSV and barh PNG."""
    import matplotlib.pyplot as plt

    os.makedirs(artifacts_dir, exist_ok=True)

    csv_path = os.path.join(artifacts_dir, "feature_importance_v3_permutation_grouped.csv")
    png_path = os.path.join(artifacts_dir, "feature_importance_v3_permutation_grouped.png")

    for p in (csv_path, png_path):
        if os.path.exists(p):
            print(f"[WARN] Overwriting existing artifact: {p}")

    grouped_df.to_csv(csv_path, index=False)
    print(f"[INFO] Saved: {csv_path}")

    top = grouped_df.head(15)
    plt.close("all")
    fig, ax = plt.subplots(figsize=(9, 6))
    ax.barh(
        top["feature"][::-1],
        top["importance_mean"][::-1],
        xerr=top["importance_std"][::-1],
        color="#DD8452",
        ecolor="#999999",
        capsize=3,
    )
    ax.set_xlabel("Mean decrease in ROC-AUC (grouped)")
    ax.set_title("Grouped Permutation Feature Importance (Top 15)")
    ax.axvline(0, color="black", linewidth=0.8, linestyle="--")
    plt.tight_layout()
    plt.savefig(png_path, dpi=150)
    plt.close("all")
    print(f"[INFO] Saved: {png_path}")

    return csv_path, png_path


# ============================================================================
# SHAP
# ============================================================================

def run_shap(pipeline, X_eval, sample_cap, seed):
    """
    Run SHAP TreeExplainer on the XGBoost model inside the pipeline.

    Steps:
      1. Extract preprocessor and XGBoost model from pipeline steps.
      2. Sample up to min(max(500, sample_cap), 1000) rows.
      3. Transform sample through the preprocessor (produces dense float array).
      4. Wrap in DataFrame with OHE feature names for labelled SHAP plots.
      5. Compute SHAP values via TreeExplainer.
      6. Save beeswarm summary plot and per-feature mean |SHAP| CSV.

    Returns (shap_values, feature_names, X_transformed_df).
    """
    import numpy as np
    import pandas as pd
    import shap
    import matplotlib.pyplot as plt

    preprocessor = pipeline.named_steps["preprocessor"]
    xgb_model = pipeline.named_steps["model"]

    # Sample size: clamp between 500 and 1000
    shap_n = min(max(500, sample_cap), 1000)
    shap_n = min(shap_n, len(X_eval))

    rng = np.random.RandomState(seed)
    try:
        idx = rng.choice(len(X_eval), size=shap_n, replace=False)
        X_shap = X_eval.iloc[idx].reset_index(drop=True)
    except AttributeError:
        idx = rng.choice(X_eval.shape[0], size=shap_n, replace=False)
        X_shap = X_eval[idx]

    print(f"\n[INFO] Running SHAP TreeExplainer on {shap_n} samples ...")

    # Transform to numeric OHE space — preprocessor returns dense array
    # (sparse_output=False is set in preprocessor.py)
    X_transformed = preprocessor.transform(X_shap)

    # DO NOT call .toarray() — it is already a dense numpy ndarray
    feature_names = list(preprocessor.get_feature_names_out())
    X_transformed_df = pd.DataFrame(X_transformed, columns=feature_names)

    explainer = shap.TreeExplainer(xgb_model)
    shap_values = explainer.shap_values(X_transformed_df)

    return shap_values, feature_names, X_transformed_df


def save_shap_artifacts(shap_values, feature_names, X_transformed_df, artifacts_dir):
    """Save SHAP beeswarm summary plot and mean |SHAP| CSV."""
    import numpy as np
    import pandas as pd
    import shap
    import matplotlib.pyplot as plt

    os.makedirs(artifacts_dir, exist_ok=True)

    png_path = os.path.join(artifacts_dir, "feature_importance_v3_shap_summary.png")
    csv_path = os.path.join(artifacts_dir, "feature_importance_v3_shap_values.csv")

    for p in (png_path, csv_path):
        if os.path.exists(p):
            print(f"[WARN] Overwriting existing artifact: {p}")

    # --- Summary plot (beeswarm) ---
    plt.close("all")
    shap.summary_plot(
        shap_values,
        X_transformed_df,
        show=False,         # must be False — prevents GUI popup / hang on headless
        max_display=20,
    )
    plt.tight_layout()
    plt.savefig(png_path, dpi=150, bbox_inches="tight")
    plt.close("all")
    print(f"[INFO] Saved: {png_path}")

    # --- Mean |SHAP| CSV ---
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    shap_df = (
        pd.DataFrame({"feature": feature_names, "mean_abs_shap": mean_abs_shap})
        .sort_values("mean_abs_shap", ascending=False)
        .reset_index(drop=True)
    )
    shap_df.to_csv(csv_path, index=False)
    print(f"[INFO] Saved: {csv_path}")

    return png_path, csv_path


# ============================================================================
# SUMMARY LOGGING
# ============================================================================

def print_summary(args, eval_size, perm_df, artifact_paths):
    """Print run settings and top 15 features to stdout."""
    print("\n" + "=" * 60)
    print("FEATURE IMPORTANCE RUN SUMMARY")
    print("=" * 60)
    print(f"  full-eval  : {args.full_eval}")
    print(f"  sample-cap : {args.sample_cap}")
    print(f"  n-repeats  : {args.n_repeats}")
    print(f"  seed       : {args.seed}")
    print(f"  eval size  : {eval_size} rows")
    print(f"  grouped    : {args.grouped}")
    print(f"  shap       : {args.shap}")
    print()
    print("Top 15 features by permutation importance:")
    print(f"  {'Rank':<5} {'Feature':<40} {'Mean':>10}  {'Std':>10}")
    print(f"  {'-'*5} {'-'*40} {'-'*10}  {'-'*10}")
    for i, row in perm_df.head(15).iterrows():
        print(f"  {i+1:<5} {row['feature']:<40} {row['importance_mean']:>10.6f}  {row['importance_std']:>10.6f}")
    print()
    print("Artifacts written:")
    for path in artifact_paths:
        print(f"  {path}")
    print("=" * 60)


# ============================================================================
# MAIN
# ============================================================================

def main():
    args = parse_args()

    # --- Load ---
    X_train, X_test, y_train, y_test, pipeline = load_assets()

    # --- Eval set ---
    X_eval, y_eval, eval_size = select_eval_set(
        X_test, y_test, args.full_eval, args.sample_cap, args.seed
    )

    artifact_paths = []

    # --- Permutation importance (always) ---
    perm_df = run_permutation_importance(
        pipeline, X_eval, y_eval, args.n_repeats, args.seed
    )
    csv_p, png_p = save_permutation_artifacts(perm_df, ARTIFACTS_DIR)
    artifact_paths += [csv_p, png_p]

    # --- Grouped importance (optional) ---
    if args.grouped:
        known_columns = list(X_eval.columns) if hasattr(X_eval, "columns") else []
        grouped_df = run_grouped_importance(pipeline, perm_df, X_eval, known_columns)
        csv_p, png_p = save_grouped_artifacts(grouped_df, ARTIFACTS_DIR)
        artifact_paths += [csv_p, png_p]

    # --- SHAP (optional) ---
    if args.shap:
        shap_values, feature_names, X_transformed_df = run_shap(
            pipeline, X_eval, args.sample_cap, args.seed
        )
        png_p, csv_p = save_shap_artifacts(
            shap_values, feature_names, X_transformed_df, ARTIFACTS_DIR
        )
        artifact_paths += [png_p, csv_p]

    # --- Summary ---
    print_summary(args, eval_size, perm_df, artifact_paths)


if __name__ == "__main__":
    main()
