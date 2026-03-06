# Task 01 — Data Split Refactor

**Status:** PENDING

**Part of:** [VALIDATION_PLAN.md](VALIDATION_PLAN.md)
**Next task:** [task-02-hyperparameter-search.md](task-02-hyperparameter-search.md)

---

## Goal

Produce a proper 3-way stratified split — **train / val / test** — from the
raw full dataset so that:

- The **test set** is locked away and never seen during hyperparameter search
  or threshold selection.
- The **val set** is used only for threshold selection within each outer CV
  fold.
- The **train set** is used for all fitting and inner CV.

The original experiment uses a pre-split pickle
(`discontinuation_design1_data_v2.pkl`) whose test set leaks into threshold
selection. This task creates a fresh split from the full data
(`discontinuation_design1_full_data_v2.pkl`) with a documented seed so it is
fully reproducible.

---

## Inputs

| File | Description |
|------|-------------|
| `machine-learning/data/processed/discontinuation_design1_full_data_v2.pkl` | Full dataset (X, y) before any split — 606 KB |

---

## Outputs

| File | Description |
|------|-------------|
| `experiments/feature-reduction-validation/results/splits/train.pkl` | `(X_train, y_train)` — 70% of data, stratified |
| `experiments/feature-reduction-validation/results/splits/val.pkl` | `(X_val, y_val)` — 15% of data, stratified |
| `experiments/feature-reduction-validation/results/splits/test.pkl` | `(X_test, y_test)` — 15% of data, stratified, locked |
| `experiments/feature-reduction-validation/results/splits/split_manifest.json` | Split sizes, class distribution, random seed, sha256 of each split file |
| `results/checkpoints/task_01_complete.json` | Checkpoint — written only on full success |

---

## Split Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Train fraction | 0.70 | Enough samples for 10-fold CV (each fold has ~7% for test) |
| Val fraction | 0.15 | Used for threshold selection only — kept small to maximise train data |
| Test fraction | 0.15 | Held-out final evaluation — never touched until Task 05 |
| Stratify on | `y` (binary label) | Preserves class imbalance in every split |
| Random seed | 42 | Matches the seed used throughout the v3 pipeline |

---

## Implementation

**File to create:** `experiments/feature-reduction-validation/data_splitter.py`

```python
# Pseudocode outline — implementation fills in the details
def produce_splits(full_data_path, splits_dir, seed=42):
    X, y = load_full_data(full_data_path)

    # First split: hold out test (15%)
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=0.15, stratify=y, random_state=seed
    )

    # Second split: carve val (15% of original = ~17.6% of trainval)
    val_fraction_of_trainval = 0.15 / 0.85
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval,
        test_size=val_fraction_of_trainval, stratify=y_trainval, random_state=seed
    )

    save_splits(splits_dir, X_train, y_train, X_val, y_val, X_test, y_test)
    write_manifest(splits_dir, ...)
    write_checkpoint(...)
```

The `data_splitter.py` module must:

1. Accept a path to `discontinuation_design1_full_data_v2.pkl`.
2. Handle both 2-tuple `(X, y)` and dict `{"X": ..., "y": ...}` pickle formats.
3. Validate that all 25 feature columns are present in `X`.
4. Produce the 3-way stratified split using `sklearn.model_selection.train_test_split`.
5. Save each split as a separate `.pkl` file via `joblib.dump`.
6. Write `split_manifest.json` containing:
   - `n_train`, `n_val`, `n_test`
   - `class_1_frac_train`, `class_1_frac_val`, `class_1_frac_test`
   - `random_seed`
   - `sha256_train`, `sha256_val`, `sha256_test`
7. Write `task_01_complete.json` checkpoint (see below).

---

## Checkpoint File

**Path:** `results/checkpoints/task_01_complete.json`

**Written:** Only after all split files and the manifest are confirmed present
and valid.

**Contents:**
```json
{
  "task": "01",
  "status": "complete",
  "timestamp": "<ISO-8601>",
  "outputs": {
    "train_pkl": "results/splits/train.pkl",
    "val_pkl":   "results/splits/val.pkl",
    "test_pkl":  "results/splits/test.pkl",
    "manifest":  "results/splits/split_manifest.json"
  },
  "split_sizes": {
    "n_train": "<int>",
    "n_val":   "<int>",
    "n_test":  "<int>"
  },
  "sha256": {
    "train": "<hex>",
    "val":   "<hex>",
    "test":  "<hex>"
  }
}
```

---

## Checkpoint Verification

Before proceeding to Task 02, verify:

1. `task_01_complete.json` exists and `"status"` is `"complete"`.
2. All three `.pkl` paths listed in `"outputs"` exist on disk.
3. The `sha256` values in the checkpoint match the actual files:

```bash
python -c "
import hashlib, json
from pathlib import Path

ckpt = json.loads(Path('results/checkpoints/task_01_complete.json').read_text())
for split, expected in ckpt['sha256'].items():
    path = Path(f'results/splits/{split}.pkl')
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    match = '✓' if actual == expected else '✗ MISMATCH'
    print(f'{split}: {match}')
"
```

---

## Pass / Fail Criteria

| Check | Pass Condition |
|-------|----------------|
| Split sizes | `n_train + n_val + n_test == n_total` (no rows lost) |
| Class balance | `class_1_frac` differs by no more than 1 pp across all three splits |
| No overlap | No row index appears in more than one split |
| Checkpoint integrity | sha256 values match actual files |

If any check fails, delete the checkpoint file and re-run Task 01 before
proceeding.

---

## Status Log

> Update this section when the task is completed.

| Date | Event |
|------|-------|
| — | Task not yet started |
