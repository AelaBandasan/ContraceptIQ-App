# V4 Model — Evaluation Script Output

**Script:** `machine-learning/src/evaluation/evaluate_v4.py`
**Run date:** 2026-03-17
**Run command:** `python src/evaluation/evaluate_v4.py`

---

## Output

```
[evaluate_v4] Loading artifacts ...
[evaluate_v4] Running hybrid inference on 641 rows ...
[evaluate_v4] Computing metrics ...

==============================================================
  V4 Hybrid Model - Evaluation Report
  Dataset    : data\processed\discontinuation_design1_data_v2.pkl
  Test set   : 641 rows  |  Positives: 41  (6.40%)
  Threshold  : 0.25  |  Conf margin: 0.05  |  F-beta b=2.0
==============================================================
  Recall              :  0.9268
  Precision           :  0.2585
  F-beta  (b=2.00)    :  0.6109
  ROC-AUC             :  0.9084

  Confusion Matrix
  +-----------------------------+
  |  TP:   38    FP:  109       |
  |  FN:    3    TN:  491       |
  +-----------------------------+

  Meets recall target (>0.9)  :  YES
==============================================================
```

---

## Metrics Summary

| Metric | Value |
|---|---|
| Recall | 0.9268 |
| Precision | 0.2585 |
| F-beta (b=2.0) | 0.6109 |
| ROC-AUC | 0.9084 |

| Confusion Matrix | Count |
|---|---|
| True Positives (TP) | 38 |
| False Positives (FP) | 109 |
| False Negatives (FN) | 3 |
| True Negatives (TN) | 491 |

---

## Notes

- **Test set:** 641 rows from `discontinuation_design1_data_v2.pkl` (80/20 split —
  2564 train / 641 test, stratified by `HIGH_RISK_DISCONTINUE`)
- **Positives:** 41 class-1 examples (6.40% of test set)
- **Recall target:** >0.90 — **PASSED** (only 3 false negatives out of 41 positives)
- **F-beta (b=2):** Uses the same β=2 weighting used during hyperparameter search
  (`tuner.py`) and threshold selection (`cv_runner.py:select_threshold`), where
  recall is weighted 2× over precision
- **ROC-AUC** is computed from raw XGBoost probabilities, not the binary hybrid
  predictions, consistent with `train_v4.py:evaluate_hybrid()`
- The Recall and ROC-AUC values (0.9268 / 0.9084) match those recorded in
  `hybrid_v4_config.json:eval_metrics`, confirming the loaded pipelines and
  data are correct; the TP/FP/TN/FN counts differ from the config because the
  current pkl uses a larger test split (641 rows) than the one used when the
  config was first written
