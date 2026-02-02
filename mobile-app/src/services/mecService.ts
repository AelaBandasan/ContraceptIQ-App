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

export interface MECInput {
    age: number;
    smokingStatus?: 'never' | 'former' | 'occasional' | 'current_daily';
    cigarettesPerDay?: number;
}

/**
 * Calculate MEC categories for all contraceptive methods based on patient data.
 * 
 * @param input - Patient characteristics (age, smoking status)
 * @returns Object mapping method names to their MEC category (1-4)
 */
export function calculateMEC(input: MECInput): MECResult {
    const { age, smokingStatus = 'never', cigarettesPerDay = 0 } = input;

    // ========== BASE CATEGORIES BY AGE ==========

    // Cu-IUD & LNG-IUD: Category 2 for adolescents (nulliparity concern), else 1
    const cuIUD: MECCategory = age < 18 ? 2 : 1;
    const lngIUD: MECCategory = age < 18 ? 2 : 1;

    // Implant: Generally safe for all ages
    const implant: MECCategory = 1;

    // DMPA (Injectable): Category 2 for <18 and ≥40 (bone density concerns)
    const dmpa: MECCategory = (age < 18 || age >= 40) ? 2 : 1;

    // POP (Progestin-Only Pills): Safe for all ages
    const pop: MECCategory = 1;

    // ========== CHC (Combined Hormonal) - Age + Smoking ==========

    let chc: MECCategory = age >= 40 ? 2 : 1;

    // Apply smoking rules (cardiovascular risk)
    const isCurrentSmoker = smokingStatus === 'current_daily' || smokingStatus === 'occasional';

    if (isCurrentSmoker) {
        if (age < 35) {
            // Smoker under 35: Category 2
            chc = 2;
        } else {
            // Smoker 35+: Category 3 if <15 cig/day, Category 4 if ≥15 cig/day
            chc = cigarettesPerDay >= 15 ? 4 : 3;
        }
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
 */
export function getMECColor(category: MECCategory): string {
    switch (category) {
        case 1: return '#4CAF50'; // Green - Safe
        case 2: return '#FFC107'; // Yellow - Generally safe
        case 3: return '#FF9800'; // Orange - Caution
        case 4: return '#F44336'; // Red - Contraindicated
        default: return '#9E9E9E';
    }
}

/**
 * Get human-readable label for MEC category
 */
export function getMECLabel(category: MECCategory): string {
    switch (category) {
        case 1: return 'Safe';
        case 2: return 'Generally Safe';
        case 3: return 'Use with Caution';
        case 4: return 'Not Recommended';
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
    preventsSTI?: boolean;
    isNonHormonal?: boolean;
    regulatesBleeding?: boolean; // Helping with cramps/regularity
    isPrivate?: boolean;
    isClientControlled?: boolean;
    isLongActing?: boolean;
}

// Define static attributes for all 6 core methods
export const METHOD_ATTRIBUTES: MethodAttributes[] = [
    { id: 'Cu-IUD', name: 'Copper IUD', isHighlyEffective: true, isNonHormonal: true, isLongActing: true, isPrivate: true },
    { id: 'LNG-IUD', name: 'Hormonal IUD', isHighlyEffective: true, isLongActing: true, isPrivate: true, regulatesBleeding: true },
    { id: 'Implant', name: 'Implant', isHighlyEffective: true, isLongActing: true, isPrivate: true },
    { id: 'DMPA', name: 'Injectable', isPrivate: true, isHighlyEffective: true },
    { id: 'CHC', name: 'Combined Hormonal', isClientControlled: true, regulatesBleeding: true },
    { id: 'POP', name: 'Progestin-Only Pill', isClientControlled: true, isPrivate: true },
];

/**
 * Calculates a match score (0-100%) based on user preferences.
 */
export function calculateMatchScore(methodId: string, userPrefs: string[]): number {
    const attrs = METHOD_ATTRIBUTES.find(m => m.id === methodId);
    if (!attrs || !userPrefs || userPrefs.length === 0) return 0;

    let matches = 0;
    userPrefs.forEach(pref => {
        if (pref === 'effectiveness' && attrs.isHighlyEffective) matches++;
        if (pref === 'sti' && attrs.preventsSTI) matches++;
        if (pref === 'nonhormonal' && attrs.isNonHormonal) matches++;
        if (pref === 'regular' && attrs.regulatesBleeding) matches++;
        if (pref === 'privacy' && attrs.isPrivate) matches++;
        if (pref === 'client' && attrs.isClientControlled) matches++;
        if (pref === 'longterm' && attrs.isLongActing) matches++;
    });

    return Math.round((matches / userPrefs.length) * 100);
}
