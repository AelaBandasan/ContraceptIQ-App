# Task 07 — Console Summary Logging

## Objective

Print a structured run summary after all artifacts are saved, giving an
at-a-glance view of the run configuration and top feature findings.

## Output Format

```
============================================================
FEATURE IMPORTANCE RUN SUMMARY
============================================================
  full-eval  : False
  sample-cap : 500
  n-repeats  : 20
  seed       : 42
  eval size  : 500 rows
  grouped    : False
  shap       : True

Top 15 features by permutation importance:
  Rank  Feature                                       Mean        Std
  ----- ---------------------------------------- ----------  ----------
  1     CONTRACEPTIVE_METHOD                       0.009100    0.003491
  2     OCCUPATION                                 0.008700    0.002704
  ...

Artifacts written:
  /path/to/models_high_risk_v3/feature_importance_v3_permutation.csv
  /path/to/models_high_risk_v3/feature_importance_v3_permutation.png
  /path/to/models_high_risk_v3/feature_importance_v3_shap_summary.png
  /path/to/models_high_risk_v3/feature_importance_v3_shap_values.csv
============================================================
```

## Design Notes

- Summary is printed **after** all artifact saves so it serves as a
  completion signal.
- Artifact paths are absolute (derived from `__file__`), making them
  directly navigable from the terminal output.
- Top 15 limit matches the existing permutation PNG output for consistency.
- `[INFO]` / `[WARN]` / `[ERROR]` prefixes are used throughout the script
  for inline progress messages; the summary section uses a distinct header
  style to visually separate it.
