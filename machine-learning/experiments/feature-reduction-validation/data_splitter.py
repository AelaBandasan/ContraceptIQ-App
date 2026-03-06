"""
data_splitter.py

Task 01 — Data Split Refactor

Produces a proper 3-way stratified split (train / val / test) from the full
dataset so that the held-out test set is never seen during hyperparameter
search or threshold selection.

Public API
----------
produce_splits(full_data_path, splits_dir, checkpoints_dir, seed=42)
    Load the full dataset, split it, save the splits, write the manifest and
    the task_01_complete.json checkpoint.
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
from sklearn.model_selection import train_test_split

# ============================================================================
# PATH SETUP  (allow running directly or via run_validation.py)
# ============================================================================

_HERE    = Path(__file__).resolve().parent
_ML_ROOT = _HERE.parents[1]
_SRC     = _ML_ROOT / "src"

if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import config as cfg

# ============================================================================
# CONSTANTS
# ============================================================================

EXPECTED_FEATURES = cfg.FEATURE_SETS["full_25"]   # 25 features


# ============================================================================
# PUBLIC API
# ============================================================================

def produce_splits(
    full_data_path: Path = cfg.FULL_DATA_PKL,
    splits_dir: Path     = cfg.SPLITS_DIR,
    checkpoints_dir: Path = cfg.CHECKPOINTS_DIR,
    seed: int            = cfg.RANDOM_SEED,
) -> dict:
    """
    Load the full dataset, produce a stratified 3-way split, save to disk,
    and write the task_01 checkpoint.

    Returns
    -------
    dict  — the checkpoint payload (also written to task_01_complete.json)
    """
    print("[Task 01] Loading full dataset ...", flush=True)
    X, y = _load_full_data(full_data_path)

    _validate_features(X, full_data_path)

    print(f"[Task 01] Dataset: {len(y)} rows, "
          f"class_1_frac={y.mean():.4f}", flush=True)

    # ------------------------------------------------------------------
    # Split 1: hold out 15% as locked test set
    # ------------------------------------------------------------------
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y,
        test_size=cfg.TEST_FRAC,
        stratify=y,
        random_state=seed,
    )

    # ------------------------------------------------------------------
    # Split 2: carve val (15% of original ≈ 17.647% of trainval)
    # ------------------------------------------------------------------
    val_fraction_of_trainval = cfg.VAL_FRAC / (1.0 - cfg.TEST_FRAC)
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval,
        test_size=val_fraction_of_trainval,
        stratify=y_trainval,
        random_state=seed,
    )

    # ------------------------------------------------------------------
    # Validation checks
    # ------------------------------------------------------------------
    n_total = len(y)
    assert len(y_train) + len(y_val) + len(y_test) == n_total, \
        "Row count mismatch after split"

    # No index overlap
    idx_train = set(X_train.index)
    idx_val   = set(X_val.index)
    idx_test  = set(X_test.index)
    assert len(idx_train & idx_val)  == 0, "Train/val index overlap"
    assert len(idx_train & idx_test) == 0, "Train/test index overlap"
    assert len(idx_val   & idx_test) == 0, "Val/test index overlap"

    print(f"[Task 01] Split sizes: train={len(y_train)}, "
          f"val={len(y_val)}, test={len(y_test)}", flush=True)
    print(f"[Task 01] Class-1 fractions: "
          f"train={y_train.mean():.4f}, "
          f"val={y_val.mean():.4f}, "
          f"test={y_test.mean():.4f}", flush=True)

    # ------------------------------------------------------------------
    # Save splits
    # ------------------------------------------------------------------
    splits_dir.mkdir(parents=True, exist_ok=True)

    train_pkl = splits_dir / "train.pkl"
    val_pkl   = splits_dir / "val.pkl"
    test_pkl  = splits_dir / "test.pkl"

    joblib.dump((X_train, y_train), train_pkl)
    joblib.dump((X_val,   y_val),   val_pkl)
    joblib.dump((X_test,  y_test),  test_pkl)

    print("[Task 01] Splits saved.", flush=True)

    # ------------------------------------------------------------------
    # Compute sha256 hashes
    # ------------------------------------------------------------------
    sha_train = _sha256(train_pkl)
    sha_val   = _sha256(val_pkl)
    sha_test  = _sha256(test_pkl)

    # ------------------------------------------------------------------
    # Write manifest
    # ------------------------------------------------------------------
    manifest = {
        "n_train":            len(y_train),
        "n_val":              len(y_val),
        "n_test":             len(y_test),
        "n_total":            n_total,
        "class_1_frac_train": float(y_train.mean()),
        "class_1_frac_val":   float(y_val.mean()),
        "class_1_frac_test":  float(y_test.mean()),
        "random_seed":        seed,
        "sha256_train":       sha_train,
        "sha256_val":         sha_val,
        "sha256_test":        sha_test,
    }
    manifest_path = splits_dir / "split_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))

    # ------------------------------------------------------------------
    # Write checkpoint
    # ------------------------------------------------------------------
    checkpoint = {
        "task":      "01",
        "status":    "complete",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "outputs": {
            "train_pkl": str(train_pkl.relative_to(_HERE)),
            "val_pkl":   str(val_pkl.relative_to(_HERE)),
            "test_pkl":  str(test_pkl.relative_to(_HERE)),
            "manifest":  str(manifest_path.relative_to(_HERE)),
        },
        "split_sizes": {
            "n_train": len(y_train),
            "n_val":   len(y_val),
            "n_test":  len(y_test),
        },
        "sha256": {
            "train": sha_train,
            "val":   sha_val,
            "test":  sha_test,
        },
    }

    checkpoints_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = checkpoints_dir / "task_01_complete.json"
    ckpt_path.write_text(json.dumps(checkpoint, indent=2))

    print(f"[Task 01] Checkpoint written: {ckpt_path}", flush=True)
    return checkpoint


# ============================================================================
# VERIFICATION
# ============================================================================

def verify_checkpoint(checkpoints_dir: Path = cfg.CHECKPOINTS_DIR,
                      splits_dir: Path = cfg.SPLITS_DIR) -> bool:
    """
    Verify the task_01 checkpoint and all split files.
    Returns True if all checks pass, False otherwise.
    """
    ckpt_path = checkpoints_dir / "task_01_complete.json"
    if not ckpt_path.exists():
        print("[Task 01] Checkpoint not found.", flush=True)
        return False

    ckpt = json.loads(ckpt_path.read_text())
    if ckpt.get("status") != "complete":
        print("[Task 01] Checkpoint status is not 'complete'.", flush=True)
        return False

    for split_name, expected_hash in ckpt["sha256"].items():
        pkl_path = splits_dir / f"{split_name}.pkl"
        if not pkl_path.exists():
            print(f"[Task 01] Missing split file: {pkl_path}", flush=True)
            return False
        actual_hash = _sha256(pkl_path)
        if actual_hash != expected_hash:
            print(f"[Task 01] Hash mismatch for {split_name}.pkl", flush=True)
            return False

    print("[Task 01] Checkpoint verified OK.", flush=True)
    return True


# ============================================================================
# PRIVATE HELPERS
# ============================================================================

def _load_full_data(path: Path) -> tuple[pd.DataFrame, pd.Series]:
    """
    Load the full-data pickle.  Accepts multiple formats:
      - Raw DataFrame  (the full_data_v2.pkl format: columns include target
        'HIGH_RISK_DISCONTINUE' plus feature columns)
      - 2-tuple  (X, y)
      - dict     {"X": ..., "y": ...}
      - dict     {"X_train":..., "X_test":..., "y_train":..., "y_test":...}
        (concatenated into one full dataset)
    """
    TARGET_COL = "HIGH_RISK_DISCONTINUE"
    # Columns that are metadata/derived — not model features
    META_COLS  = {"CASEID", "AGE_GRP", "EDUC", "CURRENT_USE_TYPE",
                  "INTENTION_USE", "CONTRACEPTIVE_USE_AND_INTENTION",
                  TARGET_COL}

    if not path.exists():
        raise FileNotFoundError(
            f"Full data pickle not found: {path}\n"
            "Run the preprocessing notebook to regenerate it."
        )

    raw = joblib.load(path)

    # ---- Format 1: raw DataFrame with target column ----
    if isinstance(raw, pd.DataFrame):
        if TARGET_COL not in raw.columns:
            raise ValueError(
                f"Raw DataFrame at {path} does not contain target column "
                f"'{TARGET_COL}'.\nAvailable columns: {raw.columns.tolist()}"
            )
        X = raw.drop(columns=[c for c in META_COLS if c in raw.columns])
        y = raw[TARGET_COL]
        return _ensure_dataframe(X), _ensure_series(y)

    # ---- Format 2: (X, y) 2-tuple ----
    if isinstance(raw, tuple) and len(raw) == 2:
        X, y = raw
        return _ensure_dataframe(X), _ensure_series(y)

    # ---- Format 3: dict with "X"/"y" keys ----
    if isinstance(raw, dict):
        if "X" in raw and "y" in raw:
            return _ensure_dataframe(raw["X"]), _ensure_series(raw["y"])
        # Format 4: dict with X_train/X_test/y_train/y_test — concatenate
        required = {"X_train", "X_test", "y_train", "y_test"}
        if required.issubset(raw.keys()):
            X = pd.concat([raw["X_train"], raw["X_test"]], ignore_index=True)
            y = pd.concat([raw["y_train"], raw["y_test"]], ignore_index=True)
            return X, y

    raise ValueError(
        f"Unsupported full-data pickle format at {path}: {type(raw)}. "
        "Expected a DataFrame (with 'HIGH_RISK_DISCONTINUE' column), "
        "a (X, y) 2-tuple, or a dict with 'X'/'y' keys."
    )


def _ensure_dataframe(obj) -> pd.DataFrame:
    if isinstance(obj, pd.DataFrame):
        return obj.reset_index(drop=True)
    return pd.DataFrame(obj).reset_index(drop=True)


def _ensure_series(obj) -> pd.Series:
    if isinstance(obj, pd.Series):
        return obj.reset_index(drop=True)
    return pd.Series(obj).reset_index(drop=True)


def _validate_features(X: pd.DataFrame, path: Path) -> None:
    missing = [c for c in EXPECTED_FEATURES if c not in X.columns]
    if missing:
        raise ValueError(
            f"Full data pickle at {path} is missing expected feature columns:\n"
            f"  {missing}\n"
            f"Available columns: {X.columns.tolist()}"
        )


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    produce_splits()
