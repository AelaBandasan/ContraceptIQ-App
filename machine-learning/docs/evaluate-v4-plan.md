# Evaluation Script Plan — `evaluate_v4.py`

**Status:** Planned
**Target script:** `machine-learning/src/evaluation/evaluate_v4.py`

---

## Objective

Create a standalone, read-only evaluation script for the v4 hybrid model that
outputs the four key metrics requested:

- **Recall**
- **Precision**
- **F-beta (β=2)**
- **ROC-AUC**
- **Confusion matrix** (TP / FP / TN / FN) — supporting context

No existing files will be altered. The script is purely diagnostic.

---

## Design Decisions

### Thresholds and feature list sourced from config

`hybrid_v4_config.json` is the single source of truth for `threshold`,
`conf_margin`, and the `features` array. The script reads these at runtime
rather than hardcoding them, so it stays in sync with the production model
config automatically.

### Dataset

`data/processed/discontinuation_design1_data_v2.pkl` — the same 4-tuple
`(X_train, X_test, y_train, y_test)` used by `train_v4.py` to produce the
numbers already recorded in `hybrid_v4_config.json`. This is the **production
test split** (641 rows, 80/20 split: 2564 train / 641 test).

### F-beta value

`β=2` — matches `FBETA_BETA = 2.0` in
`experiments/feature-reduction-validation/config.py`, which was used for
threshold selection (`cv_runner.py:select_threshold`) and hyperparameter search
scoring (`tuner.py`). Recall is weighted 2× over precision, appropriate for a
high-recall screening task.

### ROC-AUC input

`roc_auc_score` receives raw XGBoost probabilities (not the binary hybrid
predictions), consistent with `train_v4.py:evaluate_hybrid()` and
`cv_runner.py:_compute_metrics()`.

### Hybrid inference rule

Upgrade-only: if XGBoost probability falls within the confidence band
`|p − threshold| < conf_margin` **and** the Decision Tree predicts 1, the
final label is upgraded to HIGH (1). XGBoost predictions above the threshold
are never downgraded. Consistent with `onDeviceRiskService.ts` and all
existing Python evaluation scripts.

### No side effects

The script writes nothing to disk. It is safe to run at any time without
disturbing model files, config files, or dataset pickles.

### Path resolution

All paths are resolved relative to `__file__` (not CWD), so the script can be
run from any working directory:

```
python machine-learning/src/evaluation/evaluate_v4.py
```

---

## Script Structure

```
evaluate_v4.py
├── Module docstring       — purpose, usage, expected output
├── IMPORTS                — stdlib + third-party only (pathlib, json, joblib, numpy, sklearn)
├── PATHS                  — Path(__file__)-relative constants
│   ├── _HERE              — directory of this file
│   ├── _ML_ROOT           — machine-learning/ root (parents[2])
│   ├── DATA_PKL           — data/processed/discontinuation_design1_data_v2.pkl
│   ├── CONFIG_JSON        — src/models/models_high_risk_v4/hybrid_v4_config.json
│   ├── XGB_JOBLIB         — src/models/models_high_risk_v4/xgb_high_recall.joblib
│   └── DT_JOBLIB          — src/models/models_high_risk_v4/dt_high_recall.joblib
├── CONSTANTS              — FBETA_BETA = 2.0
├── load_artifacts()       — loads pkl, subsets to 9 features, loads pipelines
├── hybrid_predict()       — upgrade-only rule → (preds: ndarray, probs: ndarray)
├── compute_metrics()      — recall, precision, fbeta, roc_auc, confusion matrix → dict
├── print_report()         — formats and prints results to stdout
├── main()                 — orchestrates: load → predict → compute → print
└── if __name__ == "__main__"
```

---

## Function Contracts

### `load_artifacts()`

```python
def load_artifacts() -> tuple[pd.DataFrame, pd.Series, Pipeline, Pipeline]:
```

- Loads `DATA_PKL` as `(X_train, X_test, y_train, y_test)`
- Reads `CONFIG_JSON` to get the feature list and inference thresholds
- Subsets `X_test` to the 9 `reduced_C` features
- Loads `xgb_high_recall.joblib` and `dt_high_recall.joblib`
- Returns `(X_test, y_test, xgb_pipe, dt_pipe, cfg)` where `cfg` is the
  parsed config dict

### `hybrid_predict(xgb_pipe, dt_pipe, X, threshold, conf_margin)`

```python
def hybrid_predict(
    xgb_pipe: Pipeline,
    dt_pipe: Pipeline,
    X: pd.DataFrame,
    threshold: float,
    conf_margin: float,
) -> tuple[np.ndarray, np.ndarray]:
```

- Returns `(hybrid_preds, xgb_probs)`
- Pure function — no side effects

### `compute_metrics(y_true, preds, probs, beta)`

```python
def compute_metrics(
    y_true: pd.Series,
    preds: np.ndarray,
    probs: np.ndarray,
    beta: float = FBETA_BETA,
) -> dict:
```

Returns a dict with keys:
`recall`, `precision`, `fbeta`, `roc_auc`, `tp`, `fp`, `tn`, `fn`,
`meets_recall_target`

### `print_report(metrics, cfg, n_test, n_pos)`

Prints a formatted report to stdout. No return value.

---

## Expected Output

```
============================================================
  V4 Hybrid Model - Evaluation Report
  Dataset : data/processed/discontinuation_design1_data_v2.pkl
  Test set: 641 rows  |  Positives: 41  (6.40%)
  Threshold: 0.25  |  Conf margin: 0.05  |  F-beta b=2.0
============================================================
  Recall              :  0.9268
  Precision           :  0.2585
  F-beta  (b=2.00)    :  0.6109
  ROC-AUC             :  0.9084

  Confusion Matrix
  +-----------------------------+
  |  TP:   38    FP:  109       |
  |  FN:    3    TN:  491       |
  +-----------------------------+

  Meets recall target (>0.90)  :  YES
============================================================
```

*(Exact numeric values will match the already-recorded `eval_metrics` in
`hybrid_v4_config.json` if the data and models have not changed.)*

---

## Files Affected

| File | Action |
|---|---|
| `machine-learning/src/evaluation/evaluate_v4.py` | **Created (new)** |
| All other files | **Untouched** |

---

## Dependencies

All packages are already present in `machine-learning/requirements.txt`:

| Package | Use |
|---|---|
| `joblib` | Load `.joblib` pipelines and `.pkl` dataset |
| `numpy` | Array ops for hybrid inference |
| `pandas` | DataFrame handling |
| `scikit-learn` | `recall_score`, `precision_score`, `fbeta_score`, `roc_auc_score`, `confusion_matrix` |

No new packages required.

---

## How to Run

```bash
# From any working directory:
python machine-learning/src/evaluation/evaluate_v4.py

# Or from the machine-learning/ root:
python src/evaluation/evaluate_v4.py
```
