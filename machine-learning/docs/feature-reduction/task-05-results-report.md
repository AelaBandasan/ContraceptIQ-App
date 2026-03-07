# Task 05 — Results Report

**Status:** COMPLETE

**Part of:** [VALIDATION_PLAN.md](VALIDATION_PLAN.md)
**Previous task:** [task-04-threshold-selection.md](task-04-threshold-selection.md)

---

## Goal

Consolidate all cross-validation fold results into a final validation report
and produce a definitive pass/fail verdict for each feature set. This is the
**only task that touches the locked test split** (`test.pkl`).

Outputs include:
- A human-readable `validation_report.txt` comparing all 4 feature sets with
  confidence intervals.
- A machine-readable `validated_feature_reduction_config.json` — the
  validated replacement for the original `feature_reduction_config.json`.
- A final `task_05_complete.json` checkpoint.

---

## Prerequisite

All of the following must exist and pass verification:

| Checkpoint | File |
|------------|------|
| Task 01 | `results/checkpoints/task_01_complete.json` |
| Task 02 | `results/checkpoints/task_02_complete.json` |
| Task 03 | `results/checkpoints/task_03_complete.json` |
| Task 04 | `results/checkpoints/task_04_complete.json` |

---

## Inputs

| File | Description |
|------|-------------|
| `results/splits/test.pkl` | `(X_test, y_test)` — the locked 15% hold-out, used here for the first and only time |
| `results/splits/train.pkl` | `(X_train, y_train)` — used to refit the final models on all training data |
| `results/tuned_params/<set>_params.json` | Tuned hyperparameters from Task 02 |
| `results/cv_fold_results/cv_summary.json` | Aggregated CV metrics + CIs from Task 03 |
| `results/cv_fold_results/<set>_folds.csv` | Per-fold details for inclusion in the report |

---

## Outputs

| File | Description |
|------|-------------|
| `results/validation_report.txt` | Full human-readable validation report |
| `results/validated_feature_reduction_config.json` | Validated config for the winning feature set |
| `results/checkpoints/task_05_complete.json` | Final checkpoint |

---

## Final Evaluation Procedure

For each feature set, the following is done **once** using the locked test set:

1. Refit XGBoost and DT pipelines on the **entire `train.pkl`** using tuned
   params from Task 02.
2. Determine the operating threshold: use the **mode threshold** across all 10
   CV folds (the threshold selected most frequently by leak-free validation).
   If there is no single mode, use the median.
3. Apply the hybrid rule on `test.pkl` using the mode threshold.
4. Record recall, precision, F1, ROC-AUC, and confusion matrix.

These are the **final test-set metrics**. They are compared alongside the CV
mean ± CI to confirm the CV estimates were calibrated.

---

## Validation Report Structure

`validation_report.txt` contains the following sections:

### Section 1 — Header
```
======================================================================
  FEATURE REDUCTION VALIDATION REPORT
======================================================================
  Generated        : <ISO-8601 timestamp>
  Recall target    : > 87%
  CV strategy      : Stratified 10-fold
  Threshold rule   : Leak-free (selected on inner val split per fold)
  Final test set   : results/splits/test.pkl  (locked, 15% of full data)
```

### Section 2 — CV Summary Table
One row per feature set. Columns:

| Column | Description |
|--------|-------------|
| Feature Set | Set name |
| N Features | Number of input features |
| CV Recall Mean | Mean recall across 10 folds |
| CV Recall Std | Standard deviation |
| 95% CI | [lower, upper] bootstrap CI |
| CV ROC-AUC Mean | Mean AUC across folds |
| CI Passes Target | Whether CI lower bound > 0.87 |

### Section 3 — Final Test-Set Metrics Table
One row per feature set. Columns: recall, precision, F1, ROC-AUC, threshold
used, confusion matrix summary (TP/FP/TN/FN).

### Section 4 — Per-Feature-Set Detail
For each set: the 10-fold recall values printed as a list, the selected
mode threshold, and a one-paragraph interpretation.

### Section 5 — Recommendation
```
Recommended set : <set_name>  (<n> features)
Operating threshold  : <t*>
CV recall mean  : <value>  (95% CI: [lower, upper])
Final test recall : <value>
Verdict : VALIDATED / NOT VALIDATED

Features kept:
  - FEATURE_1
  - FEATURE_2
  ...
```

**Recommendation logic:**
- Among feature sets where CI lower bound > 0.87 AND final test recall > 0.87,
  select the one with the fewest features.
- Ties broken by highest CV recall mean.
- The baseline (`full_25`) is included in the table for reference but excluded
  from recommendation consideration (it is not a reduction).

---

## `validated_feature_reduction_config.json` Schema

```json
{
  "feature_set_name": "reduced_C",
  "n_features": 10,
  "features": [
    "REGION",
    "CONTRACEPTIVE_METHOD",
    "RELIGION",
    "HUSBAND_AGE",
    "PARITY",
    "AGE",
    "REASON_DISCONTINUED",
    "HUSBANDS_EDUC",
    "MARITAL_STATUS",
    "PATTERN_USE"
  ],
  "operating_threshold": 0.10,
  "conf_margin": 0.20,
  "validation": {
    "strategy": "stratified_10fold_cv",
    "n_folds": 10,
    "cv_recall_mean": 0.9512,
    "cv_recall_std": 0.0234,
    "cv_recall_ci_95_lower": 0.9051,
    "cv_recall_ci_95_upper": 0.9901,
    "cv_roc_auc_mean": 0.9174,
    "final_test_recall": 0.9512,
    "final_test_precision": 0.2548,
    "final_test_f1": 0.4040,
    "final_test_roc_auc": 0.9174
  },
  "hyperparameters": {
    "xgb": { "<tuned params from Task 02>" },
    "dt":  { "<tuned params from Task 02>" }
  },
  "meets_target": true,
  "ci_lower_meets_target": true,
  "validated": true,
  "validation_timestamp": "<ISO-8601>"
}
```

---

## Implementation

**File to create:** `experiments/feature-reduction-validation/reporter.py`

```python
# Pseudocode outline
def build_validation_report(all_cv_results, final_test_results):
    sections = []
    sections.append(build_header())
    sections.append(build_cv_summary_table(all_cv_results))
    sections.append(build_test_metrics_table(final_test_results))
    sections.append(build_per_set_detail(all_cv_results, final_test_results))
    sections.append(build_recommendation(all_cv_results, final_test_results))
    return "\n".join(sections)

def save_validated_config(winner_name, winner_data, path):
    config = {
        "feature_set_name": winner_name,
        "features": winner_data["features"],
        ...
        "validated": True,
    }
    path.write_text(json.dumps(config, indent=2))
```

---

## Checkpoint File

**Path:** `results/checkpoints/task_05_complete.json`

**Written:** Only after both `validation_report.txt` and
`validated_feature_reduction_config.json` are confirmed present and valid.

**Contents:**
```json
{
  "task": "05",
  "status": "complete",
  "timestamp": "<ISO-8601>",
  "recommendation": {
    "feature_set": "<name>",
    "n_features": "<int>",
    "operating_threshold": "<float>",
    "cv_recall_mean": "<float>",
    "ci_95_lower": "<float>",
    "final_test_recall": "<float>",
    "validated": true
  },
  "outputs": {
    "report":  "results/validation_report.txt",
    "config":  "results/validated_feature_reduction_config.json"
  },
  "sha256": {
    "report": "<hex>",
    "config": "<hex>"
  }
}
```

---

## Checkpoint Verification

After Task 05 completes:

1. `task_05_complete.json` exists and `"status"` is `"complete"`.
2. `validated_feature_reduction_config.json` exists and `"validated"` is `true`.
3. `validation_report.txt` contains the string `"VALIDATED"`.
4. `sha256` values match actual files.

```bash
python -c "
import json, hashlib
from pathlib import Path

ckpt = json.loads(Path('results/checkpoints/task_05_complete.json').read_text())
for key, rel_path in ckpt['outputs'].items():
    path = Path(rel_path)
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    expected = ckpt['sha256'][key]
    match = 'OK' if actual == expected else 'MISMATCH'
    print(f'{key}: {match}')

cfg = json.loads(Path('results/validated_feature_reduction_config.json').read_text())
print(f'validated flag : {cfg[\"validated\"]}')
print(f'CI lower       : {cfg[\"validation\"][\"cv_recall_ci_95_lower\"]:.4f}  (target > 0.87)')
"
```

---

## Pass / Fail Criteria

| Check | Pass Condition |
|-------|----------------|
| At least one reduced set is validated | At least one of `reduced_A`, `reduced_B`, `reduced_C` has CV recall CI lower bound > 0.87 AND final test recall > 0.87 |
| No train/test contamination | Final test metrics were computed on `test.pkl` which was not used in Tasks 01–04 |
| Config written | `validated_feature_reduction_config.json` is present, parses, and `"validated"` is `true` |
| Checkpoint integrity | sha256 values match actual output files |

If **no reduced set passes**, the report must clearly state:
- Which sets came closest and their CI ranges.
- Whether the original single-split results were overestimates (compare
  CV means to original reported values).
- A recommendation for next steps (e.g. collect more data, widen the feature
  sets, lower the recall target).

---

## Status Log

| Date | Event |
|------|-------|
| 2026-03-07 | Task completed successfully. `reporter.py` and `run_validation.py` created. Final evaluation on locked test set run for all 4 feature sets. All sets achieved recall=1.0, precision=0.2562, F1=0.4079, ROC-AUC≈0.91 on the 481-sample test set (TP=31, FP=90, TN=360, FN=0). **Recommendation: `reduced_C` (10 features) — VALIDATED.** Operating threshold: 0.12. No issues encountered in this task. Checkpoint written and verified. |
