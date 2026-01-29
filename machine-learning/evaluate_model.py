import os
import joblib
import pandas as pd

# --- Configuration ---
# Assumes the model is saved in a 'models' directory within the 'machine-learning' folder.
# Update this path if your model is saved elsewhere.
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'src', 'models', 'models_v1', 'hybrid_model.joblib')

# The 25 features required by the model, in the correct order.
FEATURES = [
    'AGE', 'REGION', 'EDUC_LEVEL', 'RELIGION', 'ETHNICITY',
    'MARITAL_STATUS', 'RESIDING_WITH_PARTNER', 'HOUSEHOLD_HEAD_SEX',
    'OCCUPATION', 'HUSBANDS_EDUC', 'HUSBAND_AGE', 'PARTNER_EDUC',
    'SMOKE_CIGAR', 'PARITY', 'DESIRE_FOR_MORE_CHILDREN',
    'WANT_LAST_CHILD', 'WANT_LAST_PREGNANCY', 'CONTRACEPTIVE_METHOD',
    'MONTH_USE_CURRENT_METHOD', 'PATTERN_USE', 'TOLD_ABT_SIDE_EFFECTS',
    'LAST_SOURCE_TYPE', 'LAST_METHOD_DISCONTINUED', 'REASON_DISCONTINUED',
    'HSBND_DESIRE_FOR_MORE_CHILDREN'
]

def load_model(path):
    """Loads the pre-trained model from disk."""
    print(f"Loading model from: {path}")
    if not os.path.exists(path):
        print(f"\n--- ERROR: Model file not found at '{path}' ---")
        print("Please ensure you have a trained model saved at that location.")
        return None
    try:
        loaded_object = joblib.load(path)
        # The joblib file might be a dictionary containing the model and other artifacts.
        # We check if it's a dict and has a 'model' key.
        if isinstance(loaded_object, dict) and 'model' in loaded_object:
            print("Loaded a dictionary. Extracting model object under key 'model'.")
            model = loaded_object['model']
        else:
            model = loaded_object
        print("Model loaded successfully.")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

def get_user_input():
    """Interactively prompts the user for all required features."""
    print("\n--- Please enter the user's data ---")
    print("Press Enter to use the default value shown in parentheses.")
    user_data = {}
    
    # Default values from your project's test data for easier testing
    defaults = {
      "AGE": 28, "REGION": 1, "EDUC_LEVEL": 3, "RELIGION": 1, "ETHNICITY": 1,
      "MARITAL_STATUS": 1, "RESIDING_WITH_PARTNER": 1, "HOUSEHOLD_HEAD_SEX": 1,
      "OCCUPATION": 2, "HUSBANDS_EDUC": 3, "HUSBAND_AGE": 32, "PARTNER_EDUC": 3,
      "SMOKE_CIGAR": 0, "PARITY": 2, "DESIRE_FOR_MORE_CHILDREN": 0,
      "WANT_LAST_CHILD": 1, "WANT_LAST_PREGNANCY": 1, "CONTRACEPTIVE_METHOD": 3,
      "MONTH_USE_CURRENT_METHOD": 12, "PATTERN_USE": 1, "TOLD_ABT_SIDE_EFFECTS": 1,
      "LAST_SOURCE_TYPE": 1, "LAST_METHOD_DISCONTINUED": 0, "REASON_DISCONTINUED": 0,
      "HSBND_DESIRE_FOR_MORE_CHILDREN": 0
    }
    
    for feature in FEATURES:
        while True:
            default_val = defaults.get(feature, 'N/A')
            prompt = f"- Enter value for '{feature}' (default: {default_val}): "
            value = input(prompt).strip()
            if value == "":
                user_data[feature] = default_val
                print(f"  -> Using default: {default_val}")
                break
            try:
                # All features are expected to be numeric
                user_data[feature] = int(value)
                break
            except ValueError:
                print("  Invalid input. Please enter a whole number.")
    return user_data

def predict_risk(model, user_data):
    """Makes a prediction using the loaded model and user data."""
    input_df = pd.DataFrame([user_data])
    input_df = input_df[FEATURES] # Ensure column order
    
    print("\n--- Input Data for Prediction ---")
    print(input_df.to_string(index=False))
    
    try:
        # The model predicts [prob_of_0, prob_of_1]
        probability = model.predict_proba(input_df)[0][1]
        prediction = model.predict(input_df)[0]
        return prediction, probability
    except Exception as e:
        print(f"\nError during prediction: {e}")
        return None, None

def main():
    """Main function to run the evaluation CLI."""
    print("--- Contraceptive Discontinuation Risk Assessment CLI ---")
    
    model = load_model(MODEL_PATH)
    if model is None:
        return

    user_data = get_user_input()
    
    prediction, probability = predict_risk(model, user_data)
    
    if prediction is not None:
        risk_level = "HIGH" if prediction == 1 else "LOW"
        threshold = 0.15  # The threshold used in your app
        
        print("\n--- Prediction Result ---")
        print(f"  Risk Level: {risk_level}")
        print(f"  Discontinuation Probability: {probability:.4f} ({probability*100:.2f}%)")
        
        if probability >= threshold:
            print(f"\n  Explanation: The probability ({probability:.2f}) is >= the threshold ({threshold:.2f}), indicating a HIGH risk.")
        else:
            print(f"\n  Explanation: The probability ({probability:.2f}) is < the threshold ({threshold:.2f}), indicating a LOW risk.")

if __name__ == "__main__":
    main()