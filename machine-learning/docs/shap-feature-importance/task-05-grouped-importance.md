# Task 05 — Grouped Importance

## Objective

Collapse per-raw-feature permutation importances to base column groups
when `--grouped` is passed. This is primarily useful for understanding
the combined contribution of high-cardinality categoricals like `REGION`
and `PATTERN_USE` that appear as many OHE columns internally.

## How Grouping Works

Since `permutation_importance` was run on the **full pipeline** with raw
input columns (not post-OHE columns), the per-raw-feature importances from
Task 04 are already grouped at the base column level. The "grouping" step
here therefore re-aggregates the `perm_df` by `feature` — which is a no-op
for this pipeline because raw feature names are already the base names.

This design is intentional: the grouping infrastructure (`_base_feature_name`)
is in place for any future workflow where permutation importance is computed
on the post-OHE transformed array (e.g. for SHAP-style per-category analysis).

## `_base_feature_name` Logic

sklearn's `ColumnTransformer.get_feature_names_out()` produces names like:
- `cat__REGION_NCR` → base: `REGION`
- `cat__HOUSEHOLD_HEAD_SEX_Male` → base: `HOUSEHOLD_HEAD_SEX`
- `num__AGE` → base: `AGE`

The function strips `cat__` / `num__` prefixes, then performs a **greedy
longest-match** against the known raw column list. A naive `split("_")[1]`
would fail for columns like `HOUSEHOLD_HEAD_SEX` (contains multiple `_`).

## Output

### `feature_importance_v3_permutation_grouped.csv`

| column | description |
|---|---|
| `feature` | Base column name |
| `importance_mean` | Summed mean importance |
| `importance_std` | Quadrature-summed std (√Σstd²) |

### `feature_importance_v3_permutation_grouped.png`

Same bar chart format as Task 04, color `#DD8452` (orange) to distinguish.

## Interpretation

- Compare grouped vs. raw to confirm that no single OHE category is driving
  a feature's ranking.
- Particularly relevant for `REGION` and `PATTERN_USE`, which had the most
  negative permutation importance in the existing runs — high cardinality
  can cause spurious negative estimates on small samples.
