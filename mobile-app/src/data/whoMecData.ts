/**
 * WHO Medical Eligibility Criteria (MEC) Complete Condition Database
 * Based on WHO MEC 5th Edition (2015) — the same edition used by the WHO Contraception Tool app.
 *
 * Each condition/sub-condition maps to MEC categories (1–4) for 6 contraceptive methods:
 *   Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC
 *
 * Combination rule: when multiple conditions are selected, take the MOST RESTRICTIVE
 * (highest) category for each method across all selected conditions.
 *
 * Category meanings:
 *   1 = No restriction for use
 *   2 = Advantages generally outweigh risks
 *   3 = Risks usually outweigh advantages (use with caution)
 *   4 = Unacceptable health risk (do not use)
 */

import { MECCategory } from '../services/mecService';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MethodCategories {
  'Cu-IUD': MECCategory;
  'LNG-IUD': MECCategory;
  'Implant': MECCategory;
  'DMPA': MECCategory;
  'POP': MECCategory;
  'CHC': MECCategory;
}

export interface MecConditionEntry {
  /** Unique identifier for this sub-condition */
  id: string;
  /** Display group in the UI */
  group: MecConditionGroup;
  /** Parent condition name */
  condition: string;
  /** Sub-condition label (if applicable) */
  subCondition?: string;
  /** Short clinical description for the OB */
  description: string;
  /** MEC categories for each method */
  categories: MethodCategories;
  /** Notes from WHO guidelines */
  notes?: string;
}

export type MecConditionGroup =
  | 'Personal Characteristics'
  | 'Cardiovascular'
  | 'Neurological'
  | 'Reproductive / Breast'
  | 'Infections'
  | 'Endocrine'
  | 'Gastrointestinal / Hepatic'
  | 'Autoimmune / Other'
  | 'Drug Interactions';

// ─── Age group helper ────────────────────────────────────────────────────────

export type AgeGroup = '<18' | '18-39' | '>=40';

export function getAgeGroup(age: number): AgeGroup {
  if (age < 18) return '<18';
  if (age <= 39) return '18-39';
  return '>=40';
}

/**
 * Base MEC categories determined solely by age.
 * These serve as the starting point before condition overrides.
 */
export function getBaseByAge(age: number): MethodCategories {
  if (age < 18) {
    return { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 2, 'POP': 1, 'CHC': 1 };
  }
  if (age <= 39) {
    return { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 };
  }
  // age >= 40
  return { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 2, 'POP': 1, 'CHC': 2 };
}

// ─── Complete WHO MEC Condition Database ─────────────────────────────────────

export const WHO_MEC_CONDITIONS: MecConditionEntry[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONAL CHARACTERISTICS
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Postpartum (Breastfeeding) ---
  {
    id: 'pp_bf_lt6w',
    group: 'Personal Characteristics',
    condition: 'Postpartum (Breastfeeding)',
    subCondition: '< 6 weeks postpartum',
    description: 'Breastfeeding and delivered within the last 6 weeks',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 4 },
    notes: 'CHC contraindicated due to estrogen effect on milk supply and neonatal exposure',
  },
  {
    id: 'pp_bf_6w_6m',
    group: 'Personal Characteristics',
    condition: 'Postpartum (Breastfeeding)',
    subCondition: '6 weeks to < 6 months postpartum',
    description: 'Breastfeeding and 6 weeks to 6 months after delivery',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 3 },
  },
  {
    id: 'pp_bf_gte6m',
    group: 'Personal Characteristics',
    condition: 'Postpartum (Breastfeeding)',
    subCondition: '≥ 6 months postpartum',
    description: 'Breastfeeding and 6+ months after delivery',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },

  // --- Postpartum (Non-Breastfeeding) ---
  {
    id: 'pp_nbf_lt21d',
    group: 'Personal Characteristics',
    condition: 'Postpartum (Non-Breastfeeding)',
    subCondition: '< 21 days postpartum',
    description: 'Not breastfeeding and less than 21 days after delivery',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 4 },
    notes: 'High VTE risk in early postpartum period',
  },
  {
    id: 'pp_nbf_21_42d_no_vte',
    group: 'Personal Characteristics',
    condition: 'Postpartum (Non-Breastfeeding)',
    subCondition: '21–42 days, no VTE risk factors',
    description: 'Not breastfeeding, 21–42 days postpartum, no additional VTE risk',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },
  {
    id: 'pp_nbf_21_42d_vte',
    group: 'Personal Characteristics',
    condition: 'Postpartum (Non-Breastfeeding)',
    subCondition: '21–42 days, with VTE risk factors',
    description: 'Not breastfeeding, 21–42 days postpartum, with additional VTE risk',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 3 },
  },
  {
    id: 'pp_nbf_gt42d',
    group: 'Personal Characteristics',
    condition: 'Postpartum (Non-Breastfeeding)',
    subCondition: '> 42 days postpartum',
    description: 'Not breastfeeding and more than 42 days after delivery',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // --- Post-abortion ---
  {
    id: 'post_abortion_1st',
    group: 'Personal Characteristics',
    condition: 'Post-abortion',
    subCondition: 'First trimester',
    description: 'After first-trimester abortion',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'post_abortion_2nd',
    group: 'Personal Characteristics',
    condition: 'Post-abortion',
    subCondition: 'Second trimester',
    description: 'After second-trimester abortion',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'post_abortion_septic',
    group: 'Personal Characteristics',
    condition: 'Post-abortion',
    subCondition: 'Post-septic abortion',
    description: 'Post-abortion complicated by sepsis',
    categories: { 'Cu-IUD': 4, 'LNG-IUD': 4, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // --- Smoking ---
  {
    id: 'smoking_lt35',
    group: 'Personal Characteristics',
    condition: 'Smoking',
    subCondition: 'Age < 35',
    description: 'Current smoker under age 35',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },
  {
    id: 'smoking_gte35_lt15',
    group: 'Personal Characteristics',
    condition: 'Smoking',
    subCondition: 'Age ≥ 35, < 15 cigarettes/day',
    description: 'Current smoker age 35+, less than 15 cigarettes per day',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 3 },
  },
  {
    id: 'smoking_gte35_gte15',
    group: 'Personal Characteristics',
    condition: 'Smoking',
    subCondition: 'Age ≥ 35, ≥ 15 cigarettes/day',
    description: 'Current smoker age 35+, 15 or more cigarettes per day',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 4 },
  },

  // --- Obesity ---
  {
    id: 'obesity',
    group: 'Personal Characteristics',
    condition: 'Obesity',
    subCondition: 'BMI ≥ 30 kg/m²',
    description: 'Body mass index 30 or greater',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 2, 'POP': 1, 'CHC': 2 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARDIOVASCULAR
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Hypertension ---
  {
    id: 'htn_controlled',
    group: 'Cardiovascular',
    condition: 'Hypertension',
    subCondition: 'Adequately controlled',
    description: 'Blood pressure adequately controlled with medication',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 2, 'POP': 1, 'CHC': 3 },
  },
  {
    id: 'htn_140_159',
    group: 'Cardiovascular',
    condition: 'Hypertension',
    subCondition: 'Systolic 140–159 or Diastolic 90–99',
    description: 'Elevated blood pressure (140–159 / 90–99 mmHg)',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 2, 'POP': 1, 'CHC': 3 },
  },
  {
    id: 'htn_gte160',
    group: 'Cardiovascular',
    condition: 'Hypertension',
    subCondition: 'Systolic ≥ 160 or Diastolic ≥ 100',
    description: 'Severely elevated blood pressure (≥160 / ≥100 mmHg)',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 3, 'POP': 2, 'CHC': 4 },
  },
  {
    id: 'htn_vascular',
    group: 'Cardiovascular',
    condition: 'Hypertension',
    subCondition: 'With vascular disease',
    description: 'Hypertension with vascular disease',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 3, 'POP': 2, 'CHC': 4 },
  },

  // --- History of high BP during pregnancy ---
  {
    id: 'htn_pregnancy_history',
    group: 'Cardiovascular',
    condition: 'History of high BP during pregnancy',
    description: 'History of pregnancy-induced hypertension (normal current BP)',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },

  // --- DVT / PE ---
  {
    id: 'dvt_history',
    group: 'Cardiovascular',
    condition: 'DVT / Pulmonary Embolism',
    subCondition: 'History of DVT/PE',
    description: 'Past deep vein thrombosis or pulmonary embolism',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 4 },
  },
  {
    id: 'dvt_current',
    group: 'Cardiovascular',
    condition: 'DVT / Pulmonary Embolism',
    subCondition: 'Current DVT/PE',
    description: 'Active deep vein thrombosis or pulmonary embolism',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 3, 'Implant': 3, 'DMPA': 3, 'POP': 3, 'CHC': 4 },
  },
  {
    id: 'dvt_family_history',
    group: 'Cardiovascular',
    condition: 'DVT / Pulmonary Embolism',
    subCondition: 'Family history only (first-degree)',
    description: 'Family history of DVT/PE in first-degree relative',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },
  {
    id: 'thrombogenic_mutations',
    group: 'Cardiovascular',
    condition: 'DVT / Pulmonary Embolism',
    subCondition: 'Known thrombogenic mutations',
    description: 'Known thrombogenic mutations (e.g., Factor V Leiden, Prothrombin mutation)',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 4 },
  },

  // --- Surgery ---
  {
    id: 'surgery_immobilization',
    group: 'Cardiovascular',
    condition: 'Major surgery',
    subCondition: 'With prolonged immobilization',
    description: 'Major surgery requiring prolonged immobilization',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 4 },
  },
  {
    id: 'surgery_no_immobilization',
    group: 'Cardiovascular',
    condition: 'Major surgery',
    subCondition: 'Without prolonged immobilization',
    description: 'Major surgery without prolonged immobilization',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },

  // --- Superficial venous thrombosis ---
  {
    id: 'svt',
    group: 'Cardiovascular',
    condition: 'Superficial venous thrombosis',
    description: 'Superficial venous disorders including varicose veins',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },

  // --- Ischaemic heart disease ---
  {
    id: 'ihd',
    group: 'Cardiovascular',
    condition: 'Ischaemic heart disease',
    description: 'Current or history of ischaemic heart disease',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 3, 'POP': 2, 'CHC': 4 },
  },

  // --- Stroke ---
  {
    id: 'stroke',
    group: 'Cardiovascular',
    condition: 'Stroke',
    description: 'History of cerebrovascular accident (stroke)',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 3, 'POP': 2, 'CHC': 4 },
  },

  // --- Dyslipidaemias ---
  {
    id: 'dyslipidaemia',
    group: 'Cardiovascular',
    condition: 'Known dyslipidaemias',
    description: 'Known dyslipidaemias without other cardiovascular risk factors',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 2 },
  },

  // --- Valvular heart disease ---
  {
    id: 'vhd_uncomplicated',
    group: 'Cardiovascular',
    condition: 'Valvular heart disease',
    subCondition: 'Uncomplicated',
    description: 'Uncomplicated valvular heart disease',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },
  {
    id: 'vhd_complicated',
    group: 'Cardiovascular',
    condition: 'Valvular heart disease',
    subCondition: 'Complicated',
    description: 'Complicated valvular heart disease (pulmonary hypertension, atrial fibrillation, history of subacute bacterial endocarditis)',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 4 },
  },

  // --- Peripartum cardiomyopathy ---
  {
    id: 'ppcm_lt6m_normal',
    group: 'Cardiovascular',
    condition: 'Peripartum cardiomyopathy',
    subCondition: '< 6 months, normal/mildly impaired cardiac function',
    description: 'Peripartum cardiomyopathy within 6 months, normal or mildly impaired function',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 4 },
  },
  {
    id: 'ppcm_lt6m_impaired',
    group: 'Cardiovascular',
    condition: 'Peripartum cardiomyopathy',
    subCondition: '< 6 months, moderately or severely impaired',
    description: 'Peripartum cardiomyopathy within 6 months, moderately/severely impaired function',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 4 },
  },
  {
    id: 'ppcm_gte6m_normal',
    group: 'Cardiovascular',
    condition: 'Peripartum cardiomyopathy',
    subCondition: '≥ 6 months, normal/mildly impaired cardiac function',
    description: 'Peripartum cardiomyopathy 6+ months, normal or mildly impaired function',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },
  {
    id: 'ppcm_gte6m_impaired',
    group: 'Cardiovascular',
    condition: 'Peripartum cardiomyopathy',
    subCondition: '≥ 6 months, moderately or severely impaired',
    description: 'Peripartum cardiomyopathy 6+ months, moderately/severely impaired function',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 4 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEUROLOGICAL
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Headaches ---
  {
    id: 'headache_nonmigraine',
    group: 'Neurological',
    condition: 'Headaches',
    subCondition: 'Non-migrainous',
    description: 'Non-migrainous headaches (mild or severe)',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },
  {
    id: 'migraine_no_aura_lt35',
    group: 'Neurological',
    condition: 'Headaches',
    subCondition: 'Migraine without aura, age < 35',
    description: 'Migraine without aura in patient under 35',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 1, 'CHC': 2 },
  },
  {
    id: 'migraine_no_aura_gte35',
    group: 'Neurological',
    condition: 'Headaches',
    subCondition: 'Migraine without aura, age ≥ 35',
    description: 'Migraine without aura in patient 35 or older',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 1, 'CHC': 3 },
  },
  {
    id: 'migraine_with_aura',
    group: 'Neurological',
    condition: 'Headaches',
    subCondition: 'Migraine with aura (any age)',
    description: 'Migraine with aura at any age',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 4 },
  },

  // --- Epilepsy ---
  {
    id: 'epilepsy',
    group: 'Neurological',
    condition: 'Epilepsy',
    description: 'Epilepsy (condition itself, not anticonvulsant drug interactions)',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
    notes: 'Certain anticonvulsants interact with hormonal methods — see Drug Interactions',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REPRODUCTIVE / BREAST
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Vaginal bleeding ---
  {
    id: 'vaginal_bleeding_irregular',
    group: 'Reproductive / Breast',
    condition: 'Vaginal bleeding patterns',
    subCondition: 'Irregular pattern without heavy bleeding',
    description: 'Irregular menstrual patterns without heavy bleeding',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 2, 'POP': 2, 'CHC': 1 },
  },
  {
    id: 'vaginal_bleeding_heavy',
    group: 'Reproductive / Breast',
    condition: 'Vaginal bleeding patterns',
    subCondition: 'Heavy or prolonged (including regular & irregular)',
    description: 'Heavy or prolonged menstrual bleeding',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'vaginal_bleeding_unexplained',
    group: 'Reproductive / Breast',
    condition: 'Unexplained vaginal bleeding',
    description: 'Unexplained vaginal bleeding suspicious for serious condition (before evaluation)',
    categories: { 'Cu-IUD': 4, 'LNG-IUD': 4, 'Implant': 3, 'DMPA': 3, 'POP': 3, 'CHC': 3 },
    notes: 'Evaluate before initiating any method',
  },

  // --- Cervical conditions ---
  {
    id: 'cervical_cancer',
    group: 'Reproductive / Breast',
    condition: 'Cervical cancer',
    description: 'Cervical cancer awaiting treatment',
    categories: { 'Cu-IUD': 4, 'LNG-IUD': 4, 'Implant': 2, 'DMPA': 2, 'POP': 1, 'CHC': 2 },
  },

  // --- Breast disease ---
  {
    id: 'breast_undiagnosed_mass',
    group: 'Reproductive / Breast',
    condition: 'Breast disease',
    subCondition: 'Undiagnosed mass',
    description: 'Undiagnosed breast mass',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 2 },
  },
  {
    id: 'breast_cancer_current',
    group: 'Reproductive / Breast',
    condition: 'Breast disease',
    subCondition: 'Current breast cancer',
    description: 'Active or current breast cancer',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 4, 'Implant': 4, 'DMPA': 4, 'POP': 4, 'CHC': 4 },
  },
  {
    id: 'breast_cancer_past',
    group: 'Reproductive / Breast',
    condition: 'Breast disease',
    subCondition: 'Past breast cancer, no evidence for 5 years',
    description: 'Past breast cancer with no evidence of recurrence for 5 years',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 3, 'Implant': 3, 'DMPA': 3, 'POP': 3, 'CHC': 3 },
  },

  // --- Endometrial cancer ---
  {
    id: 'endometrial_cancer',
    group: 'Reproductive / Breast',
    condition: 'Endometrial cancer',
    description: 'Endometrial cancer awaiting treatment',
    categories: { 'Cu-IUD': 4, 'LNG-IUD': 4, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // --- Ovarian cancer ---
  {
    id: 'ovarian_cancer',
    group: 'Reproductive / Breast',
    condition: 'Ovarian cancer',
    description: 'Ovarian cancer',
    categories: { 'Cu-IUD': 3, 'LNG-IUD': 3, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // --- Uterine fibroids ---
  {
    id: 'fibroids_no_distortion',
    group: 'Reproductive / Breast',
    condition: 'Uterine fibroids',
    subCondition: 'Without uterine cavity distortion',
    description: 'Uterine fibroids without distortion of the uterine cavity',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'fibroids_with_distortion',
    group: 'Reproductive / Breast',
    condition: 'Uterine fibroids',
    subCondition: 'With uterine cavity distortion',
    description: 'Uterine fibroids with distortion of the uterine cavity',
    categories: { 'Cu-IUD': 4, 'LNG-IUD': 4, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // --- PID ---
  {
    id: 'pid_current',
    group: 'Reproductive / Breast',
    condition: 'Pelvic inflammatory disease',
    subCondition: 'Current PID',
    description: 'Current pelvic inflammatory disease',
    categories: { 'Cu-IUD': 4, 'LNG-IUD': 4, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // --- STIs ---
  {
    id: 'sti_current_purulent',
    group: 'Reproductive / Breast',
    condition: 'Sexually transmitted infections',
    subCondition: 'Current purulent cervicitis, chlamydia, or gonorrhoea',
    description: 'Current purulent cervicitis or chlamydial/gonococcal infection',
    categories: { 'Cu-IUD': 4, 'LNG-IUD': 4, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'sti_increased_risk',
    group: 'Reproductive / Breast',
    condition: 'Sexually transmitted infections',
    subCondition: 'Increased risk of STIs',
    description: 'Increased risk of sexually transmitted infections (e.g., multiple partners)',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INFECTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // --- HIV ---
  {
    id: 'hiv_high_risk',
    group: 'Infections',
    condition: 'HIV',
    subCondition: 'High risk of HIV',
    description: 'At high risk of HIV infection',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'hiv_infected',
    group: 'Infections',
    condition: 'HIV',
    subCondition: 'HIV infected (WHO Stage 1-2)',
    description: 'HIV-infected, clinically well (WHO Stage 1 or 2)',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'hiv_aids',
    group: 'Infections',
    condition: 'HIV',
    subCondition: 'AIDS',
    description: 'AIDS (WHO Stage 3 or 4)',
    categories: { 'Cu-IUD': 3, 'LNG-IUD': 3, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
    notes: 'IUD insertion not recommended; can continue if already using',
  },

  // --- Tuberculosis ---
  {
    id: 'tb_pelvic',
    group: 'Infections',
    condition: 'Tuberculosis',
    subCondition: 'Pelvic tuberculosis',
    description: 'Known pelvic tuberculosis',
    categories: { 'Cu-IUD': 4, 'LNG-IUD': 4, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'tb_nonpelvic',
    group: 'Infections',
    condition: 'Tuberculosis',
    subCondition: 'Non-pelvic tuberculosis',
    description: 'Non-pelvic tuberculosis',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
    notes: 'Rifampicin interaction — see Drug Interactions',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENDOCRINE
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Diabetes ---
  {
    id: 'diabetes_gestational_history',
    group: 'Endocrine',
    condition: 'Diabetes',
    subCondition: 'History of gestational diabetes',
    description: 'History of gestational diabetes only',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'diabetes_no_vascular',
    group: 'Endocrine',
    condition: 'Diabetes',
    subCondition: 'Non-insulin or insulin dependent, no vascular disease',
    description: 'Diabetes without vascular disease, nephropathy, retinopathy, or neuropathy',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 2 },
  },
  {
    id: 'diabetes_vascular',
    group: 'Endocrine',
    condition: 'Diabetes',
    subCondition: 'Nephropathy, retinopathy, neuropathy, or other vascular disease, or > 20 years duration',
    description: 'Diabetes with vascular complications or > 20 years duration',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 3, 'POP': 2, 'CHC': 3 },
  },

  // --- Thyroid ---
  {
    id: 'thyroid',
    group: 'Endocrine',
    condition: 'Thyroid disorders',
    description: 'Simple goitre, hyperthyroid, or hypothyroid',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GASTROINTESTINAL / HEPATIC
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Gallbladder ---
  {
    id: 'gallbladder_cholecystectomy',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Gallbladder disease',
    subCondition: 'Symptomatic, treated by cholecystectomy',
    description: 'Symptomatic gallbladder disease treated by cholecystectomy',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 2 },
  },
  {
    id: 'gallbladder_medically_treated',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Gallbladder disease',
    subCondition: 'Symptomatic, medically treated',
    description: 'Symptomatic gallbladder disease medically treated',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 3 },
  },
  {
    id: 'gallbladder_current',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Gallbladder disease',
    subCondition: 'Current symptomatic',
    description: 'Current symptomatic gallbladder disease',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 3 },
  },

  // --- Cholestasis ---
  {
    id: 'cholestasis_pregnancy',
    group: 'Gastrointestinal / Hepatic',
    condition: 'History of cholestasis',
    subCondition: 'Pregnancy-related',
    description: 'History of cholestasis related to pregnancy',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },
  {
    id: 'cholestasis_coc',
    group: 'Gastrointestinal / Hepatic',
    condition: 'History of cholestasis',
    subCondition: 'COC-related',
    description: 'History of cholestasis related to past COC use',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 3 },
  },

  // --- Viral hepatitis ---
  {
    id: 'hepatitis_acute',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Viral hepatitis',
    subCondition: 'Acute or flare',
    description: 'Acute viral hepatitis or hepatitis flare',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 3 },
  },
  {
    id: 'hepatitis_carrier',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Viral hepatitis',
    subCondition: 'Carrier',
    description: 'Hepatitis virus carrier',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // --- Cirrhosis ---
  {
    id: 'cirrhosis_mild',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Cirrhosis',
    subCondition: 'Mild (compensated)',
    description: 'Mild (compensated) cirrhosis',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'cirrhosis_severe',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Cirrhosis',
    subCondition: 'Severe (decompensated)',
    description: 'Severe (decompensated) cirrhosis',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 3, 'Implant': 3, 'DMPA': 3, 'POP': 3, 'CHC': 4 },
  },

  // --- Liver tumours ---
  {
    id: 'liver_tumour_benign',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Liver tumours',
    subCondition: 'Benign (hepatocellular adenoma)',
    description: 'Benign hepatocellular adenoma',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 3, 'Implant': 3, 'DMPA': 3, 'POP': 3, 'CHC': 4 },
  },
  {
    id: 'liver_tumour_malignant',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Liver tumours',
    subCondition: 'Malignant (hepatocellular carcinoma)',
    description: 'Malignant liver tumour (hepatocellular carcinoma)',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 3, 'Implant': 3, 'DMPA': 3, 'POP': 3, 'CHC': 4 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOIMMUNE / OTHER
  // ═══════════════════════════════════════════════════════════════════════════

  // --- SLE ---
  {
    id: 'sle_antiphospholipid',
    group: 'Autoimmune / Other',
    condition: 'Systemic lupus erythematosus (SLE)',
    subCondition: 'Positive/unknown antiphospholipid antibodies',
    description: 'SLE with positive or unknown antiphospholipid antibodies',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 3, 'Implant': 3, 'DMPA': 3, 'POP': 3, 'CHC': 4 },
  },
  {
    id: 'sle_thrombocytopenia',
    group: 'Autoimmune / Other',
    condition: 'Systemic lupus erythematosus (SLE)',
    subCondition: 'Severe thrombocytopenia',
    description: 'SLE with severe thrombocytopenia',
    categories: { 'Cu-IUD': 3, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 2 },
  },
  {
    id: 'sle_immunosuppressive',
    group: 'Autoimmune / Other',
    condition: 'Systemic lupus erythematosus (SLE)',
    subCondition: 'Immunosuppressive treatment',
    description: 'SLE on immunosuppressive treatment',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 2 },
  },
  {
    id: 'sle_none',
    group: 'Autoimmune / Other',
    condition: 'Systemic lupus erythematosus (SLE)',
    subCondition: 'None of the above',
    description: 'SLE without antiphospholipid antibodies, thrombocytopenia, or immunosuppressive treatment',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },

  // --- Anaemias ---
  {
    id: 'anaemia_iron_deficiency',
    group: 'Autoimmune / Other',
    condition: 'Anaemia',
    subCondition: 'Iron-deficiency anaemia',
    description: 'Iron-deficiency anaemia',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },
  {
    id: 'sickle_cell',
    group: 'Autoimmune / Other',
    condition: 'Anaemia',
    subCondition: 'Sickle cell disease',
    description: 'Sickle cell disease',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 2 },
  },
  {
    id: 'thalassaemia',
    group: 'Autoimmune / Other',
    condition: 'Anaemia',
    subCondition: 'Thalassaemia',
    description: 'Thalassaemia',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 },
  },

  // --- Solid organ transplantation ---
  {
    id: 'organ_transplant_complicated',
    group: 'Autoimmune / Other',
    condition: 'Solid organ transplantation',
    subCondition: 'Complicated (graft failure, rejection, cardiac allograft vasculopathy)',
    description: 'Solid organ transplant with complications',
    categories: { 'Cu-IUD': 3, 'LNG-IUD': 3, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 4 },
  },
  {
    id: 'organ_transplant_uncomplicated',
    group: 'Autoimmune / Other',
    condition: 'Solid organ transplantation',
    subCondition: 'Uncomplicated',
    description: 'Solid organ transplant, uncomplicated',
    categories: { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 2, 'DMPA': 2, 'POP': 2, 'CHC': 2 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DRUG INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'drug_rifampicin',
    group: 'Drug Interactions',
    condition: 'Rifampicin or rifabutin',
    description: 'Currently taking rifampicin or rifabutin (e.g., for TB treatment)',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 2, 'DMPA': 1, 'POP': 3, 'CHC': 3 },
  },
  {
    id: 'drug_anticonvulsants',
    group: 'Drug Interactions',
    condition: 'Certain anticonvulsants',
    description: 'Phenytoin, carbamazepine, barbiturates, primidone, topiramate, oxcarbazepine',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 2, 'DMPA': 1, 'POP': 3, 'CHC': 3 },
  },
  {
    id: 'drug_arv_ritonavir',
    group: 'Drug Interactions',
    condition: 'Antiretroviral therapy',
    subCondition: 'Ritonavir-boosted protease inhibitors',
    description: 'Antiretroviral therapy with ritonavir-boosted protease inhibitors',
    categories: { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 2, 'DMPA': 1, 'POP': 3, 'CHC': 3 },
  },
];

// ─── Grouped conditions for UI display ───────────────────────────────────────

export const CONDITION_GROUPS: MecConditionGroup[] = [
  'Personal Characteristics',
  'Cardiovascular',
  'Neurological',
  'Reproductive / Breast',
  'Infections',
  'Endocrine',
  'Gastrointestinal / Hepatic',
  'Autoimmune / Other',
  'Drug Interactions',
];

/**
 * Get conditions grouped by category for the UI.
 */
export function getConditionsByGroup(): Record<MecConditionGroup, MecConditionEntry[]> {
  const grouped = {} as Record<MecConditionGroup, MecConditionEntry[]>;
  for (const group of CONDITION_GROUPS) {
    grouped[group] = WHO_MEC_CONDITIONS.filter(c => c.group === group);
  }
  return grouped;
}

/**
 * Get a flat list of unique parent condition names (for search).
 */
export function getUniqueConditionNames(): string[] {
  const names = new Set<string>();
  WHO_MEC_CONDITIONS.forEach(c => names.add(c.condition));
  return Array.from(names);
}

/**
 * Combine multiple condition entries by taking the most restrictive (highest)
 * category for each method. This is the WHO MEC combination rule.
 */
export function combineConditions(
  baseCategories: MethodCategories,
  selectedConditionIds: string[],
): MethodCategories {
  const result = { ...baseCategories };
  const methods = Object.keys(result) as (keyof MethodCategories)[];

  for (const condId of selectedConditionIds) {
    const entry = WHO_MEC_CONDITIONS.find(c => c.id === condId);
    if (!entry) continue;
    for (const method of methods) {
      result[method] = Math.max(result[method], entry.categories[method]) as MECCategory;
    }
  }

  return result;
}
