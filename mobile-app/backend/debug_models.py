
import logging
import traceback
import sys
import os

# Adjust path to import config
sys.path.append(os.getcwd())

try:
    from config import MODEL_DIR
    from models.model_loader import load_hybrid_model
    
    print(f"DEBUG: Attempting to load models from: {MODEL_DIR}")
    
    xgb, dt, cfg = load_hybrid_model(MODEL_DIR)
    print("DEBUG: Success!")
    
except Exception as e:
    print("\nDEBUG: FAILED TO LOAD MODELS")
    print("-" * 50)
    print(traceback.format_exc())
    print("-" * 50)
