# Task 10 — Review New `validation_report.txt`

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete — report reviewed, results accepted
- [ ] Verified

---

## Goal

Read the freshly generated `validation_report.txt` and confirm the pipeline is producing honest, non-degenerate results that meet the corrected success criteria.

---

## File to Review

```
machine-learning/experiments/feature-reduction-validation/results/validation_report.txt
```

Also review:

```
machine-learning/experiments/feature-reduction-validation/results/validated_feature_reduction_config.json
machine-learning/experiments/feature-reduction-validation/results/cv_fold_results/cv_summary.json
```

---

## Pass Criteria (all must be true)

| Check | Expected |
|---|---|
| CV recall mean | ≥ 0.90 for the winning feature set |
| CV recall std | > 0.0 (not uniform 1.0 across all folds) |
| Per-fold recall values | Not all 1.0 — there should be some variation |
| FN per fold | > 0 in at least some folds |
| Threshold used | Not uniformly 0.10 or 0.12 — should vary across folds |
| Precision | Noticeably higher than the degenerate 0.256 |
| CI lower bound | > 0.90 |
| `meets_target` in JSON | `true` |

---

## Degenerate Result Flags (any of these = pipeline still broken)

- CV recall = 1.0000 in all folds
- CV recall std = 0.0000
- All folds use the same lowest threshold
- FN = 0 on the final test set
- Precision still around 0.25

---

## Recommended Feature Set Selection

The winner reported in `validated_feature_reduction_config.json` should be reviewed for:
1. Does it still recommend `reduced_C` or another set?
2. What is the operating threshold?
3. Are the metrics defensible for clinical use?

---

## If Results Are Still Degenerate

If recall is still 1.0 in all folds, check the following in order:

1. Confirm `CONF_MARGIN` in config is `0.05`, not `0.20`
2. Confirm `THRESHOLD_SWEEP` starts at `0.25`
3. Confirm `tuner.py` uses `make_scorer(fbeta_score, ...)` not `scoring="recall"`
4. Confirm `cv_runner.py` `select_threshold()` compares F-beta scores, not recall
5. Confirm the stale results were actually deleted (Task 08) — check file timestamps

---

## If Recall Falls Below 90%

The target may be too aggressive for some feature sets. Options:
- Accept the best result if it is close (e.g., 88–89%) and adjust RECALL_TARGET
- Review whether the threshold sweep range needs to extend lower (e.g., add `0.20` back)
- Do not proceed to Task 11 until the results are discussed

---

## Dependencies

- Task 09 must be complete

## Blocks

- Task 11 (train_v4.py edit — only update after results are confirmed satisfactory)
