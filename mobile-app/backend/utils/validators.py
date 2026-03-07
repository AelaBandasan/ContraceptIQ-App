"""
Input validation utilities for API requests.
"""

from typing import Dict, List, Tuple, Any
from config import REQUIRED_FEATURES


def validate_input_features(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate that all required features are present in the input data.
    
    Args:
        data: Dictionary containing user assessment data
        
    Returns:
        Tuple of (is_valid, missing_features)
        - is_valid: True if all required features are present
        - missing_features: List of missing feature names (empty if valid)
        
    Example:
        >>> data = {'AGE': 28, 'REGION': 1}
        >>> is_valid, missing = validate_input_features(data)
        >>> print(is_valid)
        False
        >>> print(missing)
        ['EDUC_LEVEL', 'RELIGION', ...]
    """
    missing_features = [
        feature for feature in REQUIRED_FEATURES
        if feature not in data
    ]
    
    is_valid = len(missing_features) == 0
    
    return is_valid, missing_features


def validate_feature_types(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate that feature values have acceptable types.
    
    Args:
        data: Dictionary containing user assessment data
        
    Returns:
        Tuple of (is_valid, error_messages)
        - is_valid: True if all features have valid types
        - error_messages: List of validation error messages
    """
    errors = []
    
    # Numeric features that must be numbers
    numeric_features = [
        'AGE', 'PARITY', 'HUSBAND_AGE', 'RESIDING_WITH_PARTNER',
        'HOUSEHOLD_HEAD_SEX', 'SMOKE_CIGAR', 'TOLD_ABT_SIDE_EFFECTS'
    ]
    
    for feature in numeric_features:
        if feature in data:
            value = data[feature]
            if not isinstance(value, (int, float)):
                errors.append(f"{feature} must be a number, got {type(value).__name__}")
    
    # Age validation
    if 'AGE' in data:
        age = data['AGE']
        if isinstance(age, (int, float)):
            if age < 15 or age > 55:
                errors.append(f"AGE must be between 15 and 55, got {age}")
    
    # Parity validation
    if 'PARITY' in data:
        parity = data['PARITY']
        if isinstance(parity, (int, float)):
            if parity < 0 or parity > 20:
                errors.append(f"PARITY must be between 0 and 20, got {parity}")
    
    # Binary features (0 or 1)
    binary_features = [
        'RESIDING_WITH_PARTNER', 'SMOKE_CIGAR', 'TOLD_ABT_SIDE_EFFECTS'
    ]
    
    for feature in binary_features:
        if feature in data:
            value = data[feature]
            if isinstance(value, (int, float)) and value not in [0, 1]:
                errors.append(f"{feature} must be 0 or 1, got {value}")
    
    is_valid = len(errors) == 0
    
    return is_valid, errors
