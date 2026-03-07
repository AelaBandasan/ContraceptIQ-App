/**
 * WHO Medical Eligibility Criteria (MEC) 5th Edition (2015)
 * Matches the WHO Contraception Tool (MEC Wheel) app exactly.
 *
 * Categories 1–4 for 6 methods: Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC
 * Many conditions have Initiation (I) and Continuation (C) variants.
 * Combination rule: most restrictive (highest) category per method.
 */

import { MECCategory } from '../services/mecService';

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
  /** Parent condition name (used for grouping in the tree) */
  condition: string;
  /** Sub-condition label */
  subCondition?: string;
  /** 'I' for Initiation, 'C' for Continuation, undefined if no I/C split */
  variant?: 'I' | 'C';
  /** MEC categories */
  categories: MethodCategories;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function mc(cu: MECCategory, lng: MECCategory, imp: MECCategory, dmpa: MECCategory, pop: MECCategory, chc: MECCategory): MethodCategories {
  return { 'Cu-IUD': cu, 'LNG-IUD': lng, 'Implant': imp, 'DMPA': dmpa, 'POP': pop, 'CHC': chc };
}

// ─── Age groups ──────────────────────────────────────────────────────────────

export type AgeGroup = '<18' | '18-39' | '>=40';

export function getAgeGroup(age: number): AgeGroup {
  if (age < 18) return '<18';
  if (age <= 39) return '18-39';
  return '>=40';
}

export function getBaseByAge(age: number): MethodCategories {
  if (age < 18) return mc(2,2,1,2,1,1);
  if (age <= 39) return mc(1,1,1,1,1,1);
  return mc(1,1,1,2,1,2);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE WHO MEC CONDITION DATABASE
// Alphabetical by parent condition name, matching WHO MEC App
// ═══════════════════════════════════════════════════════════════════════════════

export const WHO_MEC_CONDITIONS: MecConditionEntry[] = [

  // ── Anticonvulsant Therapy ──
  { id: 'anticonv_phenytoin', condition: 'Anticonvulsant Therapy', subCondition: 'Phenytoin, carbamazepine, barbiturates, primidone, topiramate, oxcarbazepine', categories: mc(1,1,2,1,3,3) },
  { id: 'anticonv_lamotrigine', condition: 'Anticonvulsant Therapy', subCondition: 'Lamotrigine', categories: mc(1,1,1,1,1,3) },

  // ── Antimicrobial Therapy ──
  { id: 'antimicro_broadspectrum', condition: 'Antimicrobial Therapy', subCondition: 'Broad-spectrum antibiotics', categories: mc(1,1,1,1,1,1) },
  { id: 'antimicro_antifungals', condition: 'Antimicrobial Therapy', subCondition: 'Antifungals', categories: mc(1,1,1,1,1,1) },
  { id: 'antimicro_antiparasitics', condition: 'Antimicrobial Therapy', subCondition: 'Antiparasitics', categories: mc(1,1,1,1,1,1) },
  { id: 'antimicro_rifampicin', condition: 'Antimicrobial Therapy', subCondition: 'Rifampicin or rifabutin', categories: mc(1,1,2,1,3,3) },

  // ── Antiretroviral Therapy ──
  // NRTIs
  { id: 'arv_nrti_abc', condition: 'Antiretroviral Therapy', subCondition: 'NRTI: Abacavir (ABC)', categories: mc(1,1,1,1,1,1) },
  { id: 'arv_nrti_tdf', condition: 'Antiretroviral Therapy', subCondition: 'NRTI: Tenofovir (TDF)', categories: mc(1,1,1,1,1,1) },
  { id: 'arv_nrti_azt', condition: 'Antiretroviral Therapy', subCondition: 'NRTI: Zidovudine (AZT)', categories: mc(1,1,1,1,1,1) },
  { id: 'arv_nrti_3tc', condition: 'Antiretroviral Therapy', subCondition: 'NRTI: Lamivudine (3TC)', categories: mc(1,1,1,1,1,1) },
  { id: 'arv_nrti_ddi', condition: 'Antiretroviral Therapy', subCondition: 'NRTI: Didanosine (ddI)', categories: mc(1,1,1,1,1,1) },
  { id: 'arv_nrti_ftc', condition: 'Antiretroviral Therapy', subCondition: 'NRTI: Emtricitabine (FTC)', categories: mc(1,1,1,1,1,1) },
  { id: 'arv_nrti_d4t', condition: 'Antiretroviral Therapy', subCondition: 'NRTI: Stavudine (d4T)', categories: mc(1,1,1,1,1,1) },
  // NNRTIs
  { id: 'arv_nnrti_efv', condition: 'Antiretroviral Therapy', subCondition: 'NNRTI: Efavirenz (EFV)', categories: mc(1,1,2,1,2,2) },
  { id: 'arv_nnrti_etr', condition: 'Antiretroviral Therapy', subCondition: 'NNRTI: Etravirine (ETR)', categories: mc(1,1,1,1,1,1) },
  { id: 'arv_nnrti_nvp', condition: 'Antiretroviral Therapy', subCondition: 'NNRTI: Nevirapine (NVP)', categories: mc(1,1,1,1,1,1) },
  { id: 'arv_nnrti_rpv', condition: 'Antiretroviral Therapy', subCondition: 'NNRTI: Rilpivirine (RPV)', categories: mc(1,1,1,1,1,1) },
  // Protease Inhibitors
  { id: 'arv_pi_rtv', condition: 'Antiretroviral Therapy', subCondition: 'PI: Ritonavir-boosted atazanavir (ATV/r)', categories: mc(1,1,2,1,3,3) },
  { id: 'arv_pi_drv', condition: 'Antiretroviral Therapy', subCondition: 'PI: Ritonavir-boosted darunavir (DRV/r)', categories: mc(1,1,2,1,3,3) },
  { id: 'arv_pi_lpv', condition: 'Antiretroviral Therapy', subCondition: 'PI: Ritonavir-boosted lopinavir (LPV/r)', categories: mc(1,1,2,1,3,3) },
  { id: 'arv_pi_rtv_solo', condition: 'Antiretroviral Therapy', subCondition: 'PI: Ritonavir (RTV)', categories: mc(1,1,2,1,3,3) },
  // Integrase Inhibitors
  { id: 'arv_insti_ral', condition: 'Antiretroviral Therapy', subCondition: 'Integrase inhibitor: Raltegravir (RAL)', categories: mc(1,1,1,1,1,1) },
  { id: 'arv_insti_dtg', condition: 'Antiretroviral Therapy', subCondition: 'Integrase inhibitor: Dolutegravir (DTG)', categories: mc(1,1,1,1,1,1) },

  // ── Benign ovarian tumours ──
  { id: 'benign_ovarian', condition: 'Benign ovarian tumours', categories: mc(1,1,1,1,1,1) },

  // ── Blood pressure measurement unavailable ──
  { id: 'bp_unavailable', condition: 'Blood pressure measurement unavailable', categories: mc(1,1,1,1,1,2) },

  // ── Breast diseases ──
  { id: 'breast_benign', condition: 'Breast diseases', subCondition: 'Benign breast disease', categories: mc(1,1,1,1,1,1) },
  { id: 'breast_family_history', condition: 'Breast diseases', subCondition: 'Family history of breast cancer', categories: mc(1,1,1,1,1,1) },
  { id: 'breast_undiagnosed', condition: 'Breast diseases', subCondition: 'Undiagnosed mass', categories: mc(1,2,2,2,2,2) },
  { id: 'breast_cancer_current', condition: 'Breast diseases', subCondition: 'Breast cancer — Current', categories: mc(1,4,4,4,4,4) },
  { id: 'breast_cancer_past', condition: 'Breast diseases', subCondition: 'Breast cancer — Past (no evidence 5+ years)', categories: mc(1,3,3,3,3,3) },

  // ── Breastfeeding ──
  { id: 'bf_lt6w', condition: 'Breastfeeding', subCondition: '< 6 weeks postpartum', categories: mc(1,1,2,2,2,4) },
  { id: 'bf_6w_6m', condition: 'Breastfeeding', subCondition: '6 weeks to < 6 months', categories: mc(1,1,1,1,1,3) },
  { id: 'bf_gte6m', condition: 'Breastfeeding', subCondition: '≥ 6 months', categories: mc(1,1,1,1,1,2) },

  // ── Cardiovascular disease ──
  { id: 'cardiovascular', condition: 'Cardiovascular disease', categories: mc(1,1,1,1,1,1) },

  // ── Cervical cancer (awaiting treatment) ──
  { id: 'cervical_cancer_i', condition: 'Cervical cancer (awaiting treatment)', variant: 'I', categories: mc(4,4,2,2,1,2) },
  { id: 'cervical_cancer_c', condition: 'Cervical cancer (awaiting treatment)', variant: 'C', categories: mc(2,2,2,2,1,2) },

  // ── Cervical ectropion ──
  { id: 'cervical_ectropion', condition: 'Cervical ectropion', categories: mc(1,1,1,1,1,1) },

  // ── Cervical intraepithelial neoplasia (CIN) ──
  { id: 'cin', condition: 'Cervical intraepithelial neoplasia (CIN)', categories: mc(1,2,2,2,1,2) },

  // ── Cirrhosis ──
  { id: 'cirrhosis_mild', condition: 'Cirrhosis', subCondition: 'Mild (compensated)', categories: mc(1,1,1,1,1,1) },
  { id: 'cirrhosis_severe', condition: 'Cirrhosis', subCondition: 'Severe (decompensated)', categories: mc(1,3,3,3,3,4) },

  // ── Current and history of ischaemic heart disease ──
  { id: 'ihd_i', condition: 'Current and history of ischaemic heart disease', variant: 'I', categories: mc(1,2,2,3,2,4) },
  { id: 'ihd_c', condition: 'Current and history of ischaemic heart disease', variant: 'C', categories: mc(1,2,2,3,2,4) },

  // ── Deep vein thrombosis / Pulmonary embolism ──
  { id: 'dvt_history', condition: 'Deep vein thrombosis / Pulmonary embolism', subCondition: 'History of DVT/PE', categories: mc(1,2,2,2,2,4) },
  { id: 'dvt_acute', condition: 'Deep vein thrombosis / Pulmonary embolism', subCondition: 'Acute DVT/PE', categories: mc(1,3,3,3,3,4) },
  { id: 'dvt_anticoagulant', condition: 'Deep vein thrombosis / Pulmonary embolism', subCondition: 'DVT/PE and established on anticoagulant therapy', categories: mc(1,2,2,2,2,4) },
  { id: 'dvt_family', condition: 'Deep vein thrombosis / Pulmonary embolism', subCondition: 'Family history (first-degree relative)', categories: mc(1,1,1,1,1,2) },
  { id: 'dvt_surgery_immob', condition: 'Deep vein thrombosis / Pulmonary embolism', subCondition: 'Major surgery — With prolonged immobilization', categories: mc(1,2,2,2,2,4) },
  { id: 'dvt_minor_surgery', condition: 'Deep vein thrombosis / Pulmonary embolism', subCondition: 'Minor surgery without immobilization', categories: mc(1,1,1,1,1,1) },

  // ── Depressive disorders ──
  { id: 'depressive', condition: 'Depressive disorders', categories: mc(1,1,1,1,1,1) },

  // ── Diabetes ──
  { id: 'diabetes_gestational', condition: 'Diabetes', subCondition: 'History of gestational diabetes', categories: mc(1,1,1,1,1,1) },
  { id: 'diabetes_novasc_noninsulin', condition: 'Diabetes', subCondition: 'Non-vascular disease — Non-insulin dependent', categories: mc(1,2,2,2,2,2) },
  { id: 'diabetes_novasc_insulin', condition: 'Diabetes', subCondition: 'Non-vascular disease — Insulin dependent', categories: mc(1,2,2,2,2,2) },
  { id: 'diabetes_nephropathy', condition: 'Diabetes', subCondition: 'Nephropathy/retinopathy/neuropathy', categories: mc(1,2,2,3,2,3) },
  { id: 'diabetes_vascular_other', condition: 'Diabetes', subCondition: 'Other vascular disease or > 20 years duration', categories: mc(1,2,2,3,2,3) },

  // ── Endometrial cancer ──
  { id: 'endometrial_i', condition: 'Endometrial cancer', variant: 'I', categories: mc(4,4,1,1,1,1) },
  { id: 'endometrial_c', condition: 'Endometrial cancer', variant: 'C', categories: mc(2,2,1,1,1,1) },

  // ── Endometriosis ──
  { id: 'endometriosis', condition: 'Endometriosis', categories: mc(2,1,1,1,1,1) },

  // ── Epilepsy ──
  { id: 'epilepsy', condition: 'Epilepsy', categories: mc(1,1,1,1,1,1) },

  // ── Gall bladder diseases ──
  { id: 'gallbladder_asymptomatic', condition: 'Gall bladder diseases', subCondition: 'Asymptomatic', categories: mc(1,2,2,2,2,2) },
  { id: 'gallbladder_treated', condition: 'Gall bladder diseases', subCondition: 'Symptomatic — Treated by cholecystectomy', categories: mc(1,2,2,2,2,2) },
  { id: 'gallbladder_medically', condition: 'Gall bladder diseases', subCondition: 'Symptomatic — Medically treated', categories: mc(1,2,2,2,2,3) },
  { id: 'gallbladder_current', condition: 'Gall bladder diseases', subCondition: 'Symptomatic — Current', categories: mc(1,2,2,2,2,3) },

  // ── Gestational trophoblastic diseases ──
  { id: 'gtd_decreasing', condition: 'Gestational trophoblastic diseases', subCondition: 'Decreasing or undetectable β-hCG', categories: mc(3,3,1,1,1,1) },
  { id: 'gtd_persistent', condition: 'Gestational trophoblastic diseases', subCondition: 'Persistently elevated β-hCG or malignant', categories: mc(4,4,1,1,1,1) },

  // ── Headaches ──
  { id: 'headache_nonmig_i', condition: 'Headaches', subCondition: 'Non-migrainous', variant: 'I', categories: mc(1,1,1,1,1,1) },
  { id: 'headache_nonmig_c', condition: 'Headaches', subCondition: 'Non-migrainous', variant: 'C', categories: mc(1,1,1,1,1,2) },
  { id: 'migraine_noaura_lt35_i', condition: 'Headaches', subCondition: 'Migraine without aura, age < 35', variant: 'I', categories: mc(1,1,1,1,1,2) },
  { id: 'migraine_noaura_lt35_c', condition: 'Headaches', subCondition: 'Migraine without aura, age < 35', variant: 'C', categories: mc(1,2,2,2,1,3) },
  { id: 'migraine_noaura_gte35_i', condition: 'Headaches', subCondition: 'Migraine without aura, age ≥ 35', variant: 'I', categories: mc(1,1,1,1,1,3) },
  { id: 'migraine_noaura_gte35_c', condition: 'Headaches', subCondition: 'Migraine without aura, age ≥ 35', variant: 'C', categories: mc(1,2,2,2,1,4) },
  { id: 'migraine_aura_i', condition: 'Headaches', subCondition: 'Migraine with aura (any age)', variant: 'I', categories: mc(1,2,2,2,2,4) },
  { id: 'migraine_aura_c', condition: 'Headaches', subCondition: 'Migraine with aura (any age)', variant: 'C', categories: mc(1,2,2,2,2,4) },

  // ── History of cholestasis ──
  { id: 'cholestasis_pregnancy', condition: 'History of cholestasis', subCondition: 'Pregnancy-related', categories: mc(1,1,1,1,1,2) },
  { id: 'cholestasis_coc', condition: 'History of cholestasis', subCondition: 'COC-related', categories: mc(1,1,1,1,1,3) },

  // ── History of high blood pressure during pregnancy ──
  { id: 'htn_preg_history', condition: 'History of high blood pressure during pregnancy', categories: mc(1,1,1,1,1,2) },

  // ── History of pelvic surgery ──
  { id: 'pelvic_surgery', condition: 'History of pelvic surgery', categories: mc(1,1,1,1,1,1) },

  // ── HIV/AIDS ──
  { id: 'hiv_high_risk', condition: 'HIV/AIDS', subCondition: 'High risk of HIV', categories: mc(2,2,1,1,1,1) },
  { id: 'hiv_asymptomatic', condition: 'HIV/AIDS', subCondition: 'Asymptomatic or mild (WHO stage 1–2)', categories: mc(2,2,1,1,1,1) },
  { id: 'hiv_severe_i', condition: 'HIV/AIDS', subCondition: 'Severe or advanced (WHO stage 3–4)', variant: 'I', categories: mc(3,3,1,1,1,1) },
  { id: 'hiv_severe_c', condition: 'HIV/AIDS', subCondition: 'Severe or advanced (WHO stage 3–4)', variant: 'C', categories: mc(2,2,1,1,1,1) },

  // ── Hypertension ──
  { id: 'htn_history_preg', condition: 'Hypertension', subCondition: 'History of hypertension during pregnancy (current BP normal)', categories: mc(1,1,1,1,1,2) },
  { id: 'htn_controlled', condition: 'Hypertension', subCondition: 'Adequately controlled', categories: mc(1,1,1,2,1,3) },
  { id: 'htn_140_159', condition: 'Hypertension', subCondition: 'Elevated — Systolic 140–159 or diastolic 90–99', categories: mc(1,1,1,2,1,3) },
  { id: 'htn_gte160', condition: 'Hypertension', subCondition: 'Elevated — Systolic ≥ 160 or diastolic ≥ 100', categories: mc(1,2,2,3,2,4) },
  { id: 'htn_vascular', condition: 'Hypertension', subCondition: 'Vascular disease', categories: mc(1,2,2,3,2,4) },

  // ── Iron-deficient anaemia ──
  { id: 'iron_anaemia', condition: 'Iron-deficient anaemia', categories: mc(2,1,1,1,1,1) },

  // ── Known dyslipidaemias ──
  { id: 'dyslipidaemia', condition: 'Known dyslipidaemias', categories: mc(1,2,2,2,2,2) },

  // ── Known thrombogenic mutations ──
  { id: 'thrombogenic', condition: 'Known thrombogenic mutations', categories: mc(1,2,2,2,2,4) },

  // ── Liver tumours ──
  { id: 'liver_fnh', condition: 'Liver tumours', subCondition: 'Benign — Focal nodular hyperplasia', categories: mc(1,2,2,2,2,2) },
  { id: 'liver_adenoma', condition: 'Liver tumours', subCondition: 'Benign — Hepatocellular adenoma', categories: mc(1,3,3,3,3,4) },
  { id: 'liver_malignant', condition: 'Liver tumours', subCondition: 'Malignant (hepatocellular carcinoma)', categories: mc(1,3,3,3,3,4) },

  // ── Malaria ──
  { id: 'malaria', condition: 'Malaria', categories: mc(1,1,1,1,1,1) },

  // ── Obesity ──
  { id: 'obesity_gte30', condition: 'Obesity', subCondition: 'BMI ≥ 30 kg/m²', categories: mc(1,1,1,2,1,2) },
  { id: 'obesity_menarche_lt18', condition: 'Obesity', subCondition: 'Menarche to < 18 years, BMI ≥ 30 kg/m²', categories: mc(1,1,1,2,1,2) },

  // ── Ovarian cancer ──
  { id: 'ovarian_i', condition: 'Ovarian cancer', variant: 'I', categories: mc(3,3,1,1,1,1) },
  { id: 'ovarian_c', condition: 'Ovarian cancer', variant: 'C', categories: mc(1,1,1,1,1,1) },

  // ── Parity ──
  { id: 'parity_nulliparous', condition: 'Parity', subCondition: 'Nulliparous', categories: mc(2,2,1,1,1,1) },
  { id: 'parity_parous', condition: 'Parity', subCondition: 'Parous (1 or more)', categories: mc(1,1,1,1,1,1) },

  // ── Past ectopic pregnancy ──
  { id: 'past_ectopic', condition: 'Past ectopic pregnancy', categories: mc(1,1,1,1,1,1) },

  // ── Pelvic inflammatory disease ──
  { id: 'pid_past_with', condition: 'Pelvic inflammatory disease', subCondition: 'Past PID — With subsequent pregnancy', categories: mc(1,1,1,1,1,1) },
  { id: 'pid_past_without', condition: 'Pelvic inflammatory disease', subCondition: 'Past PID — Without subsequent pregnancy', categories: mc(2,2,1,1,1,1) },
  { id: 'pid_current_i', condition: 'Pelvic inflammatory disease', subCondition: 'Current PID', variant: 'I', categories: mc(4,4,1,1,1,1) },
  { id: 'pid_current_c', condition: 'Pelvic inflammatory disease', subCondition: 'Current PID', variant: 'C', categories: mc(2,2,1,1,1,1) },

  // ── Post abortion ──
  { id: 'postabortion_1st', condition: 'Post abortion', subCondition: 'First trimester', categories: mc(1,1,1,1,1,1) },
  { id: 'postabortion_2nd', condition: 'Post abortion', subCondition: 'Second trimester', categories: mc(2,2,1,1,1,1) },
  { id: 'postabortion_septic', condition: 'Post abortion', subCondition: 'Post-septic abortion', categories: mc(4,4,1,1,1,1) },

  // ── Postpartum ──
  // Not breastfeeding
  { id: 'pp_nbf_lt48h', condition: 'Postpartum', subCondition: 'Not breastfeeding — < 48 hours', categories: mc(1,1,1,1,1,4) },
  { id: 'pp_nbf_48h_4w', condition: 'Postpartum', subCondition: 'Not breastfeeding — ≥ 48 hours to < 4 weeks', categories: mc(3,3,1,1,1,4) },
  { id: 'pp_nbf_gte4w', condition: 'Postpartum', subCondition: 'Not breastfeeding — ≥ 4 weeks', categories: mc(1,1,1,1,1,1) },
  // Breastfeeding
  { id: 'pp_bf_lt48h', condition: 'Postpartum', subCondition: 'Breastfeeding — < 48 hours', categories: mc(1,1,2,2,2,4) },
  { id: 'pp_bf_48h_4w', condition: 'Postpartum', subCondition: 'Breastfeeding — ≥ 48 hours to < 4 weeks', categories: mc(3,3,1,1,1,4) },
  { id: 'pp_bf_gte4w', condition: 'Postpartum', subCondition: 'Breastfeeding — ≥ 4 weeks', categories: mc(1,1,1,1,1,3) },
  // Risk for VTE
  { id: 'pp_vte_lt48h', condition: 'Postpartum', subCondition: 'Risk for VTE — < 48 hours', categories: mc(1,1,1,1,1,4) },
  { id: 'pp_vte_48h_4w', condition: 'Postpartum', subCondition: 'Risk for VTE — ≥ 48 hours to < 4 weeks', categories: mc(3,3,1,1,1,4) },
  { id: 'pp_vte_gte4w', condition: 'Postpartum', subCondition: 'Risk for VTE — ≥ 4 weeks', categories: mc(1,1,1,1,1,3) },
  // Puerperal sepsis
  { id: 'pp_sepsis_lt48h', condition: 'Postpartum', subCondition: 'Puerperal sepsis — < 48 hours', categories: mc(4,4,1,1,1,4) },
  { id: 'pp_sepsis_48h_4w', condition: 'Postpartum', subCondition: 'Puerperal sepsis — ≥ 48 hours to < 4 weeks', categories: mc(4,4,1,1,1,4) },
  { id: 'pp_sepsis_gte4w', condition: 'Postpartum', subCondition: 'Puerperal sepsis — ≥ 4 weeks', categories: mc(1,1,1,1,1,1) },

  // ── Pregnancy ──
  { id: 'pregnancy', condition: 'Pregnancy', categories: mc(4,4,4,4,4,4) },

  // ── Schistosomiasis ──
  { id: 'schisto_uncomplicated', condition: 'Schistosomiasis', subCondition: 'Uncomplicated', categories: mc(1,1,1,1,1,1) },
  { id: 'schisto_fibrosis', condition: 'Schistosomiasis', subCondition: 'Fibrosis of the liver', categories: mc(1,1,1,1,1,1) },

  // ── Severe dysmenorrhoea ──
  { id: 'severe_dysmenorrhoea', condition: 'Severe dysmenorrhoea', categories: mc(2,1,1,1,1,1) },

  // ── Sexually transmitted infections ──
  { id: 'sti_current_i', condition: 'Sexually transmitted infections', subCondition: 'Current purulent cervicitis/chlamydia/gonorrhoea', variant: 'I', categories: mc(4,4,1,1,1,1) },
  { id: 'sti_current_c', condition: 'Sexually transmitted infections', subCondition: 'Current purulent cervicitis/chlamydia/gonorrhoea', variant: 'C', categories: mc(2,2,1,1,1,1) },
  { id: 'sti_other', condition: 'Sexually transmitted infections', subCondition: 'Other STIs (excluding HIV and hepatitis)', categories: mc(2,2,1,1,1,1) },
  { id: 'sti_vaginitis', condition: 'Sexually transmitted infections', subCondition: 'Vaginitis (trichomonas/bacterial vaginosis)', categories: mc(2,2,1,1,1,1) },
  { id: 'sti_risk_i', condition: 'Sexually transmitted infections', subCondition: 'Increased risk of STIs', variant: 'I', categories: mc(2,2,1,1,1,1) },
  { id: 'sti_risk_c', condition: 'Sexually transmitted infections', subCondition: 'Increased risk of STIs', variant: 'C', categories: mc(2,2,1,1,1,1) },

  // ── Sickle cell disease ──
  { id: 'sickle_cell', condition: 'Sickle cell disease', categories: mc(2,2,1,1,1,2) },

  // ── Smoking ──
  { id: 'smoking_lt35', condition: 'Smoking', subCondition: 'Age < 35', categories: mc(1,1,1,1,1,2) },
  { id: 'smoking_gte35_lt15', condition: 'Smoking', subCondition: 'Age ≥ 35 — < 15 cigarettes/day', categories: mc(1,1,1,1,1,3) },
  { id: 'smoking_gte35_gte15', condition: 'Smoking', subCondition: 'Age ≥ 35 — ≥ 15 cigarettes/day', categories: mc(1,1,1,1,1,4) },

  // ── Stroke ──
  { id: 'stroke_i', condition: 'Stroke', variant: 'I', categories: mc(1,2,2,3,2,4) },
  { id: 'stroke_c', condition: 'Stroke', variant: 'C', categories: mc(1,2,2,3,2,4) },

  // ── Superficial venous disorders ──
  { id: 'svd_varicose', condition: 'Superficial venous disorders', subCondition: 'Varicose veins', categories: mc(1,1,1,1,1,1) },
  { id: 'svd_thrombophlebitis', condition: 'Superficial venous disorders', subCondition: 'Superficial venous thrombophlebitis', categories: mc(1,1,1,1,1,2) },

  // ── Systemic lupus erythematosus ──
  { id: 'sle_pos_i', condition: 'Systemic lupus erythematosus', subCondition: 'Positive/unknown antiphospholipid antibodies', variant: 'I', categories: mc(1,3,3,3,3,4) },
  { id: 'sle_pos_c', condition: 'Systemic lupus erythematosus', subCondition: 'Positive/unknown antiphospholipid antibodies', variant: 'C', categories: mc(1,3,3,3,3,4) },
  { id: 'sle_thromb_i', condition: 'Systemic lupus erythematosus', subCondition: 'Severe thrombocytopenia', variant: 'I', categories: mc(3,2,2,2,2,2) },
  { id: 'sle_thromb_c', condition: 'Systemic lupus erythematosus', subCondition: 'Severe thrombocytopenia', variant: 'C', categories: mc(2,2,2,2,2,2) },
  { id: 'sle_immuno_i', condition: 'Systemic lupus erythematosus', subCondition: 'Immunosuppressive treatment', variant: 'I', categories: mc(2,2,2,2,2,2) },
  { id: 'sle_immuno_c', condition: 'Systemic lupus erythematosus', subCondition: 'Immunosuppressive treatment', variant: 'C', categories: mc(2,2,2,2,2,2) },
  { id: 'sle_none_i', condition: 'Systemic lupus erythematosus', subCondition: 'None of the above', variant: 'I', categories: mc(1,1,1,1,1,2) },
  { id: 'sle_none_c', condition: 'Systemic lupus erythematosus', subCondition: 'None of the above', variant: 'C', categories: mc(1,1,1,1,1,2) },

  // ── Thalassaemia ──
  { id: 'thalassaemia', condition: 'Thalassaemia', categories: mc(2,1,1,1,1,1) },

  // ── Thyroid disorders ──
  { id: 'thyroid_goitre', condition: 'Thyroid disorders', subCondition: 'Simple goitre', categories: mc(1,1,1,1,1,1) },
  { id: 'thyroid_hyper', condition: 'Thyroid disorders', subCondition: 'Hyperthyroid', categories: mc(1,1,1,1,1,1) },
  { id: 'thyroid_hypo', condition: 'Thyroid disorders', subCondition: 'Hypothyroid', categories: mc(1,1,1,1,1,1) },

  // ── Tuberculosis ──
  { id: 'tb_nonpelvic_i', condition: 'Tuberculosis', subCondition: 'Non-pelvic', variant: 'I', categories: mc(1,1,1,1,1,1) },
  { id: 'tb_nonpelvic_c', condition: 'Tuberculosis', subCondition: 'Non-pelvic', variant: 'C', categories: mc(1,1,1,1,1,1) },
  { id: 'tb_pelvic_i', condition: 'Tuberculosis', subCondition: 'Pelvic', variant: 'I', categories: mc(4,4,1,1,1,1) },
  { id: 'tb_pelvic_c', condition: 'Tuberculosis', subCondition: 'Pelvic', variant: 'C', categories: mc(3,3,1,1,1,1) },

  // ── Unexplained vaginal bleeding ──
  { id: 'unexplained_vb_i', condition: 'Unexplained vaginal bleeding', subCondition: 'Before evaluation', variant: 'I', categories: mc(4,4,3,3,3,3) },
  { id: 'unexplained_vb_c', condition: 'Unexplained vaginal bleeding', subCondition: 'Before evaluation', variant: 'C', categories: mc(2,2,1,1,1,1) },

  // ── Uterine fibroids ──
  { id: 'fibroids_no_distortion', condition: 'Uterine fibroids', subCondition: 'Without distortion of the uterine cavity', categories: mc(1,1,1,1,1,1) },
  { id: 'fibroids_distortion', condition: 'Uterine fibroids', subCondition: 'With distortion of the uterine cavity', categories: mc(4,4,1,1,1,1) },

  // ── Vaginal bleeding patterns ──
  { id: 'vb_irregular', condition: 'Vaginal bleeding patterns', subCondition: 'Irregular pattern without heavy bleeding', categories: mc(1,1,1,2,2,1) },
  { id: 'vb_heavy_i', condition: 'Vaginal bleeding patterns', subCondition: 'Heavy or prolonged', variant: 'I', categories: mc(2,1,1,1,1,1) },
  { id: 'vb_heavy_c', condition: 'Vaginal bleeding patterns', subCondition: 'Heavy or prolonged', variant: 'C', categories: mc(1,1,1,1,1,1) },

  // ── Valvular heart disease ──
  { id: 'vhd_uncomplicated', condition: 'Valvular heart disease', subCondition: 'Uncomplicated', categories: mc(1,1,1,1,1,2) },
  { id: 'vhd_complicated', condition: 'Valvular heart disease', subCondition: 'Complicated (pulmonary HT, AF, history SBE)', categories: mc(2,2,1,1,1,4) },

  // ── Viral hepatitis ──
  { id: 'hepatitis_acute_i', condition: 'Viral hepatitis', subCondition: 'Acute or flare', variant: 'I', categories: mc(1,1,1,1,1,3) },
  { id: 'hepatitis_acute_c', condition: 'Viral hepatitis', subCondition: 'Acute or flare', variant: 'C', categories: mc(1,1,1,1,1,2) },
  { id: 'hepatitis_carrier', condition: 'Viral hepatitis', subCondition: 'Carrier', categories: mc(1,1,1,1,1,1) },
  { id: 'hepatitis_chronic', condition: 'Viral hepatitis', subCondition: 'Chronic', categories: mc(1,1,1,1,1,1) },
];

// ─── Utility functions ───────────────────────────────────────────────────────

/** Get sorted unique parent condition names */
export function getParentConditions(): string[] {
  const names = new Set<string>();
  WHO_MEC_CONDITIONS.forEach(c => names.add(c.condition));
  return Array.from(names).sort();
}

/** Get all entries for a given parent condition */
export function getEntriesForCondition(conditionName: string): MecConditionEntry[] {
  return WHO_MEC_CONDITIONS.filter(c => c.condition === conditionName);
}

/**
 * Build a tree structure for UI display.
 * Returns: { conditionName: { subCondition?: { variant?: entry } } }
 */
export interface ConditionTreeNode {
  /** Entries without sub-conditions or I/C (leaf at parent level) */
  directEntry?: MecConditionEntry;
  /** Sub-conditions grouped */
  subs: Record<string, {
    /** Entry without I/C variant */
    directEntry?: MecConditionEntry;
    /** I/C variants */
    initiation?: MecConditionEntry;
    continuation?: MecConditionEntry;
  }>;
  /** I/C at parent level (no sub-condition) */
  initiation?: MecConditionEntry;
  continuation?: MecConditionEntry;
}

export function buildConditionTree(): Record<string, ConditionTreeNode> {
  const tree: Record<string, ConditionTreeNode> = {};

  for (const entry of WHO_MEC_CONDITIONS) {
    if (!tree[entry.condition]) {
      tree[entry.condition] = { subs: {} };
    }
    const node = tree[entry.condition];

    if (!entry.subCondition) {
      // No sub-condition
      if (entry.variant === 'I') node.initiation = entry;
      else if (entry.variant === 'C') node.continuation = entry;
      else node.directEntry = entry;
    } else {
      // Has sub-condition
      if (!node.subs[entry.subCondition]) {
        node.subs[entry.subCondition] = {};
      }
      const sub = node.subs[entry.subCondition];
      if (entry.variant === 'I') sub.initiation = entry;
      else if (entry.variant === 'C') sub.continuation = entry;
      else sub.directEntry = entry;
    }
  }

  return tree;
}

/**
 * Combine multiple condition entries by taking the most restrictive category.
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
