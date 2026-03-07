"""
Prediction logic for high-recall hybrid discontinuation risk model.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any


def predict_discontinuation_risk(
    X: pd.DataFrame,
    xgb_model: Any,
    dt_model: Any,
    config: Dict
) -> Dict:
    """
    Predict discontinuation risk using hybrid model.
    
    This implements the upgrade-only hybrid rule:
    1. XGBoost generates probability and base prediction
    2. If XGBoost confidence is low AND Decision Tree predicts 1, upgrade to 1
    3. Never downgrade a positive prediction
    
    Args:
        X: pandas DataFrame with 26 required features
        xgb_model: Trained XGBoost pipeline
        dt_model: Trained Decision Tree pipeline
        config: Configuration dict with threshold_v3 and conf_margin_v3
        
    Returns:
        Dictionary with keys:
            - predictions: np.ndarray of shape (n_samples,), values 0 or 1
            - xgb_probabilities: np.ndarray of shape (n_samples,), values [0, 1]
            - xgb_predictions: np.ndarray of shape (n_samples,), values 0 or 1
            - dt_predictions: np.ndarray of shape (n_samples,), values 0 or 1
            - upgrade_flags: np.ndarray of shape (n_samples,), boolean values
            
    Raises:
        ValueError: If input validation fails
    """
    # Extract configuration parameters
    THRESH_XGB = config["threshold_v3"]
    CONF_MARGIN = config["conf_margin_v3"]
    
    # Validate input
    if not isinstance(X, pd.DataFrame):
        raise ValueError("Input X must be a pandas DataFrame")
    
    if X.empty:
        raise ValueError("Input DataFrame is empty")
    
    # Get XGBoost probabilities and base prediction
    xgb_probs = xgb_model.predict_proba(X)[:, 1]
    xgb_pred = (xgb_probs >= THRESH_XGB).astype(int)
    
    # Get Decision Tree prediction
    dt_pred = dt_model.predict(X)
    
    # Apply upgrade-only hybrid rule
    hybrid_pred = xgb_pred.copy()
    
    # Identify low-confidence predictions
    # (when XGBoost probability is close to the threshold)
    low_conf_mask = np.abs(xgb_probs - THRESH_XGB) < CONF_MARGIN
    
    # Upgrade only: if low-confidence AND DT predicts 1, set hybrid to 1
    # This increases recall by trusting DT on uncertain XGB cases
    upgrade_mask = (low_conf_mask) & (dt_pred == 1)
    hybrid_pred[upgrade_mask] = 1
    
    return {
        'predictions': hybrid_pred,
        'xgb_probabilities': xgb_probs,
        'xgb_predictions': xgb_pred,
        'dt_predictions': dt_pred,
        'upgrade_flags': upgrade_mask
    }
