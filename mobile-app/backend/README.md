# ContraceptIQ Backend API

Flask API server for the high-recall hybrid discontinuation risk prediction model.

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile-app/backend
pip install -r requirements.txt
```

Or use a virtual environment (recommended):

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the example environment file:

```bash
copy .env.example .env
```

Edit `.env` if needed (default values should work).

### 3. Verify ML Models

Ensure the ML model files exist at:

```
../../machine-learning/src/models/models_high_risk_v3/
├── xgb_high_recall.joblib
├── dt_high_recall.joblib
└── hybrid_v3_config.json
```

### 4. Start the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check

**GET** `/api/health`

Returns server status and model loading status.

**Response:**

```json
{
  "status": "healthy",
  "models_loaded": true,
  "model_directory": "../../machine-learning/src/models/models_high_risk_v3",
  "message": "Server is running"
}
```

### Get Required Features

**GET** `/api/v1/features`

Returns list of 26 required input features.

**Response:**

```json
{
  "required_features": ["AGE", "REGION", ...],
  "total_count": 26,
  "categories": {
    "demographic": 13,
    "fertility": 4,
    "method_history": 9
  }
}
```

### Predict Discontinuation Risk

**POST** `/api/v1/discontinuation-risk`

Predicts whether a contraceptive user is at risk of discontinuation.

**Request Body:**

```json
{
  "AGE": 28,
  "REGION": 1,
  "EDUC_LEVEL": 3,
  "RELIGION": 1,
  "ETHNICITY": 1,
  "MARITAL_STATUS": 1,
  "RESIDING_WITH_PARTNER": 1,
  "HOUSEHOLD_HEAD_SEX": 1,
  "OCCUPATION": 2,
  "HUSBANDS_EDUC": 2,
  "HUSBAND_AGE": 32,
  "PARTNER_EDUC": 2,
  "SMOKE_CIGAR": 0,
  "PARITY": 3,
  "DESIRE_FOR_MORE_CHILDREN": 0,
  "WANT_LAST_CHILD": 1,
  "WANT_LAST_PREGNANCY": 1,
  "CONTRACEPTIVE_METHOD": 3,
  "MONTH_USE_CURRENT_METHOD": 12,
  "PATTERN_USE": 1,
  "TOLD_ABT_SIDE_EFFECTS": 1,
  "LAST_SOURCE_TYPE": 1,
  "LAST_METHOD_DISCONTINUED": 2,
  "REASON_DISCONTINUED": 3,
  "HSBND_DESIRE_FOR_MORE_CHILDREN": 1
}
```

**Success Response (200):**

```json
{
  "risk_level": "LOW",
  "confidence": 0.1205,
  "recommendation": "Continue monitoring contraceptive use",
  "xgb_probability": 0.1205,
  "upgraded_by_dt": false,
  "metadata": {
    "model_version": "v3",
    "threshold": 0.15,
    "confidence_margin": 0.2
  }
}
```

**Error Response (400 - Missing Features):**

```json
{
  "error": "Missing required features",
  "missing_features": ["AGE", "REGION"],
  "required_features_count": 26,
  "provided_features_count": 24,
  "status": 400
}
```

**Error Response (400 - Invalid Types):**

```json
{
  "error": "Invalid feature types or values",
  "validation_errors": ["AGE must be between 15 and 55, got 10"],
  "status": 400
}
```

## Testing

### Using curl

```bash
# Health check
curl http://localhost:5000/api/health

# Get required features
curl http://localhost:5000/api/v1/features

# Predict risk (replace with actual data)
curl -X POST http://localhost:5000/api/v1/discontinuation-risk \
  -H "Content-Type: application/json" \
  -d @test_data.json
```

### Using Python

```python
import requests

# Health check
response = requests.get('http://localhost:5000/api/health')
print(response.json())

# Predict risk
data = {
    'AGE': 28,
    'REGION': 1,
    # ... include all 26 features
}

response = requests.post(
    'http://localhost:5000/api/v1/discontinuation-risk',
    json=data
)
print(response.json())
```

## Project Structure

```
backend/
├── app.py                  # Main Flask application
├── config.py               # Configuration settings
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variables template
├── models/
│   ├── __init__.py
│   ├── model_loader.py     # ML model loading logic
│   └── predictor.py        # Prediction logic
└── utils/
    ├── __init__.py
    └── validators.py       # Input validation
```

## Troubleshooting

### Models Not Loading

**Error:** `FileNotFoundError: Missing model files`

**Solution:**

- Verify model files exist in the correct directory
- Check the `MODEL_DIR` path in `.env`
- Ensure you're in the `mobile-app/backend` directory when running

### Port Already in Use

**Error:** `Address already in use`

**Solution:**

- Change `FLASK_PORT` in `.env` to a different port (e.g., 5001)
- Or stop the process using port 5000

### Import Errors

**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**

- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

## Performance Notes

- Models are loaded once at startup and cached in memory
- First request may be slower due to JIT compilation (XGBoost)
- Subsequent requests are fast (~50-100ms)
- Server can handle multiple concurrent requests

## Security Notes

- **CORS:** Currently set to `*` for development. Change in production.
- **Validation:** All inputs are validated before prediction
- **Error Handling:** Sensitive error details only shown in debug mode

## Next Steps

- [ ] Add authentication/API keys
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Add model monitoring
- [ ] Deploy to production server
