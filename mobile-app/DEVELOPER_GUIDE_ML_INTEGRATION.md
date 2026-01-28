# ContraceptIQ Developer Guide: ML Integration & Architecture

**Version:** 1.0  
**Last Updated:** January 29, 2026  
**App Platform:** iOS & Android (React Native) + Python Flask Backend

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Backend: ML API (Flask)](#backend-ml-api-flask)
   - [Endpoints](#endpoints)
   - [Model Loading & Inference](#model-loading--inference)
   - [Input Validation](#input-validation)
   - [Error Handling](#error-handling)
   - [Testing the API](#testing-the-api)
4. [Frontend: React Native App](#frontend-react-native-app)
   - [API Service Layer](#api-service-layer)
   - [State Management](#state-management)
   - [Error Handling & Retry Logic](#error-handling--retry-logic)
   - [Component Integration](#component-integration)
5. [Integration Patterns](#integration-patterns)
6. [Testing Guide](#testing-guide)
7. [Deployment & Environment](#deployment--environment)
8. [Extending the System](#extending-the-system)
9. [Troubleshooting & Debugging](#troubleshooting--debugging)
10. [References](#references)

---

## Project Overview

ContraceptIQ is a cross-platform mobile app that predicts the risk of contraceptive discontinuation using a hybrid machine learning model (XGBoost + Decision Tree). The system consists of:

- **Backend:** Python Flask API serving ML models
- **Frontend:** React Native app (TypeScript)
- **Communication:** RESTful API (JSON over HTTP)

---

## Architecture Diagram

```
+-------------------+         HTTP/JSON         +-------------------+
|                   |  <-------------------->  |                   |
|  React Native App |   REST API (Flask)       |   ML Model Server |
|  (TypeScript)     |------------------------->|   (Python)        |
|                   |   /api/assess           |                   |
+-------------------+                         +-------------------+
```

- **Frontend:** User input, UI, error handling, state management
- **Backend:** Model inference, input validation, error handling

---

## Backend: ML API (Flask)

### Endpoints

- `GET /api/health` — Health check
- `POST /api/assess` — Risk assessment (main endpoint)
- `GET /api/features` — List of required features

#### Example Request

```json
POST /api/assess
{
  "age": 25,
  "region": "NCR",
  ... // 25 more features
}
```

#### Example Response

```json
{
  "risk_level": "HIGH",
  "confidence": 0.87,
  "recommendation": "Consider discussing alternatives..."
}
```

### Model Loading & Inference

- Models stored as `.joblib` files in `src/models/models_high_risk_v3/`
- Loaded at Flask app startup
- Inference via `xgb_model.py`, `decision_tree.py`, `hybrid_voting.py`
- Hybrid voting logic: XGBoost + Decision Tree, majority vote

### Input Validation

- All 26 features required
- Type and range checks (see `preprocessor.py`)
- Returns 400 error for invalid/missing data

### Error Handling

- All errors returned as JSON with `error` and `details`
- Logs errors to `outputs/logs/`
- Handles model loading, inference, and validation errors

### Testing the API

- Use `test_api.py` for automated tests
- Manual: `curl -X POST http://localhost:5000/api/assess -d '{...}' -H 'Content-Type: application/json'`

---

## Frontend: React Native App

### API Service Layer

- Located in `src/utils/discontinuationRiskService.ts`
- Uses `axios` for HTTP requests
- Implements retry logic (3 attempts, exponential backoff)
- Handles network errors, timeouts, and server errors

#### Example Usage

```typescript
import { assessDiscontinuationRisk } from "../utils/discontinuationRiskService";
const result = await assessDiscontinuationRisk(data);
```

### State Management

- Global state via `AssessmentContext` (React Context API)
- 8 custom hooks for accessing/updating assessment data
- Located in `src/context/AssessmentContext.tsx`

### Error Handling & Retry Logic

- Centralized in `errorHandler.ts`, `errorMessageMapper.ts`, `networkUtils.ts`, `loggerUtils.ts`
- UI errors shown via `ErrorAlert.tsx` component
- Request deduplication via `requestDeduplication.ts`
- Navigation guards via `navigationGuard.ts`

### Component Integration

- Main screens: `Whatsrightforme.tsx`, `Recommendation.tsx`
- ErrorAlert integrated for user feedback
- Assessment button disables during requests
- Cleanup on unmount to prevent memory leaks

---

## Integration Patterns

### 1. API Call Pattern

- Always use `deduplicate()` for assessment requests
- Handle errors with `try/catch` and convert to `AppError`
- Use context state for loading and error status

### 2. Navigation Pattern

- Use `guardedNavigate()` for screen transitions
- Cleanup pending requests on unmount

### 3. Error Handling Pattern

- All errors passed through `createAppError()`
- Displayed via `ErrorAlert` with retry/dismiss

---

## Testing Guide

### Backend

- Run `python test_api.py` in `mobile-app/backend/`
- Check logs in `outputs/logs/`
- Validate with edge cases (missing fields, invalid types)

### Frontend

- Manual: Simulate network loss, server errors, invalid input
- Automated: (Add Jest/React Native Testing Library tests as needed)
- Test deduplication by rapid button presses
- Test navigation away during request

---

## Deployment & Environment

### Backend

- Python 3.10+
- Install dependencies: `pip install -r requirements.txt`
- Run: `python app.py` (default port 5000)

### Frontend

- Node.js 18+
- Install: `npm install` in `mobile-app/`
- Run: `npx react-native run-android` or `run-ios`

### Environment Variables

- Backend: (Optional) set `PORT`, `MODEL_PATH`
- Frontend: (Optional) set API base URL in config

---

## Extending the System

### Adding New Features

- Update `src/models_2/` with new model logic
- Update `preprocessor.py` for new input features
- Update API contract in both backend and frontend
- Add new UI components/screens as needed

### Improving the Model

- Retrain models with new data in `data/`
- Save new `.joblib` files in `models_high_risk_v3/`
- Update backend to load new models

---

## Troubleshooting & Debugging

### Common Issues

- **API not responding:** Check Flask server logs, ensure port 5000 is open
- **Model not loading:** Check model file paths, permissions
- **Frontend errors:** Check networkUtils, errorHandler logs
- **Assessment stuck loading:** Check for pending requests, network status

### Debugging Tips

- Use `loggerUtils.ts` for frontend logs
- Use Flask debug mode for backend (`app.run(debug=True)`)
- Use React Native Debugger for frontend

---

## References

- [XGBoost Documentation](https://xgboost.readthedocs.io/)
- [scikit-learn Documentation](https://scikit-learn.org/)
- [React Native Docs](https://reactnative.dev/)
- [Flask Docs](https://flask.palletsprojects.com/)
- [Axios Docs](https://axios-http.com/)

---

**For questions or contributions, contact the ContraceptIQ development team at dev@contraceptiq.app.**
