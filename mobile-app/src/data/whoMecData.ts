/**
 * WHO Medical Eligibility Criteria (MEC) Complete Condition Database
 * Based on WHO MEC 5th Edition (2015) — matches the WHO Contraception Tool app.
 *
 * All 55 parent conditions from the WHO MEC App are included.
 * Each condition/sub-condition maps to MEC categories (1–4) for 6 methods:
 *   Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC
 *
 * Combination rule: take the MOST RESTRICTIVE (highest) category per method.
 *
 * Categories:
 *   1 = No restriction for use
 *   2 = Advantages generally outweigh risks
 *   3 = Risks usually outweigh advantages
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
  id: string;
  group: MecConditionGroup;
  condition: string;
  subCondition?: string;
  description: string;
  categories: MethodCategories;
  notes?: string;
}

export type MecConditionGroup =
  | 'Personal Characteristics'
  | 'Cardiovascular'
  | 'Neurological'
  | 'Reproductive / Gynaecological'
  | 'Infections'
  | 'Endocrine / Metabolic'
  | 'Gastrointestinal / Hepatic'
  | 'Haematological / Autoimmune'
  | 'Drug Interactions';

// ─── Age group helper ────────────────────────────────────────────────────────

export type AgeGroup = '<18' | '18-39' | '>=40';

export function getAgeGroup(age: number): AgeGroup {
  if (age < 18) return '<18';
  if (age <= 39) return '18-39';
  return '>=40';
}

export function getBaseByAge(age: number): MethodCategories {
  if (age < 18) {
    return { 'Cu-IUD': 2, 'LNG-IUD': 2, 'Implant': 1, 'DMPA': 2, 'POP': 1, 'CHC': 1 };
  }
  if (age <= 39) {
    return { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 1, 'POP': 1, 'CHC': 1 };
  }
  return { 'Cu-IUD': 1, 'LNG-IUD': 1, 'Implant': 1, 'DMPA': 2, 'POP': 1, 'CHC': 2 };
}

// ─── Helper to build categories object ───────────────────────────────────────

function mc(cu: MECCategory, lng: MECCategory, imp: MECCategory, dmpa: MECCategory, pop: MECCategory, chc: MECCategory): MethodCategories {
  return { 'Cu-IUD': cu, 'LNG-IUD': lng, 'Implant': imp, 'DMPA': dmpa, 'POP': pop, 'CHC': chc };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE WHO MEC CONDITION DATABASE — 55 Parent Conditions
// ═══════════════════════════════════════════════════════════════════════════════

export const WHO_MEC_CONDITIONS: MecConditionEntry[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PERSONAL CHARACTERISTICS (7 conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- #1 Breastfeeding ---
  {
    id: 'bf_lt6w',
    group: 'Personal Characteristics',
    condition: 'Breastfeeding',
    subCondition: '< 6 weeks postpartum',
    description: 'Breastfeeding, less than 6 weeks after delivery',
    categories: mc(1,1,2,2,2,4),
    notes: 'CHC contraindicated due to estrogen effect on milk supply',
  },
  {
    id: 'bf_6w_6m',
    group: 'Personal Characteristics',
    condition: 'Breastfeeding',
    subCondition: '6 weeks to < 6 months postpartum',
    description: 'Breastfeeding, 6 weeks to 6 months after delivery',
    categories: mc(1,1,1,1,1,3),
  },
  {
    id: 'bf_gte6m',
    group: 'Personal Characteristics',
    condition: 'Breastfeeding',
    subCondition: '≥ 6 months postpartum',
    description: 'Breastfeeding, 6 or more months after delivery',
    categories: mc(1,1,1,1,1,2),
  },

  // --- #2 Obesity ---
  {
    id: 'obesity',
    group: 'Personal Characteristics',
    condition: 'Obesity',
    subCondition: 'BMI ≥ 30 kg/m²',
    description: 'Body mass index 30 or greater',
    categories: mc(1,1,1,2,1,2),
  },

  // --- #3 Parity ---
  {
    id: 'parity_nulliparous',
    group: 'Personal Characteristics',
    condition: 'Parity',
    subCondition: 'Nulliparous',
    description: 'Has never given birth',
    categories: mc(2,2,1,1,1,1),
  },
  {
    id: 'parity_parous',
    group: 'Personal Characteristics',
    condition: 'Parity',
    subCondition: 'Parous (1 or more)',
    description: 'Has given birth one or more times',
    categories: mc(1,1,1,1,1,1),
  },

  // --- #4 Post abortion ---
  {
    id: 'post_abortion_1st',
    group: 'Personal Characteristics',
    condition: 'Post abortion',
    subCondition: 'First trimester',
    description: 'After first-trimester abortion',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'post_abortion_2nd',
    group: 'Personal Characteristics',
    condition: 'Post abortion',
    subCondition: 'Second trimester',
    description: 'After second-trimester abortion',
    categories: mc(2,2,1,1,1,1),
  },
  {
    id: 'post_abortion_septic',
    group: 'Personal Characteristics',
    condition: 'Post abortion',
    subCondition: 'Post-septic abortion',
    description: 'Post-abortion complicated by sepsis',
    categories: mc(4,4,1,1,1,1),
  },

  // --- #5 Postpartum (non-breastfeeding) ---
  {
    id: 'pp_nbf_lt21d',
    group: 'Personal Characteristics',
    condition: 'Postpartum',
    subCondition: 'Non-breastfeeding, < 21 days',
    description: 'Not breastfeeding, less than 21 days after delivery',
    categories: mc(1,1,1,1,1,4),
    notes: 'High VTE risk in early postpartum period',
  },
  {
    id: 'pp_nbf_21_42d_no_vte',
    group: 'Personal Characteristics',
    condition: 'Postpartum',
    subCondition: 'Non-breastfeeding, 21–42 days, no VTE risk',
    description: 'Not breastfeeding, 21–42 days postpartum, no VTE risk factors',
    categories: mc(1,1,1,1,1,2),
  },
  {
    id: 'pp_nbf_21_42d_vte',
    group: 'Personal Characteristics',
    condition: 'Postpartum',
    subCondition: 'Non-breastfeeding, 21–42 days, VTE risk',
    description: 'Not breastfeeding, 21–42 days postpartum, with VTE risk factors',
    categories: mc(1,1,1,1,1,3),
  },
  {
    id: 'pp_nbf_gt42d',
    group: 'Personal Characteristics',
    condition: 'Postpartum',
    subCondition: 'Non-breastfeeding, > 42 days',
    description: 'Not breastfeeding, more than 42 days after delivery',
    categories: mc(1,1,1,1,1,1),
  },

  // --- #6 Pregnancy ---
  {
    id: 'pregnancy',
    group: 'Personal Characteristics',
    condition: 'Pregnancy',
    description: 'Confirmed or suspected pregnancy — no contraceptive method needed',
    categories: mc(4,4,4,4,4,4),
    notes: 'NA — contraception not applicable during pregnancy. IUD insertion is contraindicated.',
  },

  // --- #7 Smoking ---
  {
    id: 'smoking_lt35',
    group: 'Personal Characteristics',
    condition: 'Smoking',
    subCondition: 'Age < 35',
    description: 'Current smoker under age 35',
    categories: mc(1,1,1,1,1,2),
  },
  {
    id: 'smoking_gte35_lt15',
    group: 'Personal Characteristics',
    condition: 'Smoking',
    subCondition: 'Age ≥ 35, < 15 cigarettes/day',
    description: 'Current smoker, age 35+, fewer than 15 cigarettes per day',
    categories: mc(1,1,1,1,1,3),
  },
  {
    id: 'smoking_gte35_gte15',
    group: 'Personal Characteristics',
    condition: 'Smoking',
    subCondition: 'Age ≥ 35, ≥ 15 cigarettes/day',
    description: 'Current smoker, age 35+, 15 or more cigarettes per day',
    categories: mc(1,1,1,1,1,4),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CARDIOVASCULAR (11 conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- #8 Blood pressure measurement unavailable ---
  {
    id: 'bp_unavailable',
    group: 'Cardiovascular',
    condition: 'Blood pressure measurement unavailable',
    description: 'Blood pressure cannot be measured prior to contraceptive initiation',
    categories: mc(1,1,1,1,1,2),
    notes: 'BP measurement desirable before CHC initiation but should not deny other methods',
  },

  // --- #9 Cardiovascular disease (Peripartum cardiomyopathy) ---
  {
    id: 'cvd_ppcm_lt6m_normal',
    group: 'Cardiovascular',
    condition: 'Cardiovascular disease',
    subCondition: 'Peripartum cardiomyopathy, < 6 months, normal/mildly impaired',
    description: 'Peripartum cardiomyopathy within 6 months, normal or mildly impaired function',
    categories: mc(2,2,1,1,1,4),
  },
  {
    id: 'cvd_ppcm_lt6m_impaired',
    group: 'Cardiovascular',
    condition: 'Cardiovascular disease',
    subCondition: 'Peripartum cardiomyopathy, < 6 months, moderately/severely impaired',
    description: 'Peripartum cardiomyopathy within 6 months, moderately or severely impaired function',
    categories: mc(2,2,1,1,1,4),
  },
  {
    id: 'cvd_ppcm_gte6m_normal',
    group: 'Cardiovascular',
    condition: 'Cardiovascular disease',
    subCondition: 'Peripartum cardiomyopathy, ≥ 6 months, normal/mildly impaired',
    description: 'Peripartum cardiomyopathy 6+ months, normal or mildly impaired function',
    categories: mc(2,2,1,1,1,2),
  },
  {
    id: 'cvd_ppcm_gte6m_impaired',
    group: 'Cardiovascular',
    condition: 'Cardiovascular disease',
    subCondition: 'Peripartum cardiomyopathy, ≥ 6 months, moderately/severely impaired',
    description: 'Peripartum cardiomyopathy 6+ months, moderately or severely impaired function',
    categories: mc(2,2,1,1,1,4),
  },

  // --- #10 Current and history of ischaemic heart disease ---
  {
    id: 'ihd',
    group: 'Cardiovascular',
    condition: 'Current and history of ischaemic heart disease',
    description: 'Current or past ischaemic heart disease',
    categories: mc(1,2,2,3,2,4),
  },

  // --- #11 Deep vein thrombosis / Pulmonary embolism ---
  {
    id: 'dvt_history',
    group: 'Cardiovascular',
    condition: 'Deep vein thrombosis / Pulmonary embolism',
    subCondition: 'History of DVT/PE',
    description: 'Past deep vein thrombosis or pulmonary embolism',
    categories: mc(1,2,2,2,2,4),
  },
  {
    id: 'dvt_current',
    group: 'Cardiovascular',
    condition: 'Deep vein thrombosis / Pulmonary embolism',
    subCondition: 'Acute DVT/PE',
    description: 'Active deep vein thrombosis or pulmonary embolism',
    categories: mc(1,3,3,3,3,4),
  },
  {
    id: 'dvt_family_history',
    group: 'Cardiovascular',
    condition: 'Deep vein thrombosis / Pulmonary embolism',
    subCondition: 'Family history (first-degree relative)',
    description: 'Family history of DVT/PE in first-degree relative',
    categories: mc(1,1,1,1,1,2),
  },
  {
    id: 'dvt_surgery_immobilization',
    group: 'Cardiovascular',
    condition: 'Deep vein thrombosis / Pulmonary embolism',
    subCondition: 'Major surgery with prolonged immobilization',
    description: 'Major surgery requiring prolonged immobilization',
    categories: mc(1,2,2,2,2,4),
  },
  {
    id: 'dvt_surgery_no_immobilization',
    group: 'Cardiovascular',
    condition: 'Deep vein thrombosis / Pulmonary embolism',
    subCondition: 'Major surgery without prolonged immobilization',
    description: 'Major surgery without prolonged immobilization',
    categories: mc(1,1,1,1,1,2),
  },
  {
    id: 'dvt_minor_surgery',
    group: 'Cardiovascular',
    condition: 'Deep vein thrombosis / Pulmonary embolism',
    subCondition: 'Minor surgery without immobilization',
    description: 'Minor surgery without immobilization',
    categories: mc(1,1,1,1,1,1),
  },

  // --- #12 History of high blood pressure during pregnancy ---
  {
    id: 'htn_pregnancy_history',
    group: 'Cardiovascular',
    condition: 'History of high blood pressure during pregnancy',
    description: 'History of pregnancy-induced hypertension (current BP normal)',
    categories: mc(1,1,1,1,1,2),
  },

  // --- #13 Hypertension ---
  {
    id: 'htn_controlled',
    group: 'Cardiovascular',
    condition: 'Hypertension',
    subCondition: 'Adequately controlled',
    description: 'Blood pressure adequately controlled with medication',
    categories: mc(1,1,1,2,1,3),
  },
  {
    id: 'htn_140_159',
    group: 'Cardiovascular',
    condition: 'Hypertension',
    subCondition: 'Systolic 140–159 or Diastolic 90–99',
    description: 'Elevated blood pressure (140–159 / 90–99 mmHg)',
    categories: mc(1,1,1,2,1,3),
  },
  {
    id: 'htn_gte160',
    group: 'Cardiovascular',
    condition: 'Hypertension',
    subCondition: 'Systolic ≥ 160 or Diastolic ≥ 100',
    description: 'Severely elevated blood pressure (≥160 / ≥100 mmHg)',
    categories: mc(1,2,2,3,2,4),
  },
  {
    id: 'htn_vascular',
    group: 'Cardiovascular',
    condition: 'Hypertension',
    subCondition: 'With vascular disease',
    description: 'Hypertension with vascular disease',
    categories: mc(1,2,2,3,2,4),
  },

  // --- #14 Known dyslipidaemias ---
  {
    id: 'dyslipidaemia',
    group: 'Cardiovascular',
    condition: 'Known dyslipidaemias',
    description: 'Known dyslipidaemias without other cardiovascular risk factors',
    categories: mc(1,2,2,2,2,2),
  },

  // --- #15 Known thrombogenic mutations ---
  {
    id: 'thrombogenic_mutations',
    group: 'Cardiovascular',
    condition: 'Known thrombogenic mutations',
    description: 'Known thrombogenic mutations (e.g., Factor V Leiden, Prothrombin mutation)',
    categories: mc(1,2,2,2,2,4),
  },

  // --- #16 Stroke ---
  {
    id: 'stroke',
    group: 'Cardiovascular',
    condition: 'Stroke',
    description: 'History of cerebrovascular accident (stroke)',
    categories: mc(1,2,2,3,2,4),
  },

  // --- #17 Superficial venous disorders ---
  {
    id: 'svd_varicose',
    group: 'Cardiovascular',
    condition: 'Superficial venous disorders',
    subCondition: 'Varicose veins',
    description: 'Varicose veins',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'svd_thrombophlebitis',
    group: 'Cardiovascular',
    condition: 'Superficial venous disorders',
    subCondition: 'Superficial venous thrombophlebitis',
    description: 'Superficial venous thrombophlebitis',
    categories: mc(1,1,1,1,1,2),
  },

  // --- #18 Valvular heart disease ---
  {
    id: 'vhd_uncomplicated',
    group: 'Cardiovascular',
    condition: 'Valvular heart disease',
    subCondition: 'Uncomplicated',
    description: 'Uncomplicated valvular heart disease',
    categories: mc(1,1,1,1,1,2),
  },
  {
    id: 'vhd_complicated',
    group: 'Cardiovascular',
    condition: 'Valvular heart disease',
    subCondition: 'Complicated',
    description: 'Complicated (pulmonary hypertension, atrial fibrillation, history of SBE)',
    categories: mc(2,2,1,1,1,4),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. NEUROLOGICAL (3 conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- #19 Depressive disorders ---
  {
    id: 'depressive_disorders',
    group: 'Neurological',
    condition: 'Depressive disorders',
    description: 'Depressive disorders',
    categories: mc(1,1,1,1,1,1),
  },

  // --- #20 Epilepsy ---
  {
    id: 'epilepsy',
    group: 'Neurological',
    condition: 'Epilepsy',
    description: 'Epilepsy (condition itself, not anticonvulsant drug interactions)',
    categories: mc(1,1,1,1,1,1),
    notes: 'Certain anticonvulsants interact with hormonal methods — see Anticonvulsant Therapy',
  },

  // --- #21 Headaches ---
  {
    id: 'headache_nonmigraine',
    group: 'Neurological',
    condition: 'Headaches',
    subCondition: 'Non-migrainous (mild or severe)',
    description: 'Non-migrainous headaches',
    categories: mc(1,1,1,1,1,2),
  },
  {
    id: 'migraine_no_aura_lt35',
    group: 'Neurological',
    condition: 'Headaches',
    subCondition: 'Migraine without aura, age < 35',
    description: 'Migraine without aura in patient under 35',
    categories: mc(1,2,2,2,1,2),
  },
  {
    id: 'migraine_no_aura_gte35',
    group: 'Neurological',
    condition: 'Headaches',
    subCondition: 'Migraine without aura, age ≥ 35',
    description: 'Migraine without aura in patient 35 or older',
    categories: mc(1,2,2,2,1,3),
  },
  {
    id: 'migraine_with_aura',
    group: 'Neurological',
    condition: 'Headaches',
    subCondition: 'Migraine with aura (any age)',
    description: 'Migraine with aura at any age',
    categories: mc(1,2,2,2,2,4),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. REPRODUCTIVE / GYNAECOLOGICAL (15 conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- #22 Benign ovarian tumours ---
  {
    id: 'benign_ovarian_tumours',
    group: 'Reproductive / Gynaecological',
    condition: 'Benign ovarian tumours',
    description: 'Benign ovarian tumours (including cysts)',
    categories: mc(1,1,1,1,1,1),
  },

  // --- #23 Breast diseases ---
  {
    id: 'breast_benign',
    group: 'Reproductive / Gynaecological',
    condition: 'Breast diseases',
    subCondition: 'Benign breast disease',
    description: 'Benign breast disease (e.g., fibroadenoma, fibrocystic changes)',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'breast_family_history',
    group: 'Reproductive / Gynaecological',
    condition: 'Breast diseases',
    subCondition: 'Family history of breast cancer',
    description: 'Family history of breast cancer',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'breast_undiagnosed_mass',
    group: 'Reproductive / Gynaecological',
    condition: 'Breast diseases',
    subCondition: 'Undiagnosed mass',
    description: 'Undiagnosed breast mass',
    categories: mc(1,2,2,2,2,2),
  },
  {
    id: 'breast_cancer_current',
    group: 'Reproductive / Gynaecological',
    condition: 'Breast diseases',
    subCondition: 'Current breast cancer',
    description: 'Active or current breast cancer',
    categories: mc(1,4,4,4,4,4),
  },
  {
    id: 'breast_cancer_past',
    group: 'Reproductive / Gynaecological',
    condition: 'Breast diseases',
    subCondition: 'Past, no evidence for 5 years',
    description: 'Past breast cancer with no evidence of recurrence for 5+ years',
    categories: mc(1,3,3,3,3,3),
  },

  // --- #24 Cervical cancer ---
  {
    id: 'cervical_cancer',
    group: 'Reproductive / Gynaecological',
    condition: 'Cervical cancer',
    description: 'Cervical cancer awaiting treatment',
    categories: mc(4,4,2,2,1,2),
  },

  // --- #25 Cervical intraepithelial neoplasia (CIN) ---
  {
    id: 'cin',
    group: 'Reproductive / Gynaecological',
    condition: 'Cervical intraepithelial neoplasia',
    description: 'Cervical intraepithelial neoplasia (CIN)',
    categories: mc(1,2,2,2,1,2),
  },

  // --- #26 Endometrial cancer ---
  {
    id: 'endometrial_cancer',
    group: 'Reproductive / Gynaecological',
    condition: 'Endometrial cancer',
    description: 'Endometrial cancer awaiting treatment',
    categories: mc(4,4,1,1,1,1),
  },

  // --- #27 Endometriosis ---
  {
    id: 'endometriosis',
    group: 'Reproductive / Gynaecological',
    condition: 'Endometriosis',
    description: 'Endometriosis',
    categories: mc(2,1,1,1,1,1),
    notes: 'Cu-IUD may worsen dysmenorrhoea. LNG-IUD is often therapeutic.',
  },

  // --- #28 History of pelvic surgery ---
  {
    id: 'pelvic_surgery',
    group: 'Reproductive / Gynaecological',
    condition: 'History of pelvic surgery',
    description: 'History of pelvic surgery (including caesarean section)',
    categories: mc(1,1,1,1,1,1),
  },

  // --- #29 Ovarian cancer ---
  {
    id: 'ovarian_cancer',
    group: 'Reproductive / Gynaecological',
    condition: 'Ovarian cancer',
    description: 'Ovarian cancer',
    categories: mc(3,3,1,1,1,1),
  },

  // --- #30 Past ectopic pregnancy ---
  {
    id: 'past_ectopic',
    group: 'Reproductive / Gynaecological',
    condition: 'Past ectopic pregnancy',
    description: 'History of ectopic pregnancy',
    categories: mc(1,1,1,1,1,1),
  },

  // --- #31 Pelvic inflammatory disease ---
  {
    id: 'pid_current',
    group: 'Reproductive / Gynaecological',
    condition: 'Pelvic inflammatory disease',
    subCondition: 'Current PID',
    description: 'Current pelvic inflammatory disease',
    categories: mc(4,4,1,1,1,1),
  },
  {
    id: 'pid_past_with_pregnancy',
    group: 'Reproductive / Gynaecological',
    condition: 'Pelvic inflammatory disease',
    subCondition: 'Past PID, with subsequent pregnancy',
    description: 'Past PID with subsequent pregnancy',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'pid_past_without_pregnancy',
    group: 'Reproductive / Gynaecological',
    condition: 'Pelvic inflammatory disease',
    subCondition: 'Past PID, without subsequent pregnancy',
    description: 'Past PID without subsequent pregnancy',
    categories: mc(2,2,1,1,1,1),
  },

  // --- #32 Severe dysmenorrhoea ---
  {
    id: 'severe_dysmenorrhoea',
    group: 'Reproductive / Gynaecological',
    condition: 'Severe dysmenorrhoea',
    description: 'Severe dysmenorrhoea',
    categories: mc(2,1,1,1,1,1),
    notes: 'Cu-IUD may worsen symptoms',
  },

  // --- #33 Sexually transmitted infections ---
  {
    id: 'sti_current_purulent',
    group: 'Reproductive / Gynaecological',
    condition: 'Sexually transmitted infections',
    subCondition: 'Current purulent cervicitis, chlamydia, or gonorrhoea',
    description: 'Current purulent cervicitis or chlamydial/gonococcal infection',
    categories: mc(4,4,1,1,1,1),
  },
  {
    id: 'sti_vaginitis',
    group: 'Reproductive / Gynaecological',
    condition: 'Sexually transmitted infections',
    subCondition: 'Vaginitis (including trichomonas and bacterial vaginosis)',
    description: 'Vaginitis including Trichomonas vaginalis and bacterial vaginosis',
    categories: mc(2,2,1,1,1,1),
  },
  {
    id: 'sti_increased_risk',
    group: 'Reproductive / Gynaecological',
    condition: 'Sexually transmitted infections',
    subCondition: 'Increased risk of STIs',
    description: 'Increased risk of sexually transmitted infections (e.g., multiple partners)',
    categories: mc(2,2,1,1,1,1),
  },

  // --- #34 Unexplained vaginal bleeding ---
  {
    id: 'vaginal_bleeding_unexplained',
    group: 'Reproductive / Gynaecological',
    condition: 'Unexplained vaginal bleeding',
    description: 'Unexplained vaginal bleeding suspicious for serious condition',
    categories: mc(4,4,3,3,3,3),
    notes: 'Evaluate before initiating any method',
  },

  // --- #35 Uterine fibroids ---
  {
    id: 'fibroids_no_distortion',
    group: 'Reproductive / Gynaecological',
    condition: 'Uterine fibroids',
    subCondition: 'Without uterine cavity distortion',
    description: 'Uterine fibroids without distortion of uterine cavity',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'fibroids_with_distortion',
    group: 'Reproductive / Gynaecological',
    condition: 'Uterine fibroids',
    subCondition: 'With uterine cavity distortion',
    description: 'Uterine fibroids with distortion of uterine cavity',
    categories: mc(4,4,1,1,1,1),
  },

  // --- #36 Vaginal bleeding patterns ---
  {
    id: 'vaginal_bleeding_irregular',
    group: 'Reproductive / Gynaecological',
    condition: 'Vaginal bleeding patterns',
    subCondition: 'Irregular pattern without heavy bleeding',
    description: 'Irregular menstrual patterns without heavy bleeding',
    categories: mc(1,1,1,2,2,1),
  },
  {
    id: 'vaginal_bleeding_heavy',
    group: 'Reproductive / Gynaecological',
    condition: 'Vaginal bleeding patterns',
    subCondition: 'Heavy or prolonged (regular or irregular)',
    description: 'Heavy or prolonged menstrual bleeding',
    categories: mc(2,1,1,1,1,1),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. INFECTIONS (4 conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- #37 HIV/AIDS ---
  {
    id: 'hiv_high_risk',
    group: 'Infections',
    condition: 'HIV/AIDS',
    subCondition: 'High risk of HIV',
    description: 'At high risk of HIV infection',
    categories: mc(2,2,1,1,1,1),
  },
  {
    id: 'hiv_infected',
    group: 'Infections',
    condition: 'HIV/AIDS',
    subCondition: 'HIV infected (clinically well)',
    description: 'HIV-infected, clinically well (WHO Stage 1 or 2)',
    categories: mc(2,2,1,1,1,1),
  },
  {
    id: 'hiv_aids',
    group: 'Infections',
    condition: 'HIV/AIDS',
    subCondition: 'AIDS',
    description: 'AIDS (WHO Stage 3 or 4)',
    categories: mc(3,3,1,1,1,1),
    notes: 'IUD insertion not recommended; can continue if already using',
  },

  // --- #38 Malaria ---
  {
    id: 'malaria',
    group: 'Infections',
    condition: 'Malaria',
    description: 'Malaria',
    categories: mc(1,1,1,1,1,1),
  },

  // --- #39 Schistosomiasis ---
  {
    id: 'schistosomiasis_uncomplicated',
    group: 'Infections',
    condition: 'Schistosomiasis',
    subCondition: 'Uncomplicated',
    description: 'Uncomplicated schistosomiasis',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'schistosomiasis_fibrosis',
    group: 'Infections',
    condition: 'Schistosomiasis',
    subCondition: 'Fibrosis of the liver',
    description: 'Schistosomiasis with fibrosis of the liver',
    categories: mc(1,1,1,1,1,1),
  },

  // --- #40 Tuberculosis ---
  {
    id: 'tb_nonpelvic',
    group: 'Infections',
    condition: 'Tuberculosis',
    subCondition: 'Non-pelvic',
    description: 'Non-pelvic tuberculosis',
    categories: mc(1,1,1,1,1,1),
    notes: 'Rifampicin interaction — see Antimicrobial Therapy',
  },
  {
    id: 'tb_pelvic',
    group: 'Infections',
    condition: 'Tuberculosis',
    subCondition: 'Pelvic tuberculosis',
    description: 'Known pelvic tuberculosis',
    categories: mc(4,4,1,1,1,1),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ENDOCRINE / METABOLIC (2 conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- #41 Diabetes ---
  {
    id: 'diabetes_gestational',
    group: 'Endocrine / Metabolic',
    condition: 'Diabetes',
    subCondition: 'History of gestational diabetes',
    description: 'History of gestational diabetes only',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'diabetes_no_vascular',
    group: 'Endocrine / Metabolic',
    condition: 'Diabetes',
    subCondition: 'Non-insulin or insulin dependent, no vascular disease',
    description: 'Diabetes without vascular disease, nephropathy, retinopathy, or neuropathy',
    categories: mc(1,2,2,2,2,2),
  },
  {
    id: 'diabetes_vascular',
    group: 'Endocrine / Metabolic',
    condition: 'Diabetes',
    subCondition: 'With nephropathy/retinopathy/neuropathy or > 20 years duration',
    description: 'Diabetes with vascular complications or duration > 20 years',
    categories: mc(1,2,2,3,2,3),
  },

  // --- #42 Thyroid disorders ---
  {
    id: 'thyroid',
    group: 'Endocrine / Metabolic',
    condition: 'Thyroid disorders',
    description: 'Simple goitre, hyperthyroid, or hypothyroid',
    categories: mc(1,1,1,1,1,1),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. GASTROINTESTINAL / HEPATIC (6 conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- #43 Cirrhosis ---
  {
    id: 'cirrhosis_mild',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Cirrhosis',
    subCondition: 'Mild (compensated)',
    description: 'Mild (compensated) cirrhosis',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'cirrhosis_severe',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Cirrhosis',
    subCondition: 'Severe (decompensated)',
    description: 'Severe (decompensated) cirrhosis',
    categories: mc(1,3,3,3,3,4),
  },

  // --- #44 Gall bladder diseases ---
  {
    id: 'gallbladder_cholecystectomy',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Gall bladder diseases',
    subCondition: 'Symptomatic, treated by cholecystectomy',
    description: 'Symptomatic gallbladder disease treated by cholecystectomy',
    categories: mc(1,2,2,2,2,2),
  },
  {
    id: 'gallbladder_medically_treated',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Gall bladder diseases',
    subCondition: 'Symptomatic, medically treated',
    description: 'Symptomatic gallbladder disease medically treated',
    categories: mc(1,2,2,2,2,3),
  },
  {
    id: 'gallbladder_current',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Gall bladder diseases',
    subCondition: 'Current symptomatic',
    description: 'Current symptomatic gallbladder disease',
    categories: mc(1,2,2,2,2,3),
  },
  {
    id: 'gallbladder_asymptomatic',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Gall bladder diseases',
    subCondition: 'Asymptomatic',
    description: 'Asymptomatic gallbladder disease',
    categories: mc(1,2,2,2,2,2),
  },

  // --- #45 Gestational trophoblastic diseases ---
  {
    id: 'gtd_decreasing',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Gestational trophoblastic diseases',
    subCondition: 'Decreasing or undetectable β-hCG levels',
    description: 'Benign GTD with decreasing or undetectable β-hCG levels',
    categories: mc(3,3,1,1,1,1),
  },
  {
    id: 'gtd_persistent',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Gestational trophoblastic diseases',
    subCondition: 'Persistently elevated β-hCG or malignant',
    description: 'Persistently elevated β-hCG levels or malignant gestational trophoblastic disease',
    categories: mc(4,4,1,1,1,1),
  },

  // --- #46 History of cholestasis ---
  {
    id: 'cholestasis_pregnancy',
    group: 'Gastrointestinal / Hepatic',
    condition: 'History of cholestasis',
    subCondition: 'Pregnancy-related',
    description: 'History of cholestasis related to pregnancy',
    categories: mc(1,1,1,1,1,2),
  },
  {
    id: 'cholestasis_coc',
    group: 'Gastrointestinal / Hepatic',
    condition: 'History of cholestasis',
    subCondition: 'COC-related',
    description: 'History of cholestasis related to past COC use',
    categories: mc(1,1,1,1,1,3),
  },

  // --- #47 Liver tumours ---
  {
    id: 'liver_tumour_fnh',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Liver tumours',
    subCondition: 'Focal nodular hyperplasia',
    description: 'Focal nodular hyperplasia',
    categories: mc(1,2,2,2,2,2),
  },
  {
    id: 'liver_tumour_adenoma',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Liver tumours',
    subCondition: 'Hepatocellular adenoma',
    description: 'Benign hepatocellular adenoma',
    categories: mc(1,3,3,3,3,4),
  },
  {
    id: 'liver_tumour_malignant',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Liver tumours',
    subCondition: 'Malignant (hepatocellular carcinoma)',
    description: 'Malignant liver tumour (hepatocellular carcinoma)',
    categories: mc(1,3,3,3,3,4),
  },

  // --- #48 Viral hepatitis ---
  {
    id: 'hepatitis_acute',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Viral hepatitis',
    subCondition: 'Acute or flare',
    description: 'Acute viral hepatitis or hepatitis flare',
    categories: mc(1,1,1,1,1,3),
  },
  {
    id: 'hepatitis_carrier',
    group: 'Gastrointestinal / Hepatic',
    condition: 'Viral hepatitis',
    subCondition: 'Carrier',
    description: 'Hepatitis virus carrier',
    categories: mc(1,1,1,1,1,1),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. HAEMATOLOGICAL / AUTOIMMUNE (4 conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- #49 Iron-deficient anaemia ---
  {
    id: 'iron_deficiency_anaemia',
    group: 'Haematological / Autoimmune',
    condition: 'Iron-deficient anaemia',
    description: 'Iron-deficiency anaemia',
    categories: mc(2,1,1,1,1,1),
  },

  // --- #50 Sickle cell disease ---
  {
    id: 'sickle_cell',
    group: 'Haematological / Autoimmune',
    condition: 'Sickle cell disease',
    description: 'Sickle cell disease',
    categories: mc(2,2,1,1,1,2),
  },

  // --- #51 Systemic lupus erythematosus ---
  {
    id: 'sle_antiphospholipid',
    group: 'Haematological / Autoimmune',
    condition: 'Systemic lupus erythematosus',
    subCondition: 'Positive/unknown antiphospholipid antibodies',
    description: 'SLE with positive or unknown antiphospholipid antibodies',
    categories: mc(1,3,3,3,3,4),
  },
  {
    id: 'sle_thrombocytopenia',
    group: 'Haematological / Autoimmune',
    condition: 'Systemic lupus erythematosus',
    subCondition: 'Severe thrombocytopenia',
    description: 'SLE with severe thrombocytopenia',
    categories: mc(3,2,2,2,2,2),
  },
  {
    id: 'sle_immunosuppressive',
    group: 'Haematological / Autoimmune',
    condition: 'Systemic lupus erythematosus',
    subCondition: 'Immunosuppressive treatment',
    description: 'SLE on immunosuppressive treatment',
    categories: mc(2,2,2,2,2,2),
  },
  {
    id: 'sle_none',
    group: 'Haematological / Autoimmune',
    condition: 'Systemic lupus erythematosus',
    subCondition: 'None of the above',
    description: 'SLE without above complications',
    categories: mc(1,1,1,1,1,2),
  },

  // --- #52 Thalassaemia ---
  {
    id: 'thalassaemia',
    group: 'Haematological / Autoimmune',
    condition: 'Thalassaemia',
    description: 'Thalassaemia',
    categories: mc(2,1,1,1,1,1),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. DRUG INTERACTIONS (3 conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- #53 Anticonvulsant Therapy ---
  {
    id: 'anticonvulsant_enzyme_inducing',
    group: 'Drug Interactions',
    condition: 'Anticonvulsant Therapy',
    subCondition: 'Phenytoin, carbamazepine, barbiturates, primidone, topiramate, oxcarbazepine',
    description: 'Enzyme-inducing anticonvulsants',
    categories: mc(1,1,2,1,3,3),
  },
  {
    id: 'anticonvulsant_lamotrigine',
    group: 'Drug Interactions',
    condition: 'Anticonvulsant Therapy',
    subCondition: 'Lamotrigine',
    description: 'Lamotrigine (CHC reduces lamotrigine levels, increasing seizure risk)',
    categories: mc(1,1,1,1,1,3),
  },

  // --- #54 Antimicrobial Therapy ---
  {
    id: 'antimicrobial_broad_spectrum',
    group: 'Drug Interactions',
    condition: 'Antimicrobial Therapy',
    subCondition: 'Broad-spectrum antibiotics',
    description: 'Broad-spectrum antibiotics (e.g., ampicillin, tetracycline)',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'antimicrobial_antifungals',
    group: 'Drug Interactions',
    condition: 'Antimicrobial Therapy',
    subCondition: 'Antifungals',
    description: 'Antifungal medications (e.g., fluconazole, griseofulvin)',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'antimicrobial_antiparasitics',
    group: 'Drug Interactions',
    condition: 'Antimicrobial Therapy',
    subCondition: 'Antiparasitics',
    description: 'Antiparasitic medications',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'antimicrobial_rifampicin',
    group: 'Drug Interactions',
    condition: 'Antimicrobial Therapy',
    subCondition: 'Rifampicin or rifabutin',
    description: 'Rifampicin or rifabutin therapy (e.g., for TB)',
    categories: mc(1,1,2,1,3,3),
  },

  // --- #55 Antiretroviral Therapy ---
  {
    id: 'arv_nrtis',
    group: 'Drug Interactions',
    condition: 'Antiretroviral Therapy',
    subCondition: 'NRTIs (nucleoside reverse transcriptase inhibitors)',
    description: 'NRTIs: abacavir, tenofovir, zidovudine, lamivudine, emtricitabine, etc.',
    categories: mc(1,1,1,1,1,1),
  },
  {
    id: 'arv_nnrtis',
    group: 'Drug Interactions',
    condition: 'Antiretroviral Therapy',
    subCondition: 'NNRTIs (non-nucleoside reverse transcriptase inhibitors)',
    description: 'NNRTIs: efavirenz, nevirapine, etravirine, rilpivirine, etc.',
    categories: mc(1,1,1,1,1,1),
    notes: 'Efavirenz may reduce hormonal contraceptive levels — monitor efficacy',
  },
  {
    id: 'arv_ritonavir_boosted',
    group: 'Drug Interactions',
    condition: 'Antiretroviral Therapy',
    subCondition: 'Ritonavir-boosted protease inhibitors',
    description: 'Ritonavir-boosted protease inhibitors (e.g., lopinavir/r, atazanavir/r)',
    categories: mc(1,1,2,1,3,3),
  },
];

// ─── Grouped conditions for UI display ───────────────────────────────────────

export const CONDITION_GROUPS: MecConditionGroup[] = [
  'Personal Characteristics',
  'Cardiovascular',
  'Neurological',
  'Reproductive / Gynaecological',
  'Infections',
  'Endocrine / Metabolic',
  'Gastrointestinal / Hepatic',
  'Haematological / Autoimmune',
  'Drug Interactions',
];

export function getConditionsByGroup(): Record<MecConditionGroup, MecConditionEntry[]> {
  const grouped = {} as Record<MecConditionGroup, MecConditionEntry[]>;
  for (const group of CONDITION_GROUPS) {
    grouped[group] = WHO_MEC_CONDITIONS.filter(c => c.group === group);
  }
  return grouped;
}

export function getUniqueConditionNames(): string[] {
  const names = new Set<string>();
  WHO_MEC_CONDITIONS.forEach(c => names.add(c.condition));
  return Array.from(names);
}

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
