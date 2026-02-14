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

// ============================================================================
// MAIN ENCODER
// ============================================================================

/**
 * The 26 features expected by the ML model, in the correct order.
 */
export const FEATURE_ORDER: string[] = [
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
    'PARITY',
    'DESIRE_FOR_MORE_CHILDREN',
    'WANT_LAST_CHILD',
    'WANT_LAST_PREGNANCY',
    'CONTRACEPTIVE_METHOD',
    'MONTH_USE_CURRENT_METHOD',
    'PATTERN_USE',
    'TOLD_ABT_SIDE_EFFECTS',
    'LAST_SOURCE_TYPE',
    'LAST_METHOD_DISCONTINUED',
    'REASON_DISCONTINUED',
    'HSBND_DESIRE_FOR_MORE_CHILDREN',
];

/**
 * Encode raw form data into a Float32Array of 26 numeric features.
 * 
 * @param formData - Raw form data from GuestAssessment (string values)
 * @param clinicalData - Optional clinical data added by the OB doctor
 * @returns Float32Array of 26 encoded features ready for model input
 */
export function encodeFeatures(formData: Record<string, any>, clinicalData?: Record<string, any>): Float32Array {
    const merged = { ...formData, ...clinicalData };

    const encoded: number[] = [
        // Demographic features (13)
        parseNumeric(merged.AGE, 25),
        encodeValue(merged.REGION, REGION_MAP, 1),
        encodeValue(merged.EDUC_LEVEL, EDUC_LEVEL_MAP, 2),
        encodeValue(merged.RELIGION, RELIGION_MAP, 1),
        encodeValue(merged.ETHNICITY, ETHNICITY_MAP, 1),
        encodeValue(merged.MARITAL_STATUS, MARITAL_STATUS_MAP, 0),
        encodeValue(merged.RESIDING_WITH_PARTNER, YES_NO_MAP, 0),
        encodeValue(merged.HOUSEHOLD_HEAD_SEX, HOUSEHOLD_HEAD_SEX_MAP, 1),
        encodeValue(merged.OCCUPATION, OCCUPATION_MAP, 0),
        encodeValue(merged.HUSBAND_EDUC_LEVEL || merged.HUSBANDS_EDUC, EDUC_LEVEL_MAP, 2),
        parseNumeric(merged.HUSBAND_AGE, 30),
        encodeValue(merged.PARTNER_EDUC, EDUC_LEVEL_MAP, 2),
        encodeValue(merged.SMOKE_CIGAR, SMOKE_CIGAR_MAP, 0),

        // Fertility features (4)
        parseNumeric(merged.PARITY, 0),
        encodeValue(merged.DESIRE_FOR_MORE_CHILDREN, DESIRE_CHILDREN_MAP, 0),
        encodeValue(merged.WANT_LAST_CHILD, DESIRE_CHILDREN_MAP, 0),
        encodeValue(merged.WANT_LAST_PREGNANCY, DESIRE_CHILDREN_MAP, 0),

        // Method/History features (9)
        // These are typically provided by the OB doctor in Phase 2 of the assessment.
        // Use defaults (0) if not available for guest-only assessments.
        parseNumeric(merged.CONTRACEPTIVE_METHOD, 0),
        parseNumeric(merged.MONTH_USE_CURRENT_METHOD, 0),
        parseNumeric(merged.PATTERN_USE, 0),
        parseNumeric(merged.TOLD_ABT_SIDE_EFFECTS, 0),
        parseNumeric(merged.LAST_SOURCE_TYPE, 0),
        encodeValue(merged.LAST_METHOD_DISCONTINUED, LAST_METHOD_MAP, 0),
        encodeValue(merged.REASON_DISCONTINUED, REASON_DISCONTINUED_MAP, 0),
        encodeValue(merged.HSBND_DESIRE_FOR_MORE_CHILDREN, DESIRE_CHILDREN_MAP, 0),
    ];

    return new Float32Array(encoded);
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
