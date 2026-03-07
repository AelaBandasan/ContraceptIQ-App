# ContraceptIQ Integration Test Plan

**Version:** 1.0  
**Last Updated:** January 29, 2026

---

## Purpose

This document outlines the end-to-end integration tests for the ContraceptIQ mobile app and backend ML API. It covers user flows, error scenarios, network transitions, and system robustness.

---

## Table of Contents

1. [Test Environment](#test-environment)
2. [Test Scenarios](#test-scenarios)
3. [Test Cases](#test-cases)
4. [Test Data](#test-data)
5. [Results & Issues](#results--issues)

---

## Test Environment

- **Backend:** Python Flask API (localhost:5000)
- **Frontend:** React Native app (Android/iOS simulator or device)
- **Network:** WiFi and mobile data, with ability to toggle offline
- **Tools:**
  - Postman/cURL for API
  - React Native Debugger
  - Device/Emulator network controls

---

## Test Scenarios

1. **Normal Assessment Flow**
2. **Offline/Online Transitions**
3. **API Error Handling**
4. **Retry Logic**
5. **Concurrent Requests**
6. **Navigation During Requests**
7. **State Persistence**
8. **Input Validation**
9. **Edge Cases**

---

## Test Cases

### 1. Normal Assessment Flow

- **Steps:**
  1. Launch app
  2. Complete onboarding
  3. Enter valid data in "What's Right for Me?"
  4. Tap "Continue" to Recommendation
  5. Tap "Assess My Discontinuation Risk"
- **Expected:**
  - Assessment completes in <5s
  - Risk card displays correct result
  - No errors shown

### 2. Offline/Online Transitions

- **Steps:**
  1. Start assessment with internet
  2. Turn off WiFi/data before tapping "Assess"
  3. Tap "Assess My Discontinuation Risk"
  4. Observe error, then restore connection
  5. Tap "Retry"
- **Expected:**
  - Offline error shown
  - Retry works when online

### 3. API Error Handling

- **Steps:**
  1. Stop backend server
  2. Tap "Assess My Discontinuation Risk"
  3. Observe error
  4. Start backend, tap "Retry"
- **Expected:**
  - Service unavailable error shown
  - Retry works when backend is up

### 4. Retry Logic

- **Steps:**
  1. Simulate intermittent network (toggle WiFi/data)
  2. Tap "Assess"
- **Expected:**
  - App retries up to 3 times
  - Exponential backoff observed
  - Error shown if all fail

### 5. Concurrent Requests

- **Steps:**
  1. Rapidly tap "Assess" button multiple times
- **Expected:**
  - Only one request sent
  - Button disables during request
  - No duplicate results/errors

### 6. Navigation During Requests

- **Steps:**
  1. Start assessment
  2. Navigate away before completion
  3. Return to Recommendation screen
- **Expected:**
  - Pending request is cancelled
  - No memory leaks/errors
  - User can retry

### 7. State Persistence

- **Steps:**
  1. Complete assessment
  2. Close and reopen app
  3. Return to Recommendation screen
- **Expected:**
  - Last result persists (if designed)
  - No crash or data loss

### 8. Input Validation

- **Steps:**
  1. Leave required fields blank
  2. Enter invalid data (e.g., age < 10)
  3. Tap "Assess"
- **Expected:**
  - Validation error shown
  - No request sent to backend

### 9. Edge Cases

- **Steps:**
  1. Device sleep/wake during request
  2. App background/foreground during request
  3. Assessment with max/min values
- **Expected:**
  - No crash or data loss
  - Errors handled gracefully

---

## Test Data

- Use realistic user profiles (see backend `test_api.py`)
- Test with edge values (min/max age, missing fields)

---

## Results & Issues

| Test Case                  | Status | Notes |
| -------------------------- | ------ | ----- |
| Normal Assessment Flow     |        |       |
| Offline/Online Transitions |        |       |
| API Error Handling         |        |       |
| Retry Logic                |        |       |
| Concurrent Requests        |        |       |
| Navigation During Requests |        |       |
| State Persistence          |        |       |
| Input Validation           |        |       |
| Edge Cases                 |        |       |

- Record results, issues, and fixes here after each test run.

---

**End of Integration Test Plan**
