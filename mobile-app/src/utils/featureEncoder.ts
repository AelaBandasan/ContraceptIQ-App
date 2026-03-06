/**
 * Feature Encoder — maps human-readable form values to numeric codes
 * 
 * This module translates the string selections from the guest assessment 
 * form into numeric values that the ML model expects.
 * 
 * Encoding maps are derived from the training data preprocessing pipeline.
 * All features are converted to numbers before being passed to the ONNX model.
 */

// ============================================================================
// ENCODING MAPS
// ============================================================================

/**
 * Region encoding: maps region display name → numeric code
 */
export const REGION_MAP: Record<string, number> = {
    'NCR': 1,
    'CAR': 2,
    'Region I – Ilocos': 3,
    'Region II – Cagayan Valley': 4,
    'Region III – Central Luzon': 5,
    'Region IV-A – CALABARZON': 6,
    'Region IV-B – MIMAROPA': 7,
    'Region V – Bicol': 8,
    'Region VI – Western Visayas': 9,
    'Region VII – Central Visayas': 10,
    'Region VIII – Eastern Visayas': 11,
    'Region IX – Zamboanga Peninsula': 12,
    'Region X – Northern Mindanao': 13,
    'Region XI – Davao Region': 14,
    'Region XII – SOCCSKSARGEN': 15,
    'Region XIII – Caraga': 16,
    'BARMM': 17,
};

/**
 * Education level encoding
 */
export const EDUC_LEVEL_MAP: Record<string, number> = {
    'No formal education': 0,
    'Primary': 1,
    'Secondary': 2,
    'Senior High School': 3,
    'Vocational/Technical': 4,
    'College Undergraduate': 5,
    'College Graduate': 6,
};

/**
 * Religion encoding
 */
export const RELIGION_MAP: Record<string, number> = {
    'Roman Catholic': 1,
    'Christian': 2,
    'Muslim': 3,
    'Iglesia ni Cristo': 4,
    'No Religion': 5,
    'Other Religion': 6,
    'Prefer not to say': 7,
};

/**
 * Ethnicity encoding
 */
export const ETHNICITY_MAP: Record<string, number> = {
    'Tagalog': 1,
    'Cebuano': 2,
    'Ilocano': 3,
};

/**
 * Marital status encoding
 */
export const MARITAL_STATUS_MAP: Record<string, number> = {
    'Single': 0,
    'Married': 1,
    'Living with partner': 2,
    'Separated': 3,
    'Divorced': 4,
    'Widowed': 5,
};

/**
 * Yes/No encoding
 */
export const YES_NO_MAP: Record<string, number> = {
    'Yes': 1,
    'No': 0,
};

/**
 * Household head sex encoding
 */
export const HOUSEHOLD_HEAD_SEX_MAP: Record<string, number> = {
    'Male': 1,
    'Female': 2,
    'Shared/Both': 3,
    'Others': 4,
};

/**
 * Occupation encoding
 */
export const OCCUPATION_MAP: Record<string, number> = {
    'Unemployed': 0,
    'Student': 1,
    'Farmer': 2,
    'Others': 3,
};

/**
 * Smoking habits encoding
 */
export const SMOKE_CIGAR_MAP: Record<string, number> = {
    'Never': 0,
    'Former smoker': 1,
    'Occasional smoker': 2,
    'Current daily': 3,
};

/**
 * Desire for more children / want child encoding
 */
export const DESIRE_CHILDREN_MAP: Record<string, number> = {
    'Yes': 1,
    'No': 0,
    'Not Sure': 2,
};

/**
 * Last method discontinued encoding
 */
export const LAST_METHOD_MAP: Record<string, number> = {
    'None': 0,
    'Pills': 1,
    'Condom': 2,
    'Copper IUD': 3,
    'Intrauterine Device (IUD)': 4,
    'Implant': 5,
    'Patch': 6,
    'Injectable': 7,
    'Withdrawal': 8,
};

/**
 * Reason for discontinuation encoding
 */
export const REASON_DISCONTINUED_MAP: Record<string, number> = {
    'None / Not Applicable': 0,
    'Side effects': 1,
    'Health concerns': 2,
    'Desire to become pregnant': 3,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely encode a value using a lookup map.
 * Returns the numeric code, or a fallback value if not found.
 */
function encodeValue(value: string | number | undefined, map: Record<string, number>, fallback: number = 0): number {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'number') return value;
    return map[value] ?? fallback;
}

/**
 * Parse a numeric value from form data (may be stored as string).
 */
function parseNumeric(value: string | number | undefined, fallback: number = 0): number {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}

import { Tensor } from 'onnxruntime-react-native';

/**
 * Encode raw form data into a dictionary of ONNX Tensors.
 * 
 * @param formData - Raw form data from GuestAssessment (string values)
 * @param clinicalData - Optional clinical data added by the OB doctor
 * @returns Record of explicitly typed ONNX Tensors for each feature column
 */
export function encodeFeatures(formData: Record<string, any>, clinicalData?: Record<string, any>): Record<string, Tensor> {
    const merged = { ...formData, ...clinicalData };

    // Helper functions for type conversion
    const ensureString = (val: any) => val === undefined || val === null ? "Missing" : String(val);
    const ensureFloat = (val: any) => {
        if (val === undefined || val === null || val === '') return 0.0;
        const parsed = parseFloat(String(val));
        return isNaN(parsed) ? 0.0 : parsed;
    };

    // Construct the ONNX input map. 
    // Types correspond to how the Scikit-learn Pipeline was constructed.
    // ALL variables are now purely Numerical Floats to bypass React Native JSI String Tensor memory limitations
    const inputs: Record<string, Tensor> = {
        'REGION': new Tensor('float32', new Float32Array([ensureFloat(merged.REGION)]), [1, 1]),
        'EDUC_LEVEL': new Tensor('float32', new Float32Array([ensureFloat(merged.EDUC_LEVEL)]), [1, 1]),
        'RELIGION': new Tensor('float32', new Float32Array([ensureFloat(merged.RELIGION)]), [1, 1]),
        'ETHNICITY': new Tensor('float32', new Float32Array([ensureFloat(merged.ETHNICITY)]), [1, 1]),
        'MARITAL_STATUS': new Tensor('float32', new Float32Array([ensureFloat(merged.MARITAL_STATUS)]), [1, 1]),
        'HOUSEHOLD_HEAD_SEX': new Tensor('float32', new Float32Array([ensureFloat(merged.HOUSEHOLD_HEAD_SEX)]), [1, 1]),
        'OCCUPATION': new Tensor('float32', new Float32Array([ensureFloat(merged.OCCUPATION)]), [1, 1]),
        'HUSBANDS_EDUC': new Tensor('float32', new Float32Array([ensureFloat(merged.HUSBAND_EDUC_LEVEL || merged.HUSBANDS_EDUC)]), [1, 1]),
        'PARTNER_EDUC': new Tensor('float32', new Float32Array([ensureFloat(merged.PARTNER_EDUC)]), [1, 1]),
        'SMOKE_CIGAR': new Tensor('float32', new Float32Array([ensureFloat(merged.SMOKE_CIGAR)]), [1, 1]),
        'DESIRE_FOR_MORE_CHILDREN': new Tensor('float32', new Float32Array([ensureFloat(merged.DESIRE_FOR_MORE_CHILDREN)]), [1, 1]),
        'WANT_LAST_CHILD': new Tensor('float32', new Float32Array([ensureFloat(merged.WANT_LAST_CHILD)]), [1, 1]),
        'WANT_LAST_PREGNANCY': new Tensor('float32', new Float32Array([ensureFloat(merged.WANT_LAST_PREGNANCY)]), [1, 1]),
        'CONTRACEPTIVE_METHOD': new Tensor('float32', new Float32Array([ensureFloat(merged.CONTRACEPTIVE_METHOD)]), [1, 1]),
        'CURRENT_USE_TYPE': new Tensor('float32', new Float32Array([ensureFloat(merged.CURRENT_USE_TYPE)]), [1, 1]),
        'LAST_SOURCE_TYPE': new Tensor('float32', new Float32Array([ensureFloat(merged.LAST_SOURCE_TYPE)]), [1, 1]),
        'LAST_METHOD_DISCONTINUED': new Tensor('float32', new Float32Array([ensureFloat(merged.LAST_METHOD_DISCONTINUED)]), [1, 1]),
        'REASON_DISCONTINUED': new Tensor('float32', new Float32Array([ensureFloat(merged.REASON_DISCONTINUED)]), [1, 1]),
        'PATTERN_USE': new Tensor('float32', new Float32Array([ensureFloat(merged.PATTERN_USE)]), [1, 1]),
        'TOLD_ABT_SIDE_EFFECTS': new Tensor('float32', new Float32Array([ensureFloat(merged.TOLD_ABT_SIDE_EFFECTS)]), [1, 1]),
        'HSBND_DESIRE_FOR_MORE_CHILDREN': new Tensor('float32', new Float32Array([ensureFloat(merged.HSBND_DESIRE_FOR_MORE_CHILDREN)]), [1, 1]),
        'RESIDING_WITH_PARTNER': new Tensor('float32', new Float32Array([ensureFloat(merged.RESIDING_WITH_PARTNER)]), [1, 1]),
        'MONTH_USE_CURRENT_METHOD': new Tensor('float32', new Float32Array([ensureFloat(merged.MONTH_USE_CURRENT_METHOD)]), [1, 1]),
        'EDUC': new Tensor('float32', new Float32Array([ensureFloat(merged.EDUC || 0)]), [1, 1]),
        'AGE_GRP': new Tensor('float32', new Float32Array([ensureFloat(merged.AGE_GRP || 0)]), [1, 1]),
        'HUSBAND_AGE': new Tensor('float32', new Float32Array([ensureFloat(merged.HUSBAND_AGE)]), [1, 1]),
        'AGE': new Tensor('float32', new Float32Array([ensureFloat(merged.AGE)]), [1, 1]),
        'PARITY': new Tensor('float32', new Float32Array([ensureFloat(merged.PARITY)]), [1, 1]),
    };

    // Required feature placeholder for 'CASEID' based on training schema
    inputs['CASEID'] = new Tensor('float32', new Float32Array([ensureFloat(merged.CASEID || -1)]), [1, 1]);

    return inputs;
}

/**
 * Validate that all required features can be encoded.
 * Returns a list of missing or un-encodable feature names.
 */
export function validateFeatures(formData: Record<string, any>): string[] {
    const missing: string[] = [];

    // Check guest assessment required fields
    const requiredGuest = [
        'AGE', 'REGION', 'EDUC_LEVEL', 'RELIGION', 'ETHNICITY',
        'MARITAL_STATUS', 'SMOKE_CIGAR', 'PARITY',
    ];

    for (const key of requiredGuest) {
        if (formData[key] === undefined || formData[key] === null || formData[key] === '') {
            missing.push(key);
        }
    }

    return missing;
}
