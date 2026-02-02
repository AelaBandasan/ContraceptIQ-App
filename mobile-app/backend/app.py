"""
Flask API server for ContraceptIQ discontinuation risk prediction.

This server provides an endpoint for predicting whether current contraceptive
users are at risk of discontinuing their method using a high-recall hybrid
ML model (XGBoost + Decision Tree).
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import traceback
from typing import Dict, Any

# Local imports
from config import (
    FLASK_HOST, FLASK_PORT, FLASK_DEBUG,
    CORS_ORIGINS, MODEL_DIR, REQUIRED_FEATURES
)
from models.model_loader import load_hybrid_model
from models.predictor import predict_discontinuation_risk
from utils.validators import validate_input_features, validate_feature_types

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}})

# Global variables for loaded models
xgb_model = None
dt_model = None
config = None
models_loaded = False


def load_models():
    """Load ML models at startup."""
    global xgb_model, dt_model, config, models_loaded
    
    try:
        print("=" * 70)
        print("LOADING ML MODELS")
        print("=" * 70)
        xgb_model, dt_model, config = load_hybrid_model(MODEL_DIR)
        models_loaded = True
        print("=" * 70)
        print("✅ SERVER READY")
        print("=" * 70)
    except Exception as e:
        print("=" * 70)
        print("❌ ERROR LOADING MODELS")
        print("=" * 70)
        print(f"Error: {str(e)}")
        print(traceback.format_exc())
        print("=" * 70)
        models_loaded = False


# Load models when app starts
load_models()


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint.
    
    Returns:
        JSON response with server status and model loading status
    """
    return jsonify({
        'status': 'healthy' if models_loaded else 'degraded',
        'models_loaded': models_loaded,
        'model_directory': MODEL_DIR,
        'message': 'Server is running' if models_loaded else 'Models not loaded'
    }), 200 if models_loaded else 503


@app.route('/api/v1/discontinuation-risk', methods=['POST'])
def assess_discontinuation_risk():
    """
    Predict discontinuation risk for a contraceptive user.
    
    Request Body (JSON):
        Dictionary with 26 required features (see REQUIRED_FEATURES in config.py)
        
    Returns:
        JSON response with:
            - risk_level: "LOW" or "HIGH"
            - confidence: float between 0 and 1
            - recommendation: string recommendation
            - xgb_probability: float between 0 and 1
            - upgraded_by_dt: boolean
            
    Error Response:
        - 400: Missing or invalid features
        - 500: Server error
        - 503: Models not loaded
    """
    # Check if models are loaded
    if not models_loaded:
        return jsonify({
            'error': 'Models not loaded',
            'message': 'ML models failed to load at startup. Check server logs.',
            'status': 503
        }), 503
    
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Request body must contain JSON data',
                'status': 400
            }), 400
        
        # Validate required features
        is_valid, missing_features = validate_input_features(data)
        
        if not is_valid:
            return jsonify({
                'error': 'Missing required features',
                'missing_features': missing_features,
                'required_features_count': len(REQUIRED_FEATURES),
                'provided_features_count': len(data.keys()),
                'status': 400
            }), 400
        
        # Validate feature types
        types_valid, type_errors = validate_feature_types(data)
        
        if not types_valid:
            return jsonify({
                'error': 'Invalid feature types or values',
                'validation_errors': type_errors,
                'status': 400
            }), 400
        
        # Convert to pandas DataFrame (single row)
        X = pd.DataFrame([data])
        
        # Make prediction
        results = predict_discontinuation_risk(X, xgb_model, dt_model, config)
        
        # Extract single-row results
        prediction = int(results['predictions'][0])
        xgb_probability = float(results['xgb_probabilities'][0])
        upgraded_by_dt = bool(results['upgrade_flags'][0])
        
        # Determine risk level and recommendation
        risk_level = "HIGH" if prediction == 1 else "LOW"
        
        if risk_level == "HIGH":
            recommendation = "Schedule follow-up counseling session"
        else:
            recommendation = "Continue monitoring contraceptive use"
        
        # Build response
        response = {
            'risk_level': risk_level,
            'confidence': round(xgb_probability, 4),
            'recommendation': recommendation,
            'xgb_probability': round(xgb_probability, 4),
            'upgraded_by_dt': upgraded_by_dt,
            'metadata': {
                'model_version': 'v3',
                'threshold': config['threshold_v3'],
                'confidence_margin': config['conf_margin_v3']
            }
        }
        
        return jsonify(response), 200
        
    except ValueError as e:
        return jsonify({
            'error': 'Validation error',
            'message': str(e),
            'status': 400
        }), 400
        
    except Exception as e:
        print("=" * 70)
        print("ERROR IN PREDICTION")
        print("=" * 70)
        print(traceback.format_exc())
        print("=" * 70)
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred during prediction',
            'details': str(e) if FLASK_DEBUG else None,
            'status': 500
        }), 500


@app.route('/api/v1/features', methods=['GET'])
def get_required_features():
    """
    Get list of required features for prediction.
    
    Returns:
        JSON response with list of 26 required feature names
    """
    return jsonify({
        'required_features': REQUIRED_FEATURES,
        'total_count': len(REQUIRED_FEATURES),
        'categories': {
            'demographic': 13,
            'fertility': 4,
            'method_history': 9
        }
    }), 200


# ==============================================================================
# PATIENT INTAKE & HANDOFF (IN-MEMORY)
# ==============================================================================

# Simple in-memory storage for patient handoff
# Format: { 'CODE12': { ...patient_data... }, ... }
PATIENT_DB = {}

import string
import secrets

def generate_patient_code(length=6):
    """Generate a random alphanumeric code (uppercase)."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(secrets.choice(chars) for _ in range(length))
        if code not in PATIENT_DB:
            return code

@app.route('/api/v1/patient-intake', methods=['POST'])
def create_patient_intake():
    """
    Submit patient intake data (Guest App) and get a retrieval code.
    
    Request Body:
        JSON object containing PatientIntakeData
    
    Returns:
        JSON: { 'code': 'A7X29P', 'expires_in': '24h' }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Generate unique code
        code = generate_patient_code()
        
        # Store in DB (In a real app, use Redis/DB with TTL)
        PATIENT_DB[code] = data
        
        print(f"✅ Patient Intake Created: {code}")
        
        return jsonify({
            'code': code,
            'message': 'Patient data stored successfully',
            'expires_in': 'Session' 
        }), 201
        
    except Exception as e:
        print(f"❌ Error in create_patient_intake: {e}")
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500


@app.route('/api/v1/patient-intake/<code_id>', methods=['GET'])
def get_patient_intake(code_id):
    """
    Retrieve patient data using the code (Doctor App).
    """
    try:
        code = code_id.upper().strip()
        
        if code in PATIENT_DB:
            data = PATIENT_DB[code]
            print(f"✅ Patient Data Retrieived: {code}")
            return jsonify(data), 200
        else:
            return jsonify({'error': 'NotFound', 'message': 'Invalid code or data expired'}), 404
            
    except Exception as e:
        print(f"❌ Error in get_patient_intake: {e}")
        return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("ContraceptIQ Discontinuation Risk API")
    print("=" * 70)
    print(f"Host: {FLASK_HOST}")
    print(f"Port: {FLASK_PORT}")
    print(f"Debug: {FLASK_DEBUG}")
    print(f"Model Directory: {MODEL_DIR}")
    print("=" * 70)
    print("\nStarting server...\n")
    
    app.run(
        host=FLASK_HOST,
        port=FLASK_PORT,
        debug=FLASK_DEBUG
    )
