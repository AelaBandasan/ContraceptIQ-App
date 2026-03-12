/**
 * Feature Encoder — builds the 133-dim float32 OHE vector for v4 ONNX inference.
 *
 * The flat ONNX models (xgb_high_recall.onnx / dt_high_recall.onnx) accept a
 * single FloatTensorType input named "float_input" of shape [1, 133].
 *
 * Layout (matches ColumnTransformer output order):
 *   [  0–  4]  OHE(PATTERN_USE)            5 cats
 *   [  5– 50]  OHE(HUSBAND_AGE)           46 cats
 *   [ 51– 96]  OHE(ETHNICITY)             46 cats
 *   [ 97–100]  OHE(HOUSEHOLD_HEAD_SEX)     4 cats
 *   [101–116]  OHE(CONTRACEPTIVE_METHOD)  16 cats
 *   [117–120]  OHE(SMOKE_CIGAR)            4 cats
 *   [121–130]  OHE(DESIRE_FOR_MORE_CHILDREN) 10 cats
 *   [131]      AGE        (float32)
 *   [132]      PARITY     (float32)
 *
 * Unknown categories encode as all-zeros (sklearn handle_unknown='ignore').
 */

// ============================================================================
// OHE SCHEMA — exact categories from the fitted OneHotEncoder (sorted)
// Any value not in a category list → all-zero block (unknown → ignore)
// ============================================================================

interface OheCol { feat: string; cats: string[] }
interface NumCol { feat: string; isNum: true }
type SchemaEntry = OheCol | NumCol;

const OHE_SCHEMA: SchemaEntry[] = [
    { feat: "PATTERN_USE",              cats: ["1", "Consistent", "Intermittent", "New user", "Stopped recently"] },
    { feat: "HUSBAND_AGE",              cats: ["  ", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "58", "59", "63", "66"] },
    { feat: "ETHNICITY",                cats: ["1", "10", "11", "2", "23", "26", "27", "3", "33", "35", "4", "43", "48", "49", "5", "50", "52", "53", "55", "58", "6", "62", "63", "64", "67", "68", "69", "7", "71", "73", "77", "8", "80", "82", "84", "85", "86", "87", "88", "9", "96", "Bicolano", "Bisaya", "Ilocano", "Others", "Tagalog"] },
    { feat: "HOUSEHOLD_HEAD_SEX",       cats: ["1", "2", "Female", "Male"] },
    { feat: "CONTRACEPTIVE_METHOD",     cats: ["1", "11", "13", "16", "18", "2", "3", "5", "6", "7", "Condom", "IUD", "Implants", "Injectables", "Pills", "Withdrawal"] },
    { feat: "SMOKE_CIGAR",              cats: ["0", "1", "No", "Yes"] },
    { feat: "DESIRE_FOR_MORE_CHILDREN", cats: ["1", "2", "3", "4", "5", "6", "7", "No", "Undecided", "Yes"] },
    { feat: "AGE",    isNum: true },
    { feat: "PARITY", isNum: true },
];

// Total OHE output length (must equal 133)
const N_OHE_FEATURES = OHE_SCHEMA.reduce((acc, e) => acc + ("isNum" in e ? 1 : e.cats.length), 0);

// ============================================================================
// DISPLAY → TRAINING CATEGORY MAPS
// Maps form display strings to the exact string values the model was trained on.
// ============================================================================

/** PATTERN_USE: how the patient currently uses contraception */
const PATTERN_USE_MAP: Record<string, string> = {
    // Display strings → training categories
    "Current/Regular user":                   "1",              // cat__PATTERN_USE_1 (highest SHAP: 4.092)
    "Irregular/Occasional user":              "Intermittent",
    "New user (first time)":                  "New user",
    "Stopped using (within 12 months)":       "Stopped recently",
    // Legacy display strings (backward-compat with saved records)
    "Current user":                           "1",
    "Recent user (stopped within 12 months)": "Stopped recently",
    "Past user (stopped >12 months ago)":     "Intermittent",
    // Numeric fallback codes from legacy encoder
    "1": "1",
    "2": "Stopped recently",
    "3": "Intermittent",
};

/** ETHNICITY */
const ETHNICITY_MAP: Record<string, string> = {
    "Tagalog":              "Tagalog",
    "Ilocano":              "Ilocano",
    "Cebuano":              "Bisaya",
    "Bisaya/Cebuano":       "Bisaya",
    "Bisaya":               "Bisaya",
    "Hiligaynon/Ilonggo":  "Others",
    "Bikol/Bicol":          "Bicolano",
    "Bicolano":             "Bicolano",
    "Waray":               "Others",
    "Kapampangan":          "Others",
    "Pangasinan":           "Others",
    "Other Filipinos":      "Others",
    "Other ethnicity":      "Others",
    // numeric legacy codes
    "1": "Tagalog",
    "2": "Bisaya",
    "3": "Ilocano",
};

/** HOUSEHOLD_HEAD_SEX */
const HOUSEHOLD_HEAD_SEX_MAP: Record<string, string> = {
    "Male":         "Male",
    "Female":       "Female",
    "Shared/Both":  "Male",   // map to majority class
    "Others":       "Male",
    "1": "Male",
    "2": "Female",
    "3": "Male",
    "4": "Male",
};

/** CONTRACEPTIVE_METHOD */
const CONTRACEPTIVE_METHOD_MAP: Record<string, string> = {
    "Pills":                        "Pills",
    "Pill":                         "Pills",
    "Copper IUD":                   "IUD",
    "Intrauterine Device (IUD)":    "IUD",
    "IUD":                          "IUD",
    "Injectable":                   "Injectables",
    "Injectables":                  "Injectables",
    "Implant":                      "Implants",
    "Implants":                     "Implants",
    "Female sterilisation":         "Withdrawal", // map to closest available
    "Male sterilisation":           "Withdrawal",
    "Condom":                       "Condom",
    "NFP/Periodic abstinence":      "Withdrawal",
    "SDM":                          "Withdrawal",
    "LAM":                          "Withdrawal",
    "Patch":                        "Withdrawal",
    "Other modern":                 "Withdrawal",
    "Other traditional":            "Withdrawal",
    "Withdrawal":                   "Withdrawal",
    "None":                         "Withdrawal", // unknown → nearest
    // numeric legacy codes
    "1": "Withdrawal",   // OB None
    "2": "Pills",
    "3": "Condom",
    "4": "IUD",
    "5": "IUD",
    "6": "Implants",
    "7": "Withdrawal",   // Patch
    "8": "Injectables",
    "9": "Withdrawal",
};

/** SMOKE_CIGAR */
const SMOKE_CIGAR_MAP: Record<string, string> = {
    "Never":             "No",
    "No":                "No",
    "Former smoker":     "No",
    "Occasional smoker": "Yes",
    "Current daily":     "Yes",
    "Yes":               "Yes",
    "0": "No",
    "1": "Yes",
};

/** DESIRE_FOR_MORE_CHILDREN */
const DESIRE_FOR_MORE_CHILDREN_MAP: Record<string, string> = {
    "Wants more children":           "Yes",
    "Yes":                           "Yes",
    "Wants no more children":        "No",
    "No":                            "No",
    "Undecided/ambivalent":          "Undecided",
    "Not Sure":                      "Undecided",
    "Sterilised (self or partner)":  "No",  // effectively wants no more
    "Not applicable":                "No",
    "1": "Yes",
    "2": "No",
    "3": "Undecided",
    "4": "No",
    "9": "No",
};

// ============================================================================
// HUSBAND_AGE: round to integer string, clamp to known range
// ============================================================================

const HUSBAND_AGE_KNOWN = new Set([
    "16","17","18","19","20","21","22","23","24","25","26","27","28","29","30",
    "31","32","33","34","35","36","37","38","39","40","41","42","43","44","45",
    "46","47","48","49","50","51","52","53","54","55","56","58","59","63","66",
]);

function encodeHusbandAge(raw: any): string {
    if (raw === undefined || raw === null || raw === "") return "  "; // unknown bucket
    const n = Math.round(parseFloat(String(raw)));
    if (isNaN(n)) return "  ";
    const s = String(n);
    return HUSBAND_AGE_KNOWN.has(s) ? s : "  "; // unknown → all-zeros
}

// ============================================================================
// MAIN ENCODER: buildOHEVector
// ============================================================================

/**
 * Build the 133-dim float32 OHE vector from raw form data.
 *
 * Accepts display strings (from ObAssessment / GuestAssessment form) or
 * numeric codes from mapFormDataToApi.
 *
 * Returns a Float32Array of length 133 ready to pass to the ONNX model as
 * Tensor('float32', vec, [1, 133]).
 */
export function buildOHEVector(formData: Record<string, any>): Float32Array {
    const vec = new Float32Array(N_OHE_FEATURES);
    let offset = 0;

    for (const entry of OHE_SCHEMA) {
        if ("isNum" in entry) {
            const raw = formData[entry.feat];
            const n = (raw === undefined || raw === null || raw === "")
                ? 0.0
                : parseFloat(String(raw));
            vec[offset] = isNaN(n) ? 0.0 : n;
            offset += 1;
        } else {
            const { feat, cats } = entry;
            const raw = formData[feat];

            // Resolve display string → training category
            let trainingVal: string | undefined;

            if (feat === "HUSBAND_AGE") {
                trainingVal = encodeHusbandAge(raw);
            } else {
                const displayMap = DISPLAY_MAPS[feat];
                const rawStr = raw === undefined || raw === null ? "" : String(raw);
                trainingVal = displayMap ? displayMap[rawStr] : rawStr;
            }

            // One-hot encode
            if (trainingVal !== undefined && trainingVal !== "") {
                const idx = cats.indexOf(trainingVal);
                if (idx >= 0) {
                    vec[offset + idx] = 1.0;
                }
                // unknown → all zeros (handle_unknown='ignore')
            }

            offset += cats.length;
        }
    }

    return vec;
}

// Map from feature name → display-to-training map
const DISPLAY_MAPS: Record<string, Record<string, string>> = {
    PATTERN_USE:              PATTERN_USE_MAP,
    ETHNICITY:                ETHNICITY_MAP,
    HOUSEHOLD_HEAD_SEX:       HOUSEHOLD_HEAD_SEX_MAP,
    CONTRACEPTIVE_METHOD:     CONTRACEPTIVE_METHOD_MAP,
    SMOKE_CIGAR:              SMOKE_CIGAR_MAP,
    DESIRE_FOR_MORE_CHILDREN: DESIRE_FOR_MORE_CHILDREN_MAP,
};

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Validate that minimum required v4 features are present.
 * Returns array of missing field names (empty = all good).
 */
export function validateFeaturesV4(formData: Record<string, any>): string[] {
    const required = [
        "AGE", "ETHNICITY", "HOUSEHOLD_HEAD_SEX",
        "SMOKE_CIGAR", "DESIRE_FOR_MORE_CHILDREN", "PARITY",
    ];
    return required.filter(
        key => formData[key] === undefined || formData[key] === null || formData[key] === "",
    );
}

// ============================================================================
// LEGACY EXPORTS (kept for any remaining imports — now unused for inference)
// ============================================================================

export const N_FLAT_FEATURES = N_OHE_FEATURES; // 133
