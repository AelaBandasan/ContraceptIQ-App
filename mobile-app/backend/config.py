"""
Configuration settings for the backend API.
"""

import os
from pathlib import Path

# Base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent

# ML Models directory (relative to backend folder)
# Points to: machine-learning/src/models/models_high_risk_v3/
MODEL_DIR = os.getenv(
    'MODEL_DIR',
    str(BASE_DIR.parent.parent / 'machine-learning' / 'src' / 'models' / 'models_high_risk_v3')
)

# Flask configuration
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

# CORS configuration
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')

# API configuration
API_TIMEOUT = int(os.getenv('API_TIMEOUT', 30))
MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))

# Required input features (26 total)
REQUIRED_FEATURES = [
    # Demographic features (13)
    'AGE',
    'REGION',
    'EDUC_LEVEL',
    'RELIGION',
    'ETHNICITY',
    'MARITAL_STATUS',
    'RESIDING_WITH_PARTNER',
    'HOUSEHOLD_HEAD_SEX',
    'OCCUPATION',
    'HUSBANDS_EDUC',
    'HUSBAND_AGE',
    'PARTNER_EDUC',
    'SMOKE_CIGAR',
    # Fertility features (4)
    'PARITY',
    'DESIRE_FOR_MORE_CHILDREN',
    'WANT_LAST_CHILD',
    'WANT_LAST_PREGNANCY',
    # Method/History features (9)
    'CONTRACEPTIVE_METHOD',
    'MONTH_USE_CURRENT_METHOD',
    'PATTERN_USE',
    'TOLD_ABT_SIDE_EFFECTS',
    'LAST_SOURCE_TYPE',
    'LAST_METHOD_DISCONTINUED',
    'REASON_DISCONTINUED',
    'HSBND_DESIRE_FOR_MORE_CHILDREN',
]
