# ContraceptIQ Project Folder Structure Guide

This document describes the folder structure used in the development of **ContraceptIQ**, a web-based machine learning system designed to recommend contraceptive methods using a hybrid classification approach.

The structure was designed to ensure:
- Clean separation of concerns
- Reproducibility of experiments
- Collaborative development
- Alignment with academic machine learning best practices

---

## 1. Root Directory Overview

```plaintext
machine-learning/
├── data/
├── notebooks/
├── src/
├── configs/
├── outputs/
├── requirements.txt
├── main.py
├── README.md
└── PROJECT_STRUCTURE.md
```

---

## 2. `data/` — Dataset Management

```plaintext
data/
├── raw/
├── interim/
└── processed/
```

This directory represents the **data lifecycle** used in the study, from original acquisition to final model-ready datasets.

### 2.1 `data/raw/`
**Purpose:**  
Stores original datasets exactly as obtained from official sources (e.g., DHS datasets).

**Contents:**
- Raw CSV or Excel files
- No preprocessing or transformations applied

**Rules:**
- Files must not be modified
- Used only as reference input for preprocessing
- Ensures data integrity and reproducibility

---

### 2.2 `data/interim/`
**Purpose:**  
Contains partially processed datasets used for exploratory analysis and feature engineering.

**Contents:**
- Cleaned missing values
- Removed inconsistencies
- Unencoded categorical variables

**Use Case:**
- Exploratory Data Analysis (EDA)
- Feature selection experiments

---

### 2.3 `data/processed/`
**Purpose:**  
Holds finalized datasets used directly for model training and evaluation.

**Contents:**
- Encoded categorical features
- Normalized or scaled numerical features
- Train, validation, and test splits

**Important:**  
All machine learning models are trained **only** using data from this directory to prevent data leakage.

---

## 3. `notebooks/` — Analysis and Exploration

```plaintext
notebooks/
├── eda.ipynb
├── feature_analysis.ipynb
└── results_analysis.ipynb
```

Notebooks are used strictly for **analysis, visualization, and interpretation**, not for production code.

---

## 4. `src/` — Core System Implementation

```plaintext
src/
├── preprocessing/
├── models/
├── training/
├── evaluation/
└── utils/
```

---

## 4.1 `preprocessing/` — Data Preparation

```plaintext
preprocessing/
├── clean.py
├── features.py
└── split.py
```

- `clean.py` — Handles missing values, duplicates, and inconsistent entries  
- `features.py` — Performs feature encoding, scaling, and transformation  
- `split.py` — Splits data into training, validation, and testing sets

---

## 4.2 `models/` — Machine Learning Models

```plaintext
models/
├── decision_tree.py
├── xgb_model.py
└── hybrid_voting.py
```

- `decision_tree.py` — Decision Tree classifier  
- `xgb_model.py` — XGBoost classifier  
- `hybrid_voting.py` — Soft-voting ensemble combining both models

---

## 4.3 `training/` — Model Training and Optimization

```plaintext
training/
├── train_single.py
├── train_hybrid.py
└── tune.py
```

---

## 4.4 `evaluation/` — Model Evaluation

```plaintext
evaluation/
├── metrics.py
└── evaluate.py
```

---

## 4.5 `utils/` — Shared Utilities

```plaintext
utils/
├── config.py
├── logger.py
└── helpers.py
```

---

## 5. `configs/` — Experiment Configuration

```plaintext
configs/
├── data.yaml
├── model.yaml
└── training.yaml
```

---

## 6. `outputs/` — Generated Results

```plaintext
outputs/
├── models/
├── logs/
└── figures/
```

---

## 7. `main.py` — Pipeline Entry Point

The main script orchestrates the entire machine learning workflow:
- Data preprocessing
- Model training
- Model evaluation

---

## 8. Design Rationale

This structure enforces:
- Prevention of data leakage
- Modular development
- Clear task division among researchers
- Reproducible machine learning experiments

This structure directly supports the methodology presented in the ContraceptIQ thesis.
