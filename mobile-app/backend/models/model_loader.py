"""
ML model loader for high-recall hybrid discontinuation risk model.
"""

import json
import joblib
from pathlib import Path
from typing import Dict, Tuple, Any


def load_hybrid_model(model_dir: str) -> Tuple[Any, Any, Dict]:
    """
    Load XGBoost, Decision Tree models and configuration.
    
    Args:
        model_dir: Path to directory containing model files
        
    Returns:
        Tuple of (xgb_model, dt_model, config)
        
    Raises:
        FileNotFoundError: If model files are missing
        ValueError: If model files are corrupted or invalid
    """
    model_path = Path(model_dir)
    
    # Define expected file paths
    xgb_path = model_path / 'xgb_high_recall.joblib'
    dt_path = model_path / 'dt_high_recall.joblib'
    config_path = model_path / 'hybrid_v3_config.json'
    
    # Validate all files exist
    missing_files = []
    if not xgb_path.exists():
        missing_files.append(str(xgb_path))
    if not dt_path.exists():
        missing_files.append(str(dt_path))
    if not config_path.exists():
        missing_files.append(str(config_path))
    
    if missing_files:
        raise FileNotFoundError(
            f"Missing model files: {', '.join(missing_files)}\n"
            f"Expected directory: {model_dir}"
        )
    
    try:
        # Load models
        print(f"Loading XGBoost model from {xgb_path}...")
        xgb_model = joblib.load(xgb_path)
        
        print(f"Loading Decision Tree model from {dt_path}...")
        dt_model = joblib.load(dt_path)
        
        print(f"Loading configuration from {config_path}...")
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        # Validate config has required keys
        required_keys = ['threshold_v3', 'conf_margin_v3']
        missing_keys = [key for key in required_keys if key not in config]
        if missing_keys:
            raise ValueError(f"Configuration missing required keys: {missing_keys}")
        
        print("✅ Models loaded successfully!")
        print(f"   - XGBoost threshold: {config['threshold_v3']}")
        print(f"   - Confidence margin: {config['conf_margin_v3']}")
        
        return xgb_model, dt_model, config
        
    except Exception as e:
        if isinstance(e, (FileNotFoundError, ValueError)):
            raise
        raise ValueError(f"Error loading model files: {str(e)}")
