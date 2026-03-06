# Task 02 — CLI Scaffolding

## Objective

Set up `argparse` entry point and the headless matplotlib backend in
`feature_importance_runner.py`.

## Key Decisions

### `matplotlib.use("Agg")` placement

Must appear **before any pyplot import** — even transitive ones. If anything
in the import chain (e.g. `shap`, `seaborn`) imports pyplot before the backend
is set, the call silently becomes a no-op and the script tries to open a GUI
window. Placing it at the top of the module, immediately after the stdlib
imports, is the only safe approach.

### `n_jobs=1` for permutation importance

`sklearn.inspection.permutation_importance` with `n_jobs=-1` uses `joblib`'s
`loky` backend. On Windows this can deadlock in certain `joblib` + Python
version combinations due to multiprocessing spawn semantics. `n_jobs=1` is
the safe default; parallelism is not critical for runs of ≤1000 samples.

## CLI Arguments

| Argument | Type | Default | Description |
|---|---|---|---|
| `--full-eval` | flag | False | Use full X_test instead of sample |
| `--sample-cap` | int | 500 | Max rows when not using `--full-eval` |
| `--n-repeats` | int | 20 | Permutation repeats |
| `--seed` | int | 42 | Random seed |
| `--grouped` | flag | False | Produce grouped categorical importances |
| `--shap` | flag | False | Run SHAP TreeExplainer |

## Example Invocations

```bash
# Quick sample run (default)
python feature_importance_runner.py

# Full test set, more repeats
python feature_importance_runner.py --full-eval --n-repeats 30

# All outputs
python feature_importance_runner.py --full-eval --n-repeats 20 --grouped --shap
```
