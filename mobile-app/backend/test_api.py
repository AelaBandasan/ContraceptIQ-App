"""
Test script for the ContraceptIQ API endpoints.
Run this while the server is running in another terminal.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_health():
    """Test the health check endpoint."""
    print("\n" + "="*70)
    print("TEST 1: Health Check")
    print("="*70)
    
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to server. Is it running?")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False


def test_get_features():
    """Test the get features endpoint."""
    print("\n" + "="*70)
    print("TEST 2: Get Required Features")
    print("="*70)
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/features", timeout=5)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Total Features: {data['total_count']}")
        print(f"Categories: {data['categories']}")
        print(f"\nFirst 5 features:")
        for feature in data['required_features'][:5]:
            print(f"  - {feature}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False


def test_prediction_sample1():
    """Test prediction with sample user 1 (LOW RISK)."""
    print("\n" + "="*70)
    print("TEST 3: Predict Discontinuation Risk - Sample 1 (Expected: LOW RISK)")
    print("="*70)
    
    # Sample user data (from test_data.json)
    data = {
        "AGE": 28,
        "REGION": 1,
        "EDUC_LEVEL": 3,
        "RELIGION": 1,
        "ETHNICITY": 1,
        "MARITAL_STATUS": 1,
        "RESIDING_WITH_PARTNER": 1,
        "HOUSEHOLD_HEAD_SEX": 1,
        "OCCUPATION": 2,
        "HUSBANDS_EDUC": 3,
        "HUSBAND_AGE": 32,
        "PARTNER_EDUC": 3,
        "SMOKE_CIGAR": 0,
        "PARITY": 2,
        "DESIRE_FOR_MORE_CHILDREN": 0,
        "WANT_LAST_CHILD": 1,
        "WANT_LAST_PREGNANCY": 1,
        "CONTRACEPTIVE_METHOD": 3,
        "MONTH_USE_CURRENT_METHOD": 12,
        "PATTERN_USE": 1,
        "TOLD_ABT_SIDE_EFFECTS": 1,
        "LAST_SOURCE_TYPE": 1,
        "LAST_METHOD_DISCONTINUED": 0,
        "REASON_DISCONTINUED": 0,
        "HSBND_DESIRE_FOR_MORE_CHILDREN": 0
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/discontinuation-risk",
            json=data,
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"\nPrediction Results:")
        print(f"  Risk Level: {result['risk_level']}")
        print(f"  Confidence: {result['confidence']:.4f}")
        print(f"  XGB Probability: {result['xgb_probability']:.4f}")
        print(f"  Upgraded by DT: {result['upgraded_by_dt']}")
        print(f"  Recommendation: {result['recommendation']}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False


def test_prediction_sample2():
    """Test prediction with sample user 2 (HIGH RISK)."""
    print("\n" + "="*70)
    print("TEST 4: Predict Discontinuation Risk - Sample 2 (Expected: HIGH RISK)")
    print("="*70)
    
    # Sample user data (high risk profile)
    data = {
        "AGE": 42,
        "REGION": 2,
        "EDUC_LEVEL": 1,
        "RELIGION": 1,
        "ETHNICITY": 2,
        "MARITAL_STATUS": 1,
        "RESIDING_WITH_PARTNER": 0,
        "HOUSEHOLD_HEAD_SEX": 2,
        "OCCUPATION": 1,
        "HUSBANDS_EDUC": 1,
        "HUSBAND_AGE": 45,
        "PARTNER_EDUC": 1,
        "SMOKE_CIGAR": 1,
        "PARITY": 5,
        "DESIRE_FOR_MORE_CHILDREN": 0,
        "WANT_LAST_CHILD": 0,
        "WANT_LAST_PREGNANCY": 0,
        "CONTRACEPTIVE_METHOD": 1,
        "MONTH_USE_CURRENT_METHOD": 3,
        "PATTERN_USE": 2,
        "TOLD_ABT_SIDE_EFFECTS": 0,
        "LAST_SOURCE_TYPE": 2,
        "LAST_METHOD_DISCONTINUED": 2,
        "REASON_DISCONTINUED": 3,
        "HSBND_DESIRE_FOR_MORE_CHILDREN": 1
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/discontinuation-risk",
            json=data,
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"\nPrediction Results:")
        print(f"  Risk Level: {result['risk_level']}")
        print(f"  Confidence: {result['confidence']:.4f}")
        print(f"  XGB Probability: {result['xgb_probability']:.4f}")
        print(f"  Upgraded by DT: {result['upgraded_by_dt']}")
        print(f"  Recommendation: {result['recommendation']}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False


def test_missing_features():
    """Test validation error for missing features."""
    print("\n" + "="*70)
    print("TEST 5: Validation - Missing Features")
    print("="*70)
    
    # Incomplete data (missing most features)
    data = {
        "AGE": 28,
        "REGION": 1
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/discontinuation-risk",
            json=data,
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"\nError Response:")
        print(f"  Error: {result.get('error')}")
        print(f"  Missing Features Count: {len(result.get('missing_features', []))}")
        print(f"  First 5 missing: {result.get('missing_features', [])[:5]}")
        return response.status_code == 400  # Should return 400 Bad Request
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False


def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("ContraceptIQ API Test Suite")
    print("="*70)
    print(f"Testing API at: {BASE_URL}")
    print("Make sure the server is running before executing tests!")
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health()))
    results.append(("Get Features", test_get_features()))
    results.append(("Prediction - Low Risk", test_prediction_sample1()))
    results.append(("Prediction - High Risk", test_prediction_sample2()))
    results.append(("Validation - Missing Features", test_missing_features()))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*70)
    
    if passed == total:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the output above.")


if __name__ == "__main__":
    main()
