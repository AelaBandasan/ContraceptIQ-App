# Data Preprocessing Notebook Documentation

**File:** `data_preprocess.ipynb`  
**Location:** `machine-learning/src/preprocessing/`  
**Purpose:** Comprehensive data preprocessing pipeline for contraceptive recommendation machine learning models  
**Last Updated:** January 18, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Notebook Structure](#notebook-structure)
3. [Step-by-Step Documentation](#step-by-step-documentation)
4. [Key Components](#key-components)
5. [Data Flow](#data-flow)
6. [Output Artifacts](#output-artifacts)
7. [Configuration Parameters](#configuration-parameters)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This notebook implements a complete data preprocessing and model pipeline workflow for the ContraceptIQ contraceptive recommendation system. It transforms raw merged datasets into model-ready features and creates multiple machine learning pipelines for classification tasks.

### Primary Objectives

1. **Data Standardization**: Convert mixed code/label columns to consistent numeric format
2. **Feature Engineering**: Identify and prepare numeric and categorical features
3. **Data Quality**: Handle missing values and rare categories
4. **Model Pipeline Creation**: Build reproducible scikit-learn pipelines
5. **Hybrid Model Development**: Combine XGBoost and Decision Tree classifiers

### Input Data

- **Source File**: `../../data/interim/merged_dataset.csv`
- **Data Origin**: Merged dataset from NDHS (National Demographic and Health Survey) and clinic data
- **Expected Format**: CSV with mixed numeric/categorical columns

### Output Artifacts

- **Preprocessor**: `preprocessor.joblib` - ColumnTransformer for feature processing
- **Model Pipelines**:
  - `xgb_pipeline.joblib` - XGBoost classification pipeline
  - `dt_pipeline.joblib` - Decision Tree classification pipeline
  - `xgb_pipeline_hybrid.joblib` - XGBoost for hybrid ensemble
  - `dt_pipeline_hybrid.joblib` - Decision Tree for hybrid ensemble

---

## Notebook Structure

The notebook is organized into 16 sequential cells following a logical preprocessing workflow:

| Cell # | Step         | Purpose                            | Type |
| ------ | ------------ | ---------------------------------- | ---- |
| 1      | Introduction | Documentation header               | Code |
| 2      | Step 0       | Import libraries and configuration | Code |
| 3      | Step 1       | Load data from CSV                 | Code |
| 4      | Step 2       | Define standardization mappings    | Code |
| 5      | Step 4       | Target selection and filtering     | Code |
| 6      | Step 5       | Feature type identification        | Code |
| 7      | Step 6       | Mode imputation                    | Code |
| 8      | Step 7       | Rare category handling             | Code |
| 9      | Step 8       | Drop correlated features           | Code |
| 10     | Step 9       | Reconfirm features                 | Code |
| 11     | Step 10      | Define preprocessing transformers  | Code |
| 12     | Step 11      | Train-test split                   | Code |
| 13     | Step 12      | XGBoost pipeline creation          | Code |
| 14     | Step 13      | Decision Tree pipeline creation    | Code |
| 15     | Step 14      | Hybrid ensemble creation           | Code |
| 16     | Final        | Save pipelines to disk             | Code |

---

## Step-by-Step Documentation

### Cell 1: Introduction

```python
# Data Preprocessing Notebook
# This notebook is designed to preprocess the dataset for machine learning tasks.
# It includes steps for data cleaning, feature engineering, and model training.
```

**Purpose**: Provides high-level documentation of notebook intent.

**Actions**: None (documentation only)

---

### Cell 2: Step 0 - Imports & Basic Configuration

**Purpose**: Import all required libraries and set display configurations.

**Libraries Used**:

| Library                   | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `numpy`                   | Numerical operations and array manipulation |
| `pandas`                  | Data manipulation and analysis              |
| `matplotlib.pyplot`       | Visualization (plotting)                    |
| `seaborn`                 | Statistical data visualization              |
| `sklearn.model_selection` | Train-test splitting                        |
| `sklearn.preprocessing`   | Feature encoding (OneHot, Ordinal)          |
| `sklearn.compose`         | ColumnTransformer for mixed features        |
| `sklearn.pipeline`        | Pipeline creation                           |
| `sklearn.impute`          | Missing value imputation                    |
| `sklearn.metrics`         | Model evaluation metrics                    |
| `xgboost`                 | XGBoost classifier                          |
| `sklearn.tree`            | Decision Tree classifier                    |

**Configuration Settings**:

- `pd.set_option("display.max_columns", 100)` - Display up to 100 columns
- `pd.set_option("display.width", 200)` - Set display width to 200 characters
- `sns.set_theme(style="whitegrid", context="notebook")` - Set seaborn visualization theme

**Best Practice**: Always set random seeds for reproducibility (handled in model definitions).

---

### Cell 3: Step 1 - Load Data

**Purpose**: Load the preprocessed interim dataset into a pandas DataFrame.

**Data Path**: `../../data/interim/merged_dataset.csv`

**Code**:

```python
DATA_PATH = "../../data/interim/merged_dataset.csv"
df = pd.read_csv(DATA_PATH)
```

**Expected Data Structure**:

- Merged dataset from NDHS survey and Manggahan clinic data
- Contains demographic, behavioral, and contraceptive usage information
- Mixed data types (numeric codes, string labels, categorical values)

**Data Quality Checks** (Recommended):

- Verify dataset shape
- Check for completely empty columns
- Verify expected key columns exist

---

### Cell 4: Step 2 - Standardize Mixed Code/Label Columns

**Purpose**: Define mapping dictionaries to convert mixed string/numeric values to consistent numeric codes.

**Why This Step is Critical**:
Many columns in healthcare datasets contain a mix of:

- Numeric codes (e.g., "1", "2", "3")
- Text labels (e.g., "Primary", "College")
- Inconsistent capitalization or formatting

This standardization ensures:

1. Consistent data types for modeling
2. Proper numeric encoding for categorical variables
3. Handling of legacy data inconsistencies

**Mapping Dictionaries Defined**:

1. **`educ_level_map`** - Education level standardization
   ```python
   educ_level_map = {
       "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
       "Primary": 1, "Elementary": 1,
       "Secondary": 3,
       "College": 5, "University": 5
   }
   ```
   Maps both numeric codes and text labels to consistent education levels.

**Note**: The full mappings for other variables (household head sex, current use type, pattern use, etc.) should be defined but are abbreviated in the display as `# ... (other mapping dictionaries) ...`

**Additional Mappings** (to be completed in cell):

- `household_head_sex_map` - Gender of household head
- `current_use_type_map` - Type of contraceptive user
- `pattern_use_map` - Contraceptive usage pattern
- `contraceptive_use_intention_map` - Usage and future intentions
- `want_last_child_map` - Desire for last child
- `want_last_pregnancy_map` - Intention for last pregnancy
- `told_side_effects_map` - Whether counseled about side effects
- `smoke_cigar_map` - Smoking behavior
- `residing_with_partner_map` - Living arrangement

**Customization Required**: These mappings must be adjusted based on the actual coding scheme in your dataset.

---

### Cell 5: Step 3 - Apply Mappings (Implied from Step 4)

**Note**: Step 3 appears to be integrated into Step 4. The mapping application logic would typically:

```python
def map_column(col, mapping):
    return col.replace(mapping)

mixed_mappings = {
    "EDUC_LEVEL": educ_level_map,
    "HOUSEHOLD_HEAD_SEX": household_head_sex_map,
    "CURRENT_USE_TYPE": current_use_type_map,
    # ... other mappings
}

df_std = df.copy()

for col, mapping in mixed_mappings.items():
    if col in df_std.columns:
        df_std[col] = map_column(df_std[col].astype(str), mapping)
        df_std[col] = pd.to_numeric(df_std[col], errors="coerce")
```

---

### Cell 5: Step 4 - Target Selection

**Purpose**: Define the prediction target and remove rows with missing target values.

**Code**:

```python
TARGET = "CONTRACEPTIVE_USE_AND_INTENTION"
df_model = df_std.dropna(subset=[TARGET]).copy()
print("Shape after dropping rows with missing target:", df_model.shape)
```

**Target Variable Options**:

1. `CONTRACEPTIVE_USE_AND_INTENTION` - Primary target (4 classes)
   - Class 1: Using and intends to continue
   - Class 2: Using but intends to stop
   - Class 3: Not using but intends to use
   - Class 4: Not using and no intention
2. `CONTRACEPTIVE_METHOD` - Specific method used
3. `CURRENT_USE_TYPE` - Binary or multi-class usage status

**Data Cleaning Strategy**:

- **Approach**: Drop rows with missing target (complete case analysis)
- **Alternative Approaches**:
  - Impute missing targets (not recommended for classification)
  - Separate model for predicting missingness

**Impact Assessment**:

- Always check the percentage of data removed
- Verify class balance is maintained
- Consider if missingness is random or systematic

---

### Cell 6: Step 5 - Identify Column Types

**Purpose**: Categorize features into numeric and categorical types for appropriate preprocessing.

**Numeric Features** (17 features):

```python
numeric_features = [
    "AGE", "AGE_GRP", "REGION", "RELIGION", "ETHNICITY", "EDUC",
    "HOUSEHOLD_HEAD_SEX", "PARITY", "CONTRACEPTIVE_METHOD",
    "CURRENT_USE_TYPE", "PATTERN_USE", "CONTRACEPTIVE_USE_AND_INTENTION",
    "WANT_LAST_PREGNANCY", "SMOKE_CIGAR", "MARITAL_STATUS",
    "DESIRE_FOR_MORE_CHILDREN", "OCCUPATION"
]
```

**Categorical Features** (12 features):

```python
categorical_features = [
    "CASEID", "LAST_SOURCE_TYPE", "MONTH_USE_CURRENT_METHOD",
    "LAST_METHOD_DISCONTINUED", "REASON_DISCONTINUED",
    "INTENTION_USE", "TOLD_ABT_SIDE_EFFECTS", "RESIDING_WITH_PARTNER",
    "HSBND_DESIRE_FOR_MORE_CHILDREN", "HUSBANDS_EDUC", "HUSBAND_AGE",
    "PARTNER_EDUC"
]
```

**Feature Type Rationale**:

| Feature          | Type        | Rationale                            |
| ---------------- | ----------- | ------------------------------------ |
| AGE              | Numeric     | Continuous variable                  |
| REGION           | Numeric     | Ordinal geographic codes             |
| CASEID           | Categorical | Unique identifier (high cardinality) |
| LAST_SOURCE_TYPE | Categorical | Nominal clinic/facility type         |
| HUSBAND_AGE      | Categorical | May contain text ranges or codes     |

**Validation**:

- Filter to only include features actually present in dataset
- Prevents errors from missing columns

---

### Cell 7: Step 6 - Mode Imputation

**Purpose**: Fill missing values in key columns with the most frequent value (mode).

**Code**:

```python
def fill_mode(col):
    mode_val = col.mode(dropna=True)
    if len(mode_val) == 0:
        return col
    return col.fillna(mode_val.iloc[0])

for col in ["CASEID", "LAST_SOURCE_TYPE", "INTENTION_USE", "TOLD_ABT_SIDE_EFFECTS",
            "LAST_METHOD_DISCONTINUED", "CONTRACEPTIVE_METHOD", "AGE_GRP"]:
    if col in df_model.columns:
        df_model[col] = fill_mode(df_model[col])
```

**Imputation Strategy**:

- **Method**: Mode imputation (most frequent value)
- **Scope**: Selective - only key columns with strategic importance
- **Timing**: Before pipeline creation (upfront imputation)

**Columns Imputed** (7 columns):

1. `CASEID` - Case identifier
2. `LAST_SOURCE_TYPE` - Last contraceptive source
3. `INTENTION_USE` - Future usage intention
4. `TOLD_ABT_SIDE_EFFECTS` - Counseling received
5. `LAST_METHOD_DISCONTINUED` - Previously discontinued method
6. `CONTRACEPTIVE_METHOD` - Current method
7. `AGE_GRP` - Age group category

**Why Mode Imputation?**:

- Preserves distribution for categorical variables
- Doesn't introduce artificial values
- Simple and interpretable
- Appropriate for MCAR (Missing Completely At Random) data

**Verification**:

- Display missing value counts after imputation
- Ensures imputation was successful

**Limitations**:

- Reduces variability
- May underestimate uncertainty
- Assumes missingness is random

---

### Cell 8: Step 7 - Rare Category Handling

**Purpose**: Group infrequent categories into "Other" to reduce model complexity and improve generalization.

**Code**:

```python
def group_rare_categories(series, min_freq=0.02):
    freqs = series.value_counts(normalize=True)
    rare_cats = freqs[freqs < min_freq].index
    return series.where(~series.isin(rare_cats), other="Other")

high_cardinality_cols = [
    "CASEID", "MONTH_USE_CURRENT_METHOD", "REASON_DISCONTINUED",
    "HUSBAND_AGE", "OCCUPATION"
]

for col in high_cardinality_cols:
    if col in df_model.columns:
        df_model[col] = group_rare_categories(df_model[col].astype(str), min_freq=0.02)
```

**Configuration**:

- **Threshold**: `min_freq=0.02` (2% of dataset)
- Categories appearing in <2% of records are grouped as "Other"

**High Cardinality Columns** (5 columns):

1. `CASEID` - Individual case identifiers (potentially thousands of unique values)
2. `MONTH_USE_CURRENT_METHOD` - Month started current method (12+ values)
3. `REASON_DISCONTINUED` - Reason for stopping method (many possible reasons)
4. `HUSBAND_AGE` - Partner age (many unique values if stored as years)
5. `OCCUPATION` - Job type (many occupational categories)

**Benefits**:

1. **Reduces Overfitting**: Prevents model from learning noise from rare categories
2. **Improves Generalization**: Model learns broader patterns
3. **Reduces Feature Space**: Fewer one-hot encoded columns
4. **Handles Test Set**: Reduces chance of unseen categories in production

**Trade-offs**:

- May lose granular information
- 2% threshold is configurable (adjust based on dataset size)
- Very large datasets may use lower threshold (e.g., 0.5%)

**Verification**:

- Display updated dataframe to confirm grouping
- Check category distributions

---

### Cell 9: Step 8 - Drop Highly Correlated Features

**Purpose**: Remove features that are highly correlated with each other or the target to prevent multicollinearity and data leakage.

**Code**:

```python
# Example: drop AGE_GRP if both AGE and AGE_GRP present
if "AGE" in df_model.columns and "AGE_GRP" in df_model.columns:
    df_model = df_model.drop(columns=["AGE_GRP"])

# If target is CONTRACEPTIVE_USE_AND_INTENTION, remove highly correlated CURRENT_USE_TYPE
if TARGET == "CONTRACEPTIVE_USE_AND_INTENTION" and "CURRENT_USE_TYPE" in df_model.columns:
    df_model = df_model.drop(columns=["CURRENT_USE_TYPE"])
```

**Features Removed**:

1. **AGE_GRP** - Dropped when AGE exists
   - **Reason**: AGE_GRP is derived from AGE (binned age groups)
   - **Correlation**: Perfect correlation - one is a transformation of the other
   - **Risk**: Redundant information, no added value
2. **CURRENT_USE_TYPE** - Dropped when target is CONTRACEPTIVE_USE_AND_INTENTION
   - **Reason**: High overlap with target variable
   - **Correlation**: Current use type is component of use & intention
   - **Risk**: Data leakage - target information in features

**Why Remove Correlated Features?**

1. **Multicollinearity Issues**:
   - Unstable coefficient estimates
   - Difficult to interpret feature importance
   - Increased variance in predictions

2. **Data Leakage Prevention**:
   - Features that contain target information
   - Would inflate performance metrics artificially
   - Model won't generalize to new data

3. **Model Efficiency**:
   - Reduces feature space
   - Faster training
   - Simpler model interpretation

**Best Practice**:

- Perform correlation analysis (Pearson, Spearman)
- Use Variance Inflation Factor (VIF) for multicollinearity detection
- Domain knowledge to identify redundant features

**Dynamic Removal**:

- Feature removal is conditional based on:
  - Which features exist in the dataset
  - Which target variable is selected

---

### Cell 10: Step 9 - Reconfirm Features

**Purpose**: Update feature lists after dropping correlated features and removing the target variable.

**Code**:

```python
numeric_features = [c for c in numeric_features if c in df_model.columns and c != TARGET]
categorical_features = [c for c in categorical_features if c in df_model.columns and c != TARGET]

print("Final numeric features:", numeric_features)
print("Final categorical features:", categorical_features)
```

**Operations**:

1. Filter numeric features to:
   - Only include columns still in dataset (after drops)
   - Exclude target variable
2. Filter categorical features to:
   - Only include columns still in dataset (after drops)
   - Exclude target variable

3. Display final feature lists for verification

**Why This Step is Important**:

- **Data Integrity**: Ensures X (features) and y (target) are properly separated
- **Error Prevention**: Avoids trying to transform non-existent columns
- **Documentation**: Creates clear record of final feature set
- **Debugging**: Easy to verify what features are used in modeling

**Expected Output**:

```
Final numeric features: ['AGE', 'REGION', 'RELIGION', 'ETHNICITY', ...]
Final categorical features: ['CASEID', 'LAST_SOURCE_TYPE', ...]
```

**Validation Checklist**:

- [ ] Target variable not in feature lists
- [ ] All features in lists exist in dataframe
- [ ] No duplicate features across numeric/categorical lists
- [ ] Feature count matches expectations

---

### Cell 11: Step 10 - Define Preprocessing Transformers

**Purpose**: Create scikit-learn transformers for numeric and categorical feature preprocessing.

**Code**:

```python
numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median"))
    # no scaler needed for tree-based models
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer(
    transformers=[
        ("num", numeric_transformer, numeric_features),
        ("cat", categorical_transformer, categorical_features),
    ]
)
```

**Numeric Transformer**:

- **Step 1**: `SimpleImputer(strategy="median")`
  - Fills remaining missing values with column median
  - Median is robust to outliers
  - Appropriate for numeric features with skewed distributions
- **Note**: No scaling applied
  - Tree-based models (XGBoost, Decision Tree) are scale-invariant
  - Scaling would be added for models like Logistic Regression or SVM

**Categorical Transformer**:

- **Step 1**: `SimpleImputer(strategy="most_frequent")`
  - Fills remaining missing categorical values with mode
  - Handles any missing values not addressed in Step 6
- **Step 2**: `OneHotEncoder(handle_unknown="ignore")`
  - Converts categorical variables to binary dummy variables
  - `handle_unknown="ignore"` creates zero vector for unseen categories
  - Prevents errors in production with new category values

**ColumnTransformer**:

- Applies different transformations to different column types
- Maintains column organization
- Named transformers:
  - `"num"` - numeric pipeline
  - `"cat"` - categorical pipeline

**Pipeline Benefits**:

1. **Reproducibility**: Same transformations in training and production
2. **Prevents Leakage**: Transformations fit only on training data
3. **Simplicity**: Single object for all preprocessing
4. **Serialization**: Can save/load entire preprocessing pipeline

**Extension Points**:

- Add `StandardScaler` or `MinMaxScaler` for linear models
- Add `OrdinalEncoder` for ordinal categorical features
- Add custom transformers for domain-specific preprocessing

---

### Cell 12: Step 11 - Train-Test Split with Stratification

**Purpose**: Split data into training and testing sets while maintaining class distribution.

**Code**:

```python
X = df_model.drop(columns=[TARGET])
y = df_model[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Train shape:", X_train.shape)
print("Test shape:", X_test.shape)
print("Train target distribution:")
display(y_train.value_counts(normalize=True) * 100)
```

**Configuration**:

- **Test Size**: 20% (0.2) of data
- **Train Size**: 80% (0.8) of data
- **Random State**: 42 (ensures reproducibility)
- **Stratification**: Maintains class proportions in both sets

**Data Separation**:

- `X` (Features): All columns except target
- `y` (Target): Only the target column

**Why Stratification?**:
Ensures balanced class distribution in train/test splits:

- Critical for imbalanced datasets
- Prevents test set bias
- Ensures representative evaluation
- Maintains statistical power for minority classes

**Example Output**:

```
Train shape: (3200, 28)
Test shape: (800, 28)
Train target distribution:
1    40.2%
2    15.5%
3    25.1%
4    19.2%
```

**Verification Steps**:

1. Check train/test shapes match expected 80/20 split
2. Verify target distribution is similar in train/test
3. Confirm no data leakage between sets
4. Check for sufficient samples in each class

**Alternative Strategies**:

- **K-Fold Cross-Validation**: For smaller datasets
- **Time-Series Split**: For temporal data
- **Stratified K-Fold**: Combines stratification with CV

---

### Cell 13: Step 12 - XGBoost Pipeline

**Purpose**: Create and configure XGBoost classifier pipeline.

**Code**:

```python
xgb_clf = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softprob",
    tree_method="hist",
    eval_metric="mlogloss",
    random_state=42
)

xgb_pipeline = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("model", xgb_clf)
])
```

**XGBoost Hyperparameters**:

| Parameter          | Value          | Purpose                                                   |
| ------------------ | -------------- | --------------------------------------------------------- |
| `n_estimators`     | 300            | Number of boosting rounds (trees)                         |
| `max_depth`        | 5              | Maximum tree depth (prevents overfitting)                 |
| `learning_rate`    | 0.05           | Step size shrinkage (lower = more conservative)           |
| `subsample`        | 0.8            | Fraction of samples for each tree (prevents overfitting)  |
| `colsample_bytree` | 0.8            | Fraction of features for each tree (prevents overfitting) |
| `objective`        | multi:softprob | Multi-class classification with probabilities             |
| `tree_method`      | hist           | Fast histogram-based algorithm                            |
| `eval_metric`      | mlogloss       | Multi-class log loss evaluation                           |
| `random_state`     | 42             | Reproducibility seed                                      |

**Hyperparameter Rationale**:

1. **n_estimators=300**:
   - Moderate number of trees
   - Balance between performance and training time
   - Can be increased with early stopping

2. **max_depth=5**:
   - Shallow trees prevent overfitting
   - Appropriate for tabular data
   - Deeper trees (6-10) if more complex patterns exist

3. **learning_rate=0.05**:
   - Low learning rate for stable convergence
   - Compensated by more estimators
   - Reduces overfitting risk

4. **subsample=0.8, colsample_bytree=0.8**:
   - Stochastic gradient boosting
   - Adds randomness to prevent overfitting
   - Similar to Random Forest's random sampling

5. **objective="multi:softprob"**:
   - Multi-class classification (4 classes)
   - Returns class probabilities
   - Enables threshold tuning and calibration

**Pipeline Integration**:

- Combines preprocessing and model into single pipeline
- Ensures preprocessing applied consistently
- Simplifies model deployment

**Training & Evaluation** (Commented Out):

```python
# xgb_pipeline.fit(X_train, y_train)
# y_pred_xgb = xgb_pipeline.predict(X_test)
# print("=== XGBoost performance ===")
# print(classification_report(y_test, y_pred_xgb))
```

**Note**: Training code is commented out. Uncomment to train and evaluate.

**Tuning Recommendations**:

- Use GridSearchCV or RandomizedSearchCV for hyperparameter optimization
- Add early stopping with `early_stopping_rounds`
- Monitor validation performance with `eval_set`

---

### Cell 14: Step 13 - Decision Tree Pipeline

**Purpose**: Create and configure Decision Tree classifier pipeline.

**Code**:

```python
dt_clf = DecisionTreeClassifier(
    max_depth=5,
    min_samples_leaf=50,
    random_state=42,
    class_weight="balanced"
)

dt_pipeline = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("model", dt_clf)
])
```

**Decision Tree Hyperparameters**:

| Parameter          | Value      | Purpose                                   |
| ------------------ | ---------- | ----------------------------------------- |
| `max_depth`        | 5          | Maximum tree depth (prevents overfitting) |
| `min_samples_leaf` | 50         | Minimum samples required in leaf nodes    |
| `random_state`     | 42         | Reproducibility seed                      |
| `class_weight`     | "balanced" | Handles class imbalance                   |

**Hyperparameter Rationale**:

1. **max_depth=5**:
   - Matches XGBoost depth for consistency
   - Prevents overfitting
   - Creates interpretable tree structure
   - Deep enough to capture interactions

2. **min_samples_leaf=50**:
   - Prevents tiny leaf nodes
   - Improves generalization
   - Reduces overfitting to noise
   - Ensures statistical significance

3. **class_weight="balanced"**:
   - Automatically adjusts weights inversely proportional to class frequencies
   - Formula: `n_samples / (n_classes * np.bincount(y))`
   - Helps model focus on minority classes
   - Critical for imbalanced datasets

**Decision Tree Advantages**:

- **Interpretability**: Easy to visualize and explain
- **Fast Prediction**: O(log n) time complexity
- **No Feature Scaling Needed**: Handles mixed features naturally
- **Feature Interaction**: Automatically captures interactions
- **Non-Linear**: Can model complex non-linear relationships

**Decision Tree Limitations**:

- **Overfitting**: Single trees prone to overfitting
- **Instability**: Small data changes can change tree structure
- **Bias**: Can create biased trees if classes are imbalanced
- **Less Accurate**: Generally less accurate than ensemble methods

**Why Include in Hybrid?**:

- Complements XGBoost with different decision boundaries
- Provides diverse predictions for ensemble
- Fast predictions for low-confidence XGBoost cases

**Training & Evaluation** (Commented Out):

```python
# dt_pipeline.fit(X_train, y_train)
# y_pred_dt = dt_pipeline.predict(X_test)
# print("=== Decision Tree performance ===")
# print(classification_report(y_test, y_pred_dt))
```

**Tuning Recommendations**:

- Adjust `min_samples_leaf` based on dataset size
- Consider `min_samples_split` for additional regularization
- Experiment with `max_features` for randomization
- Use `ccp_alpha` for cost-complexity pruning

---

### Cell 15: Step 14 - Hybrid Ensemble Creation

**Purpose**: Create a hybrid ensemble that combines XGBoost and Decision Tree predictions based on confidence thresholds.

**Code**:

```python
# Step 14: Simple hybrid combiner

# Make sure we can handle non-numeric labels consistently
# le = LabelEncoder()
# y_train_enc = le.fit_transform(y_train)
# y_test_enc = le.transform(y_test)

# Refit XGBoost with encoded labels
xgb_clf_hybrid = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softprob",
    tree_method="hist",
    eval_metric="mlogloss",
    random_state=42
)

xgb_pipeline_hybrid = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("model", xgb_clf_hybrid)
])

dt_clf_hybrid = DecisionTreeClassifier(
    max_depth=5,
    min_samples_leaf=50,
    random_state=42,
    class_weight="balanced"
)

dt_pipeline_hybrid = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("model", dt_clf_hybrid)
])

# Hybrid logic (commented out):
# proba_xgb = xgb_pipeline_hybrid.predict_proba(X_test)
# pred_xgb_enc = proba_xgb.argmax(axis=1)
# conf_xgb = proba_xgb.max(axis=1)
# pred_dt_enc = dt_pipeline_hybrid.predict(X_test)
# CONF_THRESHOLD = 0.6
# hybrid_pred_enc = np.where(conf_xgb < CONF_THRESHOLD, pred_dt_enc, pred_xgb_enc)
# hybrid_pred = le.inverse_transform(hybrid_pred_enc)
```

**Hybrid Ensemble Strategy**:

**Concept**: Confidence-based model switching

- Use XGBoost predictions when confidence is high (≥60%)
- Use Decision Tree predictions when XGBoost confidence is low (<60%)

**Implementation Steps**:

1. **Label Encoding** (for numeric handling):

   ```python
   le = LabelEncoder()
   y_train_enc = le.fit_transform(y_train)
   y_test_enc = le.transform(y_test)
   ```

   - Converts target labels to 0, 1, 2, 3
   - Ensures consistent numeric encoding
   - Can be inverted to original labels

2. **Train Both Models**:
   - XGBoost pipeline with encoded labels
   - Decision Tree pipeline with encoded labels

3. **Get XGBoost Confidence**:

   ```python
   proba_xgb = xgb_pipeline_hybrid.predict_proba(X_test)
   conf_xgb = proba_xgb.max(axis=1)
   ```

   - `proba_xgb`: Probability for each class (4 columns)
   - `conf_xgb`: Maximum probability (confidence score)

4. **Hybrid Prediction Logic**:

   ```python
   CONF_THRESHOLD = 0.6
   hybrid_pred_enc = np.where(conf_xgb < CONF_THRESHOLD, pred_dt_enc, pred_xgb_enc)
   ```

   - If XGBoost confidence < 60%: Use Decision Tree
   - If XGBoost confidence ≥ 60%: Use XGBoost
   - Creates "best of both" prediction

5. **Decode Predictions**:
   ```python
   hybrid_pred = le.inverse_transform(hybrid_pred_enc)
   ```

   - Converts numeric predictions back to original labels

**Hybrid Rationale**:

| Scenario                       | Model Used    | Reasoning                                   |
| ------------------------------ | ------------- | ------------------------------------------- |
| High XGBoost confidence (≥60%) | XGBoost       | Trust the more powerful ensemble model      |
| Low XGBoost confidence (<60%)  | Decision Tree | Use interpretable model for uncertain cases |

**Benefits**:

1. **Best of Both Worlds**: Combines accuracy of XGBoost with reliability of Decision Tree
2. **Handles Uncertainty**: Different model for low-confidence regions
3. **Interpretability**: Can explain Decision Tree predictions for uncertain cases
4. **Confidence Calibration**: Threshold can be tuned based on validation performance

**Tuning the Hybrid**:

- **Threshold Selection**: 0.6 is arbitrary
  - Lower threshold (0.5): More XGBoost, less Decision Tree
  - Higher threshold (0.7): More Decision Tree, less XGBoost
  - Optimize using validation set
- **Alternative Strategies**:
  - Weighted average of predictions
  - Stacking with meta-learner
  - Voting classifier (soft or hard voting)

**Current Status**:

- Pipelines are defined but not trained (training code commented out)
- Ready for training when uncommented

---

### Cell 16: Final - Save Pipelines

**Purpose**: Serialize all preprocessing and model pipelines to disk for future use.

**Code**:

```python
import joblib

joblib.dump(preprocessor, "preprocessor.joblib")
joblib.dump(xgb_pipeline, "xgb_pipeline.joblib")
joblib.dump(dt_pipeline, "dt_pipeline.joblib")
joblib.dump(xgb_pipeline_hybrid, "xgb_pipeline_hybrid.joblib")
joblib.dump(dt_pipeline_hybrid, "dt_pipeline_hybrid.joblib")
```

**Saved Artifacts**:

| File                         | Object            | Contents                                      |
| ---------------------------- | ----------------- | --------------------------------------------- |
| `preprocessor.joblib`        | ColumnTransformer | Numeric & categorical preprocessing pipelines |
| `xgb_pipeline.joblib`        | Pipeline          | Preprocessing + XGBoost model                 |
| `dt_pipeline.joblib`         | Pipeline          | Preprocessing + Decision Tree model           |
| `xgb_pipeline_hybrid.joblib` | Pipeline          | Preprocessing + XGBoost (for hybrid)          |
| `dt_pipeline_hybrid.joblib`  | Pipeline          | Preprocessing + Decision Tree (for hybrid)    |

**Serialization Library**:

- **joblib**: Optimized for NumPy arrays and scikit-learn objects
- More efficient than pickle for large arrays
- Industry standard for ML model persistence

**Usage in Production**:

```python
# Load saved pipeline
loaded_pipeline = joblib.load("xgb_pipeline.joblib")

# Make predictions on new data
predictions = loaded_pipeline.predict(new_data)
probabilities = loaded_pipeline.predict_proba(new_data)
```

**Best Practices for Model Persistence**:

1. **File Organization**:
   - Move to `outputs/models/` directory (as per PROJECT_STRUCTURE.md)
   - Use descriptive names with version/date
   - Example: `xgb_pipeline_v1_2026-01-18.joblib`

2. **Version Control**:
   - Track model versions
   - Record hyperparameters and performance metrics
   - Link to training data version

3. **Metadata Storage**:
   - Save alongside model:
     - Training date
     - Feature names
     - Class names
     - Performance metrics
     - Preprocessing steps

4. **Security**:
   - Validate model integrity before loading
   - Use trusted sources only
   - Consider model signing/encryption

**Current Save Location**:

- Files saved to current working directory (notebook location)
- **Should be moved to**: `../../outputs/models/`

**Loading Example**:

```python
# Load individual components
preprocessor = joblib.load("preprocessor.joblib")
xgb_model = joblib.load("xgb_pipeline.joblib")

# Use for inference
X_new = pd.DataFrame(...)  # New data
predictions = xgb_model.predict(X_new)
```

**File Size Considerations**:

- Pipelines with OneHotEncoder can be large (many dummy variables)
- XGBoost models size depends on n_estimators and max_depth
- Compress if needed: `joblib.dump(obj, file, compress=3)`

---

## Key Components

### 1. Feature Engineering Pipeline

**Numeric Features Processing**:

- Median imputation for missing values
- No scaling (tree-based models)
- Preserved original distributions

**Categorical Features Processing**:

- Mode imputation for missing values
- One-hot encoding for nominal categories
- Rare category grouping (2% threshold)
- Unknown category handling

### 2. Model Architectures

**XGBoost Classifier**:

- Gradient boosting ensemble
- 300 trees, depth 5
- Learning rate: 0.05
- Stochastic boosting (80% sampling)

**Decision Tree Classifier**:

- Single tree with depth limit
- Class balancing for imbalanced data
- Minimum 50 samples per leaf
- Interpretable decision rules

**Hybrid Ensemble**:

- Confidence-based model switching
- XGBoost for high confidence (≥60%)
- Decision Tree for low confidence (<60%)
- Combines strengths of both models

### 3. Data Quality Controls

**Missing Data Handling**:

- Target: Removed rows with missing target
- Key features: Mode imputation upfront
- Other features: Pipeline imputation

**Multicollinearity Management**:

- Removed AGE_GRP (correlated with AGE)
- Removed CURRENT_USE_TYPE (leakage with target)
- Maintained feature independence

**Rare Category Management**:

- Grouped categories <2% frequency
- Reduced overfitting risk
- Improved generalization

---

## Data Flow

```
Raw Merged Dataset (CSV)
    ↓
[Step 1] Load Data
    ↓
[Step 2-3] Standardize Mixed Columns
    ↓
[Step 4] Target Selection & Filtering
    ↓
[Step 5] Feature Type Identification
    ↓
[Step 6] Mode Imputation (Key Columns)
    ↓
[Step 7] Rare Category Handling
    ↓
[Step 8] Drop Correlated Features
    ↓
[Step 9] Final Feature Confirmation
    ↓
[Step 10] Create Preprocessing Pipelines
    ↓
[Step 11] Train-Test Split (80/20 Stratified)
    ↓
[Step 12-14] Model Pipeline Creation
    ↓
[Step 16] Save Pipelines to Disk
    ↓
Saved Model Artifacts (.joblib files)
```

---

## Output Artifacts

### Model Files

All files saved to current directory (should be in `outputs/models/`):

1. **preprocessor.joblib** (80-200 KB typical)
   - ColumnTransformer with fitted parameters
   - Feature names and transformations
   - Imputation values (medians, modes)
   - OneHotEncoder categories

2. **xgb_pipeline.joblib** (500 KB - 5 MB typical)
   - Complete preprocessing + XGBoost pipeline
   - Ready for inference
   - Includes all 300 trees

3. **dt_pipeline.joblib** (50-200 KB typical)
   - Complete preprocessing + Decision Tree pipeline
   - Tree structure and split points
   - Smaller file size than XGBoost

4. **xgb_pipeline_hybrid.joblib** (500 KB - 5 MB typical)
   - XGBoost component for hybrid ensemble

5. **dt_pipeline_hybrid.joblib** (50-200 KB typical)
   - Decision Tree component for hybrid ensemble

### Usage Pattern

**Single Model Inference**:

```python
import joblib
import pandas as pd

# Load pipeline
xgb_model = joblib.load("outputs/models/xgb_pipeline.joblib")

# New patient data
new_data = pd.DataFrame({
    "AGE": [28],
    "REGION": [1],
    "EDUC": [3],
    # ... other features
})

# Predict
prediction = xgb_model.predict(new_data)
probabilities = xgb_model.predict_proba(new_data)

print(f"Predicted class: {prediction[0]}")
print(f"Class probabilities: {probabilities[0]}")
```

**Hybrid Ensemble Inference**:

```python
# Load both models
xgb_hybrid = joblib.load("outputs/models/xgb_pipeline_hybrid.joblib")
dt_hybrid = joblib.load("outputs/models/dt_pipeline_hybrid.joblib")

# Get XGBoost predictions and confidence
proba_xgb = xgb_hybrid.predict_proba(new_data)
conf_xgb = proba_xgb.max(axis=1)
pred_xgb = proba_xgb.argmax(axis=1)

# Get Decision Tree predictions
pred_dt = dt_hybrid.predict(new_data)

# Hybrid logic
CONF_THRESHOLD = 0.6
hybrid_pred = np.where(conf_xgb < CONF_THRESHOLD, pred_dt, pred_xgb)

# Convert to labels if needed
# hybrid_label = label_encoder.inverse_transform(hybrid_pred)
```

---

## Configuration Parameters

### Modifiable Parameters

**Data Loading**:

```python
DATA_PATH = "../../data/interim/merged_dataset.csv"  # Change data source
```

**Target Selection**:

```python
TARGET = "CONTRACEPTIVE_USE_AND_INTENTION"  # Options:
# - "CONTRACEPTIVE_USE_AND_INTENTION" (4 classes)
# - "CONTRACEPTIVE_METHOD" (multiple methods)
# - "CURRENT_USE_TYPE" (user type)
```

**Rare Category Threshold**:

```python
min_freq = 0.02  # Change to 0.01 for 1%, 0.05 for 5%
```

**Train-Test Split**:

```python
test_size = 0.2  # Change to 0.3 for 70/30 split
random_state = 42  # Change for different random split
```

**XGBoost Hyperparameters**:

```python
n_estimators = 300      # Number of trees (100-1000)
max_depth = 5           # Tree depth (3-10)
learning_rate = 0.05    # Learning rate (0.01-0.3)
subsample = 0.8         # Row sampling (0.5-1.0)
colsample_bytree = 0.8  # Column sampling (0.5-1.0)
```

**Decision Tree Hyperparameters**:

```python
max_depth = 5              # Tree depth (3-10)
min_samples_leaf = 50      # Min leaf samples (10-100)
class_weight = "balanced"  # "balanced" or None
```

**Hybrid Threshold**:

```python
CONF_THRESHOLD = 0.6  # Confidence threshold (0.5-0.9)
```

---

## Best Practices

### 1. Data Preparation

✅ **Do**:

- Always check data quality before preprocessing
- Verify target variable distribution
- Document mapping dictionaries
- Validate feature types match actual data
- Monitor missing value percentages

❌ **Don't**:

- Skip exploratory data analysis
- Assume data types without verification
- Ignore class imbalance
- Delete features without understanding impact
- Mix up numeric codes and categorical labels

### 2. Feature Engineering

✅ **Do**:

- Standardize mixed columns before modeling
- Handle missing values systematically
- Group rare categories to reduce complexity
- Remove highly correlated features
- Validate final feature lists

❌ **Don't**:

- Include target variable in features
- Use test data for imputation parameters
- Create too many one-hot encoded columns
- Ignore multicollinearity
- Transform features without documentation

### 3. Model Development

✅ **Do**:

- Use pipelines for reproducibility
- Set random seeds for consistency
- Stratify train-test splits
- Validate models on hold-out test set
- Save models with metadata

❌ **Don't**:

- Train on entire dataset without test set
- Optimize hyperparameters on test set
- Ignore class imbalance
- Deploy models without validation
- Overfit to training data

### 4. Code Organization

✅ **Do**:

- Follow project structure guidelines
- Document each preprocessing step
- Use clear variable names
- Comment complex logic
- Version control all code

❌ **Don't**:

- Mix exploration and production code
- Hard-code file paths
- Leave debugging code uncommented
- Create circular dependencies
- Skip error handling

---

## Troubleshooting

### Common Issues

**Issue 1: KeyError when accessing columns**

```
KeyError: 'COLUMN_NAME'
```

**Solution**:

- Verify column exists in dataframe: `print(df.columns.tolist())`
- Check spelling and case sensitivity
- Ensure data loaded correctly
- Verify data source file

**Issue 2: Missing values after imputation**

```
ValueError: Input contains NaN
```

**Solution**:

- Check if all features included in transformers
- Verify imputation strategies cover all features
- Add features to numeric_features or categorical_features lists
- Review fill_mode() function execution

**Issue 3: Target variable in feature set**

```
Data leakage warning or perfect accuracy
```

**Solution**:

- Verify Step 9 executed correctly
- Check: `print(TARGET in numeric_features)` should be False
- Check: `print(TARGET in categorical_features)` should be False
- Rerun feature confirmation step

**Issue 4: Class imbalance warnings**

```
Warning: Target class distribution heavily skewed
```

**Solution**:

- Check target distribution: `y_train.value_counts()`
- Verify stratified split worked: Compare train/test distributions
- Consider SMOTE or other balancing techniques
- Adjust class_weight parameters

**Issue 5: OneHotEncoder unknown category errors**

```
ValueError: Found unknown categories
```

**Solution**:

- Verify `handle_unknown="ignore"` in OneHotEncoder
- Check if rare category grouping was applied
- Ensure same categories in train and test

**Issue 6: Model file size too large**

```
File size exceeds reasonable limits
```

**Solution**:

- Reduce n_estimators in XGBoost
- Reduce max_depth in trees
- Use compression: `joblib.dump(obj, file, compress=3)`
- Consider model pruning

**Issue 7: Slow training performance**

```
Training takes excessive time
```

**Solution**:

- Reduce n_estimators (e.g., 100 instead of 300)
- Use tree_method="hist" in XGBoost (already set)
- Reduce colsample_bytree and subsample
- Consider parallel processing
- Check dataset size and feature count

**Issue 8: Poor hybrid ensemble performance**

```
Hybrid model worse than individual models
```

**Solution**:

- Tune CONF_THRESHOLD (try 0.5, 0.7, 0.8)
- Verify both models trained correctly
- Check if models are too similar
- Consider different ensemble strategy (voting, stacking)
- Validate on separate validation set

---

## Next Steps

### Immediate Actions

1. **Uncomment Training Code**: Enable model training in cells 13-15
2. **Execute Notebook**: Run all cells sequentially
3. **Evaluate Models**: Review classification reports
4. **Move Artifacts**: Transfer .joblib files to `outputs/models/`

### Recommended Enhancements

1. **Hyperparameter Tuning**:
   - Implement GridSearchCV or RandomizedSearchCV
   - Use cross-validation for robust estimates
   - Document optimal hyperparameters

2. **Model Evaluation**:
   - Generate confusion matrices
   - Calculate feature importance
   - Perform error analysis
   - Create ROC curves for each class

3. **Code Modularization**:
   - Extract preprocessing to `src/preprocessing/features.py`
   - Move models to `src/models/` directory
   - Create training scripts in `src/training/`
   - Build evaluation module in `src/evaluation/`

4. **Documentation**:
   - Create model cards documenting performance
   - Generate feature importance visualizations
   - Document data drift monitoring strategy

5. **Production Readiness**:
   - Add input validation
   - Implement error handling
   - Create API endpoint for predictions
   - Set up model monitoring

---

## References

### Related Files

- **PROJECT_STRUCTURE.md**: Overall project organization
- **merged_dataset.csv**: Input data source
- **requirements.txt**: Python dependencies

### Key Dependencies

- pandas >= 1.3.0
- numpy >= 1.21.0
- scikit-learn >= 1.0.0
- xgboost >= 1.5.0
- matplotlib >= 3.4.0
- seaborn >= 0.11.0
- joblib >= 1.1.0

### External Documentation

- [scikit-learn Pipeline](https://scikit-learn.org/stable/modules/compose.html)
- [XGBoost Parameters](https://xgboost.readthedocs.io/en/latest/parameter.html)
- [Pandas API Reference](https://pandas.pydata.org/docs/reference/)

---

**Document Maintainer**: ContraceptIQ Development Team  
**Last Review**: January 18, 2026  
**Version**: 1.0
