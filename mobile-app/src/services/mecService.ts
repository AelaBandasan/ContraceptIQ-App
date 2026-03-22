/**
 * WHO Medical Eligibility Criteria (MEC) Service
 * Based on WHO MEC 5th Edition (2015)
 * 
 * Categories:
 * 1 = No restriction (safe to use)
 * 2 = Generally safe, benefits outweigh risks
 * 3 = Usually not recommended (risks outweigh benefits)
 * 4 = Contraindicated (unacceptable health risk)
 */

export type MECCategory = 1 | 2 | 3 | 4;

export interface MECResult {
    'Cu-IUD': MECCategory;
    'LNG-IUD': MECCategory;
    'Implant': MECCategory;
    'DMPA': MECCategory;
    'CHC': MECCategory;
    'POP': MECCategory;
}

// Maps form entry keys → primary MEC ID used for eligibility lookup.
// Note: 'Intrauterine Device (IUD)' covers both Cu-IUD and LNG-IUD —
// the assessment layer checks both IUD types separately for eligibility.
// 'Patch' and 'Copper IUD' have been removed (Patch encoded to wrong bin;
// Cu-IUD merged with LNG-IUD into single form entry per training dataset limitations).
export const MODEL_KEY_TO_MEC_ID: Record<string, string> = {
    'Pills': 'CHC',
    'Injectable': 'DMPA',
    'Implant': 'Implant',
    'POP': 'POP',
    'Intrauterine Device (IUD)': 'LNG-IUD',  // primary; Cu-IUD checked in assessment
};

export interface MECInput {
    age: number;
    smokingStatus?: 'never' | 'former' | 'occasional' | 'current_daily';
    cigarettesPerDay?: number;
    // Doctor-only: WHO medical condition toggles
    hypertension?: boolean;
    migrainesWithAura?: boolean;
    breastCancer?: boolean;
    dvtPeHistory?: boolean;
    diabetesWithComplications?: boolean;
    postpartumUnder6Weeks?: boolean;
}

/**
 * WHO Medical Condition definitions for the doctor checklist UI.
 */
export interface MECCondition {
    id: keyof Pick<MECInput, 'hypertension' | 'migrainesWithAura' | 'breastCancer' | 'dvtPeHistory' | 'diabetesWithComplications' | 'postpartumUnder6Weeks'>;
    label: string;
    description: string;
}

export const MEC_CONDITIONS: MECCondition[] = [
    { id: 'hypertension', label: 'Hypertension', description: 'Blood pressure ≥140/90 mmHg' },
    { id: 'migrainesWithAura', label: 'Migraines with Aura', description: 'Recurrent headaches with visual/sensory aura' },
    { id: 'breastCancer', label: 'Current Breast Cancer', description: 'Active or recent breast cancer diagnosis' },
    { id: 'dvtPeHistory', label: 'DVT / PE History', description: 'Deep vein thrombosis or pulmonary embolism' },
    { id: 'diabetesWithComplications', label: 'Diabetes with Complications', description: 'Nephropathy, retinopathy, neuropathy, or vascular disease' },
    { id: 'postpartumUnder6Weeks', label: 'Postpartum (< 6 weeks)', description: 'Delivered within the last 6 weeks' },
];

/**
 * Calculate MEC categories for all contraceptive methods based on patient data.
 * Guest flow: only age + smoking are used (all conditions default false).
 * Doctor flow: toggles medical conditions for WHO-accurate overrides.
 *
 * @param input - Patient characteristics
 * @returns Object mapping method names to their MEC category (1-4)
 */
export function calculateMEC(input: MECInput): MECResult {
    const {
        age,
        smokingStatus = 'never',
        cigarettesPerDay = 0,
        hypertension = false,
        migrainesWithAura = false,
        breastCancer = false,
        dvtPeHistory = false,
        diabetesWithComplications = false,
        postpartumUnder6Weeks = false,
    } = input;

    // ========== BASE CATEGORIES BY AGE ==========

    let cuIUD: MECCategory = age < 18 ? 2 : 1;
    let lngIUD: MECCategory = age < 18 ? 2 : 1;
    let implant: MECCategory = 1;
    let dmpa: MECCategory = (age < 18 || age >= 40) ? 2 : 1;
    let pop: MECCategory = 1;
    let chc: MECCategory = age >= 40 ? 2 : 1;

    // ========== CHC - Smoking Rules ==========
    const isCurrentSmoker = smokingStatus === 'current_daily' || smokingStatus === 'occasional';
    if (isCurrentSmoker) {
        if (age < 35) {
            chc = Math.max(chc, 2) as MECCategory;
        } else {
            chc = cigarettesPerDay >= 15 ? 4 : 3;
        }
    }

    // ========== MEDICAL CONDITION OVERRIDES (WHO 5th Ed.) ==========

    // Hypertension: CHC → 3, DMPA → 2, POP → 2
    if (hypertension) {
        chc = Math.max(chc, 3) as MECCategory;
        dmpa = Math.max(dmpa, 2) as MECCategory;
        pop = Math.max(pop, 2) as MECCategory;
    }

    // Migraines with Aura: CHC → 4, POP → 2
    if (migrainesWithAura) {
        chc = 4;
        pop = Math.max(pop, 2) as MECCategory;
    }

    // Current Breast Cancer: All hormonal → 4, Cu-IUD stays 1
    if (breastCancer) {
        chc = 4;
        pop = 4;
        dmpa = 4;
        implant = 4;
        lngIUD = 4;
        // Cu-IUD unaffected (non-hormonal)
    }

    // DVT/PE History: CHC → 4, POP → 2, DMPA → 3
    if (dvtPeHistory) {
        chc = 4;
        pop = Math.max(pop, 2) as MECCategory;
        dmpa = Math.max(dmpa, 3) as MECCategory;
    }

    // Diabetes with vascular complications: CHC → 3-4, DMPA → 3
    if (diabetesWithComplications) {
        chc = Math.max(chc, 3) as MECCategory;
        dmpa = Math.max(dmpa, 3) as MECCategory;
    }

    // Postpartum < 6 weeks: CHC → 4, DMPA → 3 (if breastfeeding)
    if (postpartumUnder6Weeks) {
        chc = 4;
        dmpa = Math.max(dmpa, 3) as MECCategory;
    }

    return {
        'Cu-IUD': cuIUD,
        'LNG-IUD': lngIUD,
        'Implant': implant,
        'DMPA': dmpa,
        'CHC': chc,
        'POP': pop,
    };
}

/**
 * Get display color for MEC category
 * 1: Green, 2: Yellow, 3: Orange, 4: Red
 */
export function getMECColor(category: MECCategory): string {
    switch (category) {
        case 1: return '#2E7D32'; // Green (Safe)
        case 2: return '#F9A825'; // Yellow (Generally safe)
        case 3: return '#EF6C00'; // Orange (Caution)
        case 4: return '#D32F2F'; // Red (Do not use)
        default: return '#94A3B8';
    }
}

/**
 * Get human-readable label for MEC category
 */
export function getMECLabel(category: MECCategory): string {
    switch (category) {
        case 1: return 'No restriction (Safe to use)';
        case 2: return 'Advantages generally outweigh risks (Generally safe)';
        case 3: return 'Risks usually outweigh advantages (Use with caution)';
        case 4: return 'Unacceptable health risk (Do not use)';
        default: return 'Unknown';
    }
}

/**
 * Method Attributes for Preference Matching
 */
export interface MethodAttributes {
    id: string; // matches mecKey
    name: string;
    isHighlyEffective?: boolean;
    isNonHormonal?: boolean;
    regulatesBleeding?: boolean; // Helping with cramps/regularity
    isPrivate?: boolean;
    isClientControlled?: boolean;
    isLongActing?: boolean;
}

// Define static attributes for all 6 core methods
export const METHOD_ATTRIBUTES: MethodAttributes[] = [
    { id: 'Cu-IUD', name: 'Copper IUD (Cu-IUD)', isHighlyEffective: true, isNonHormonal: true, isLongActing: true, isPrivate: true },
    { id: 'LNG-IUD', name: 'LNG-IUD (Levonorgestrel-IUD)', isHighlyEffective: true, isLongActing: true, isPrivate: true, regulatesBleeding: true },
    { id: 'Implant', name: 'Implant (LNG/ETG)', isHighlyEffective: true, isLongActing: true, isPrivate: true },
    { id: 'DMPA', name: 'Injectable (DMPA)', isPrivate: true, isHighlyEffective: true },
    { id: 'CHC', name: 'Combined Hormonal Contraceptive (CHC)', isClientControlled: true, regulatesBleeding: true },
    { id: 'POP', name: 'Progestogen-only Pill (POP)', isClientControlled: true, isPrivate: true },
];

/**
 * Get display name for model key (e.g. 'Pills' -> 'Combined Hormonal Contraceptive (CHC)')
 */
export function getDisplayNameFromModelKey(modelKey: string): string {
    // Handle legacy 'Patch' key -> display as 'POP'
    if (modelKey === 'Patch') return 'POP';
    // IUD form entry covers both Cu-IUD and LNG-IUD — return the user-facing label directly
    if (modelKey === 'Intrauterine Device (IUD)') return 'Intrauterine Device (IUD)';
    const mecId = MODEL_KEY_TO_MEC_ID[modelKey];
    if (!mecId) return modelKey;
    const attr = METHOD_ATTRIBUTES.find(a => a.id === mecId);
    return attr ? attr.name : modelKey;
}

/**
 * Calculates a match score (0-100%) based on user preferences.
 */
export function calculateMatchScore(methodId: string, userPrefs: string[]): number {
    const attrs = METHOD_ATTRIBUTES.find(m => m.id === methodId);
    if (!attrs || !userPrefs || userPrefs.length === 0) return 0;

    let matches = 0;
    userPrefs.forEach(pref => {
        if (pref === 'effectiveness' && attrs.isHighlyEffective) matches++;
        if (pref === 'nonhormonal' && attrs.isNonHormonal) matches++;
        if (pref === 'regular' && attrs.regulatesBleeding) matches++;
        if (pref === 'privacy' && attrs.isPrivate) matches++;
        if (pref === 'client' && attrs.isClientControlled) matches++;
        if (pref === 'longterm' && attrs.isLongActing) matches++;
    });

    return Math.round((matches / userPrefs.length) * 100);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHO MEC Tool — Full condition-based calculation (OB side only)
// ═══════════════════════════════════════════════════════════════════════════════

import { getBaseByAge, combineConditions, type MethodCategories } from '../data/whoMecData';

export type { MethodCategories };

export interface WhoMecToolInput {
    age: number;
    conditionIds: string[];   // up to 3 condition IDs from WHO_MEC_CONDITIONS
    preferences: string[];    // any of the 7 preference keys
}

export interface WhoMecMethodResult {
    id: string;
    name: string;
    mecCategory: MECCategory;
    matchScore: number;
}

export interface WhoMecToolOutput {
    mecCategories: MethodCategories;
    methods: WhoMecMethodResult[];
    recommended: WhoMecMethodResult[];
    notRecommended: WhoMecMethodResult[];
}

/**
 * Full WHO MEC Tool calculation for the OB side.
 * Takes age, up to 3 conditions, and any number of preferences.
 * Returns categorised methods sorted by safety then preference match.
 */
export function calculateWhoMecTool(input: WhoMecToolInput): WhoMecToolOutput {
    const { age, conditionIds, preferences } = input;

    // 1. Get base categories by age
    const baseCategories = getBaseByAge(age);

    // 2. Apply selected conditions (max rule)
    const mecCategories = combineConditions(baseCategories, conditionIds);

    // 3. Score each method against preferences
    const methods: WhoMecMethodResult[] = METHOD_ATTRIBUTES.map(attr => ({
        id: attr.id,
        name: attr.name,
        mecCategory: mecCategories[attr.id as keyof MethodCategories],
        matchScore: calculateMatchScore(attr.id, preferences),
    }));

    // 4. Sort: lowest MEC category first (safest), then highest match score
    methods.sort((a, b) => {
        if (a.mecCategory !== b.mecCategory) return a.mecCategory - b.mecCategory;
        return b.matchScore - a.matchScore;
    });

    // 5. Split into recommended (cat 1-2) and not recommended (cat 3-4)
    const recommended = methods.filter(m => m.mecCategory <= 2);
    const notRecommended = methods.filter(m => m.mecCategory > 2);

    return { mecCategories, methods, recommended, notRecommended };
}
