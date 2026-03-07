/**
 * Feature Encoder — maps human-readable form values to numeric codes
 *
 * v4 (9-feature reduced_C model): encodeFeaturesV4()
 *   Returns per-column named string/float values for the ONNX per-column input format.
 *   ETHNICITY, HOUSEHOLD_HEAD_SEX, CONTRACEPTIVE_METHOD, SMOKE_CIGAR,
 *   DESIRE_FOR_MORE_CHILDREN, PATTERN_USE → string tensors (numeric codes as strings).
 *   AGE, PARITY → float32 tensors.
 *   HUSBAND_AGE → string tensor (numeric value as string, treated as categorical in training).
 */

// ============================================================================
// V4 ENCODING MAPS
// Maps display strings AND OB numeric codes (from mapFormDataToApi) → v4 training codes.
// ============================================================================

/**
 * PATTERN_USE: how the patient currently uses contraception.
 * v4 training: 1=Current user, 2=Recent user (stopped <12 months), 3=Past user (stopped >12 months)
 * OB form options: 'Current user', 'Recent user (stopped within 12 months)', 'Past user (stopped >12 months ago)'
 * OB numeric fallback (1=Current, 2=Recent, 3=Past — same 1-based index, passthrough safe)
 */
export const PATTERN_USE_V4: Record<string, string> = {
    'Current user': '1',
    'Recent user (stopped within 12 months)': '2',
    'Past user (stopped >12 months ago)': '3',
    '1': '1', '2': '2', '3': '3',
};

/**
 * ETHNICITY
 * v4 training: 1=Tagalog, 2=Ilocano, 3=Bisaya/Cebuano, 4=Hiligaynon/Ilonggo,
 *              5=Bikol/Bicol, 6=Waray, 7=Kapampangan, 8=Pangasinan,
 *              9=Other Filipinos, 10=Other ethnicity
 * OB numeric fallback: getIndex on ['Tagalog', 'Cebuano', 'Ilocano'] → 1, 2, 3
 *   OB 1=Tagalog→v4 '1', OB 2=Cebuano→v4 '3', OB 3=Ilocano→v4 '2'
 */
export const ETHNICITY_V4: Record<string, string> = {
    'Tagalog': '1',
    'Ilocano': '2',
    'Cebuano': '3', 'Bisaya/Cebuano': '3',
    'Hiligaynon/Ilonggo': '4',
    'Bikol/Bicol': '5',
    'Waray': '6',
    'Kapampangan': '7',
    'Pangasinan': '8',
    'Other Filipinos': '9',
    'Other ethnicity': '10',
    // OB numeric codes
    '1': '1', '2': '3', '3': '2',
};

/**
 * HOUSEHOLD_HEAD_SEX
 * v4 training: 1=Male, 2=Female
 * OB numeric fallback: getIndex on ['Male', 'Female', 'Shared/Both', 'Others'] → 1,2,3,4
 */
export const HOUSEHOLD_HEAD_SEX_V4: Record<string, string> = {
    'Male': '1', 'Female': '2', 'Shared/Both': '1', 'Others': '1',
    '1': '1', '2': '2', '3': '1', '4': '1',
};

/**
 * CONTRACEPTIVE_METHOD
 * v4 training: 1=Pill, 2=IUD, 3=Injectable, 4=Implant, 5=Female sterilisation,
 *              6=Male sterilisation, 7=Condom, 8=NFP/Periodic abstinence, 9=SDM,
 *              10=LAM, 11=Other modern, 12=Other traditional
 * OB numeric fallback: getIndex on ['None','Pills','Condom','Copper IUD','Intrauterine Device (IUD)',
 *                                    'Implant','Patch','Injectable','Withdrawal']
 *   → 1=None, 2=Pills, 3=Condom, 4=Copper IUD, 5=IUD, 6=Implant, 7=Patch, 8=Injectable, 9=Withdrawal
 */
export const CONTRACEPTIVE_METHOD_V4: Record<string, string> = {
    // Display strings
    'Pill': '1', 'Pills': '1',
    'IUD': '2', 'Copper IUD': '2', 'Intrauterine Device (IUD)': '2',
    'Injectable': '3',
    'Implant': '4',
    'Female sterilisation': '5',
    'Male sterilisation': '6',
    'Condom': '7',
    'NFP/Periodic abstinence': '8',
    'SDM': '9',
    'LAM': '10',
    'Patch': '11', 'Other modern': '11', 'None': '11',
    'Withdrawal': '12', 'Other traditional': '12',
    // OB numeric codes
    '1': '11',  // OB None → Other modern
    '2': '1',   // OB Pills → Pill
    '3': '7',   // OB Condom → Condom
    '4': '2',   // OB Copper IUD → IUD
    '5': '2',   // OB IUD → IUD
    '6': '4',   // OB Implant → Implant
    '7': '11',  // OB Patch → Other modern
    '8': '3',   // OB Injectable → Injectable
    '9': '12',  // OB Withdrawal → Other traditional
};

/**
 * SMOKE_CIGAR
 * v4 training: 0=No, 1=Yes (binary)
 */
export const SMOKE_CIGAR_V4: Record<string, string> = {
    'Never': '0', 'No': '0', 'Former smoker': '0',
    'Occasional smoker': '1', 'Current daily': '1', 'Yes': '1',
    '0': '0', '1': '1',
};

/**
 * DESIRE_FOR_MORE_CHILDREN
 * v4 training: 1=Wants more children, 2=Wants no more children,
 *              3=Undecided/ambivalent, 4=Sterilised, 9=Not applicable
 */
export const DESIRE_FOR_MORE_CHILDREN_V4: Record<string, string> = {
    'Wants more children': '1', 'Yes': '1',
    'Wants no more children': '2', 'No': '2',
    'Undecided/ambivalent': '3', 'Not Sure': '3',
    'Sterilised (self or partner)': '4',
    'Not applicable': '9',
    '1': '1', '2': '2', '3': '3', '4': '4', '9': '9',
};

// ============================================================================
// V4 FEATURE INTERFACE
// ============================================================================

export interface V4Features {
    /** string tensor — numeric code '1'/'2'/'3' */
    PATTERN_USE: string;
    /** string tensor — raw number as string, e.g. '30' */
    HUSBAND_AGE: string;
    /** float32 */
    AGE: number;
    /** string tensor — numeric code '1'–'10' */
    ETHNICITY: string;
    /** string tensor — '1' (Male) or '2' (Female) */
    HOUSEHOLD_HEAD_SEX: string;
    /** string tensor — numeric code '1'–'12' */
    CONTRACEPTIVE_METHOD: string;
    /** string tensor — '0' (No) or '1' (Yes) */
    SMOKE_CIGAR: string;
    /** string tensor — numeric code '1'/'2'/'3'/'4'/'9' */
    DESIRE_FOR_MORE_CHILDREN: string;
    /** float32 */
    PARITY: number;
}

// ============================================================================
// V4 ENCODER
// ============================================================================

/**
 * Encode raw form data into V4Features for the 9-feature ONNX model.
 *
 * Accepts both:
 *  - Human-readable display strings (from GuestAssessment formData)
 *  - Numeric codes (from ObAssessment's mapFormDataToApi, passed via assessOffline)
 *
 * Missing features fall back to sensible defaults derived from the training data.
 */
export function encodeFeaturesV4(formData: Record<string, any>): V4Features {
    const strLookup = (
        key: string,
        map: Record<string, string>,
        fallback: string,
    ): string => {
        const val = formData[key];
        if (val === undefined || val === null || val === '') return fallback;
        const s = String(val);
        return map[s] ?? fallback;
    };

    const numVal = (key: string, fallback: number): number => {
        const val = formData[key];
        if (val === undefined || val === null || val === '') return fallback;
        const n = parseFloat(String(val));
        return isNaN(n) ? fallback : n;
    };

    return {
        // PATTERN_USE: default '1' (current user) if not provided (guest path)
        PATTERN_USE: strLookup('PATTERN_USE', PATTERN_USE_V4, '1'),
        // HUSBAND_AGE is continuous but treated as categorical string in ONNX
        HUSBAND_AGE: String(Math.round(numVal('HUSBAND_AGE', 30))),
        AGE: numVal('AGE', 25),
        ETHNICITY: strLookup('ETHNICITY', ETHNICITY_V4, '1'),
        HOUSEHOLD_HEAD_SEX: strLookup('HOUSEHOLD_HEAD_SEX', HOUSEHOLD_HEAD_SEX_V4, '1'),
        // CONTRACEPTIVE_METHOD: default '1' (Pill) if not provided (guest path)
        CONTRACEPTIVE_METHOD: strLookup('CONTRACEPTIVE_METHOD', CONTRACEPTIVE_METHOD_V4, '1'),
        SMOKE_CIGAR: strLookup('SMOKE_CIGAR', SMOKE_CIGAR_V4, '0'),
        DESIRE_FOR_MORE_CHILDREN: strLookup('DESIRE_FOR_MORE_CHILDREN', DESIRE_FOR_MORE_CHILDREN_V4, '1'),
        PARITY: numVal('PARITY', 0),
    };
}

/**
 * Validate that the minimum required v4 features are present.
 * Returns array of missing field names (empty = all good).
 */
export function validateFeaturesV4(formData: Record<string, any>): string[] {
    const required = ['AGE', 'ETHNICITY', 'HOUSEHOLD_HEAD_SEX', 'SMOKE_CIGAR', 'DESIRE_FOR_MORE_CHILDREN', 'PARITY'];
    return required.filter(key => formData[key] === undefined || formData[key] === null || formData[key] === '');
}
