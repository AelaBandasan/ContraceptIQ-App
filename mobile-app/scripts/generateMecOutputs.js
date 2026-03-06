#!/usr/bin/env node
/**
 * WHO MEC Output Generator — mirrors whoMecData.ts (165 entries, 56 parents)
 * Generates mecConditionOutputs.json and mecPreferenceScores.json
 *
 * Usage:  node scripts/generateMecOutputs.js
 */

const fs = require('fs');
const path = require('path');

const METHOD_IDS = ['Cu-IUD', 'LNG-IUD', 'Implant', 'DMPA', 'POP', 'CHC'];

const AGE_GROUPS = [
  { label: '<18', representative: 16 },
  { label: '18-39', representative: 25 },
  { label: '>=40', representative: 45 },
];

function getBaseByAge(age) {
  if (age < 18) return [2, 2, 1, 2, 1, 1];
  if (age <= 39) return [1, 1, 1, 1, 1, 1];
  return [1, 1, 1, 2, 1, 2];
}

const METHOD_ATTRIBUTES = {
  'Cu-IUD':  { effectiveness: true, sti: false, nonhormonal: true,  regular: false, privacy: true,  client: false, longterm: true  },
  'LNG-IUD': { effectiveness: true, sti: false, nonhormonal: false, regular: true,  privacy: true,  client: false, longterm: true  },
  'Implant': { effectiveness: true, sti: false, nonhormonal: false, regular: false, privacy: true,  client: false, longterm: true  },
  'DMPA':    { effectiveness: true, sti: false, nonhormonal: false, regular: false, privacy: true,  client: false, longterm: false },
  'POP':     { effectiveness: false,sti: false, nonhormonal: false, regular: false, privacy: true,  client: true,  longterm: false },
  'CHC':     { effectiveness: false,sti: false, nonhormonal: false, regular: true,  privacy: false, client: true,  longterm: false },
};

const PREFERENCE_KEYS = ['regular', 'effectiveness', 'longterm', 'privacy', 'client', 'nonhormonal', 'sti'];

// All 165 condition entries [Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC]
const CONDITIONS = {
  // Anticonvulsant Therapy
  'anticonv_phenytoin': [1,1,2,1,3,3],
  'anticonv_lamotrigine': [1,1,1,1,1,3],
  // Antimicrobial Therapy
  'antimicro_broadspectrum': [1,1,1,1,1,1],
  'antimicro_antifungals': [1,1,1,1,1,1],
  'antimicro_antiparasitics': [1,1,1,1,1,1],
  'antimicro_rifampicin': [1,1,2,1,3,3],
  // Antiretroviral Therapy - NRTIs
  'arv_nrti_abc': [1,1,1,1,1,1],
  'arv_nrti_tdf': [1,1,1,1,1,1],
  'arv_nrti_azt': [1,1,1,1,1,1],
  'arv_nrti_3tc': [1,1,1,1,1,1],
  'arv_nrti_ddi': [1,1,1,1,1,1],
  'arv_nrti_ftc': [1,1,1,1,1,1],
  'arv_nrti_d4t': [1,1,1,1,1,1],
  // Antiretroviral Therapy - NNRTIs
  'arv_nnrti_efv': [1,1,2,1,2,2],
  'arv_nnrti_etr': [1,1,1,1,1,1],
  'arv_nnrti_nvp': [1,1,1,1,1,1],
  'arv_nnrti_rpv': [1,1,1,1,1,1],
  // Antiretroviral Therapy - PIs
  'arv_pi_rtv': [1,1,2,1,3,3],
  'arv_pi_drv': [1,1,2,1,3,3],
  'arv_pi_lpv': [1,1,2,1,3,3],
  'arv_pi_rtv_solo': [1,1,2,1,3,3],
  // Antiretroviral Therapy - Integrase Inhibitors
  'arv_insti_ral': [1,1,1,1,1,1],
  'arv_insti_dtg': [1,1,1,1,1,1],
  // Benign ovarian tumours
  'benign_ovarian': [1,1,1,1,1,1],
  // Blood pressure measurement unavailable
  'bp_unavailable': [1,1,1,1,1,2],
  // Breast diseases
  'breast_benign': [1,1,1,1,1,1],
  'breast_family_history': [1,1,1,1,1,1],
  'breast_undiagnosed': [1,2,2,2,2,2],
  'breast_cancer_current': [1,4,4,4,4,4],
  'breast_cancer_past': [1,3,3,3,3,3],
  // Breastfeeding
  'bf_lt6w': [1,1,2,2,2,4],
  'bf_6w_6m': [1,1,1,1,1,3],
  'bf_gte6m': [1,1,1,1,1,2],
  // Cardiovascular disease
  'cardiovascular': [1,1,1,1,1,1],
  // Cervical cancer
  'cervical_cancer_i': [4,4,2,2,1,2],
  'cervical_cancer_c': [2,2,2,2,1,2],
  // Cervical ectropion
  'cervical_ectropion': [1,1,1,1,1,1],
  // CIN
  'cin': [1,2,2,2,1,2],
  // Cirrhosis
  'cirrhosis_mild': [1,1,1,1,1,1],
  'cirrhosis_severe': [1,3,3,3,3,4],
  // Ischaemic heart disease
  'ihd_i': [1,2,2,3,2,4],
  'ihd_c': [1,2,2,3,2,4],
  // DVT/PE
  'dvt_history': [1,2,2,2,2,4],
  'dvt_acute': [1,3,3,3,3,4],
  'dvt_anticoagulant': [1,2,2,2,2,4],
  'dvt_family': [1,1,1,1,1,2],
  'dvt_surgery_immob': [1,2,2,2,2,4],
  'dvt_minor_surgery': [1,1,1,1,1,1],
  // Depressive disorders
  'depressive': [1,1,1,1,1,1],
  // Diabetes
  'diabetes_gestational': [1,1,1,1,1,1],
  'diabetes_novasc_noninsulin': [1,2,2,2,2,2],
  'diabetes_novasc_insulin': [1,2,2,2,2,2],
  'diabetes_nephropathy': [1,2,2,3,2,3],
  'diabetes_vascular_other': [1,2,2,3,2,3],
  // Endometrial cancer
  'endometrial_i': [4,4,1,1,1,1],
  'endometrial_c': [2,2,1,1,1,1],
  // Endometriosis
  'endometriosis': [2,1,1,1,1,1],
  // Epilepsy
  'epilepsy': [1,1,1,1,1,1],
  // Gall bladder
  'gallbladder_asymptomatic': [1,2,2,2,2,2],
  'gallbladder_treated': [1,2,2,2,2,2],
  'gallbladder_medically': [1,2,2,2,2,3],
  'gallbladder_current': [1,2,2,2,2,3],
  // GTD
  'gtd_decreasing': [3,3,1,1,1,1],
  'gtd_persistent': [4,4,1,1,1,1],
  // Headaches
  'headache_nonmig_i': [1,1,1,1,1,1],
  'headache_nonmig_c': [1,1,1,1,1,2],
  'migraine_noaura_lt35_i': [1,1,1,1,1,2],
  'migraine_noaura_lt35_c': [1,2,2,2,1,3],
  'migraine_noaura_gte35_i': [1,1,1,1,1,3],
  'migraine_noaura_gte35_c': [1,2,2,2,1,4],
  'migraine_aura_i': [1,2,2,2,2,4],
  'migraine_aura_c': [1,2,2,2,2,4],
  // Cholestasis
  'cholestasis_pregnancy': [1,1,1,1,1,2],
  'cholestasis_coc': [1,1,1,1,1,3],
  // History of high BP during pregnancy
  'htn_preg_history': [1,1,1,1,1,2],
  // Pelvic surgery
  'pelvic_surgery': [1,1,1,1,1,1],
  // HIV/AIDS
  'hiv_high_risk': [2,2,1,1,1,1],
  'hiv_asymptomatic': [2,2,1,1,1,1],
  'hiv_severe_i': [3,3,1,1,1,1],
  'hiv_severe_c': [2,2,1,1,1,1],
  // Hypertension
  'htn_history_preg': [1,1,1,1,1,2],
  'htn_controlled': [1,1,1,2,1,3],
  'htn_140_159': [1,1,1,2,1,3],
  'htn_gte160': [1,2,2,3,2,4],
  'htn_vascular': [1,2,2,3,2,4],
  // Iron-deficient anaemia
  'iron_anaemia': [2,1,1,1,1,1],
  // Dyslipidaemias
  'dyslipidaemia': [1,2,2,2,2,2],
  // Thrombogenic mutations
  'thrombogenic': [1,2,2,2,2,4],
  // Liver tumours
  'liver_fnh': [1,2,2,2,2,2],
  'liver_adenoma': [1,3,3,3,3,4],
  'liver_malignant': [1,3,3,3,3,4],
  // Malaria
  'malaria': [1,1,1,1,1,1],
  // Obesity
  'obesity_gte30': [1,1,1,2,1,2],
  'obesity_menarche_lt18': [1,1,1,2,1,2],
  // Ovarian cancer
  'ovarian_i': [3,3,1,1,1,1],
  'ovarian_c': [1,1,1,1,1,1],
  // Parity
  'parity_nulliparous': [2,2,1,1,1,1],
  'parity_parous': [1,1,1,1,1,1],
  // Past ectopic
  'past_ectopic': [1,1,1,1,1,1],
  // PID
  'pid_past_with': [1,1,1,1,1,1],
  'pid_past_without': [2,2,1,1,1,1],
  'pid_current_i': [4,4,1,1,1,1],
  'pid_current_c': [2,2,1,1,1,1],
  // Post abortion
  'postabortion_1st': [1,1,1,1,1,1],
  'postabortion_2nd': [2,2,1,1,1,1],
  'postabortion_septic': [4,4,1,1,1,1],
  // Postpartum
  'pp_nbf_lt48h': [1,1,1,1,1,4],
  'pp_nbf_48h_4w': [3,3,1,1,1,4],
  'pp_nbf_gte4w': [1,1,1,1,1,1],
  'pp_bf_lt48h': [1,1,2,2,2,4],
  'pp_bf_48h_4w': [3,3,1,1,1,4],
  'pp_bf_gte4w': [1,1,1,1,1,3],
  'pp_vte_lt48h': [1,1,1,1,1,4],
  'pp_vte_48h_4w': [3,3,1,1,1,4],
  'pp_vte_gte4w': [1,1,1,1,1,3],
  'pp_sepsis_lt48h': [4,4,1,1,1,4],
  'pp_sepsis_48h_4w': [4,4,1,1,1,4],
  'pp_sepsis_gte4w': [1,1,1,1,1,1],
  // Pregnancy
  'pregnancy': [4,4,4,4,4,4],
  // Schistosomiasis
  'schisto_uncomplicated': [1,1,1,1,1,1],
  'schisto_fibrosis': [1,1,1,1,1,1],
  // Severe dysmenorrhoea
  'severe_dysmenorrhoea': [2,1,1,1,1,1],
  // STIs
  'sti_current_i': [4,4,1,1,1,1],
  'sti_current_c': [2,2,1,1,1,1],
  'sti_other': [2,2,1,1,1,1],
  'sti_vaginitis': [2,2,1,1,1,1],
  'sti_risk_i': [2,2,1,1,1,1],
  'sti_risk_c': [2,2,1,1,1,1],
  // Sickle cell
  'sickle_cell': [2,2,1,1,1,2],
  // Smoking
  'smoking_lt35': [1,1,1,1,1,2],
  'smoking_gte35_lt15': [1,1,1,1,1,3],
  'smoking_gte35_gte15': [1,1,1,1,1,4],
  // Stroke
  'stroke_i': [1,2,2,3,2,4],
  'stroke_c': [1,2,2,3,2,4],
  // Superficial venous disorders
  'svd_varicose': [1,1,1,1,1,1],
  'svd_thrombophlebitis': [1,1,1,1,1,2],
  // SLE
  'sle_pos_i': [1,3,3,3,3,4],
  'sle_pos_c': [1,3,3,3,3,4],
  'sle_thromb_i': [3,2,2,2,2,2],
  'sle_thromb_c': [2,2,2,2,2,2],
  'sle_immuno_i': [2,2,2,2,2,2],
  'sle_immuno_c': [2,2,2,2,2,2],
  'sle_none_i': [1,1,1,1,1,2],
  'sle_none_c': [1,1,1,1,1,2],
  // Thalassaemia
  'thalassaemia': [2,1,1,1,1,1],
  // Thyroid
  'thyroid_goitre': [1,1,1,1,1,1],
  'thyroid_hyper': [1,1,1,1,1,1],
  'thyroid_hypo': [1,1,1,1,1,1],
  // Tuberculosis
  'tb_nonpelvic_i': [1,1,1,1,1,1],
  'tb_nonpelvic_c': [1,1,1,1,1,1],
  'tb_pelvic_i': [4,4,1,1,1,1],
  'tb_pelvic_c': [3,3,1,1,1,1],
  // Unexplained vaginal bleeding
  'unexplained_vb_i': [4,4,3,3,3,3],
  'unexplained_vb_c': [2,2,1,1,1,1],
  // Uterine fibroids
  'fibroids_no_distortion': [1,1,1,1,1,1],
  'fibroids_distortion': [4,4,1,1,1,1],
  // Vaginal bleeding patterns
  'vb_irregular': [1,1,1,2,2,1],
  'vb_heavy_i': [2,1,1,1,1,1],
  'vb_heavy_c': [1,1,1,1,1,1],
  // Valvular heart disease
  'vhd_uncomplicated': [1,1,1,1,1,2],
  'vhd_complicated': [2,2,1,1,1,4],
  // Viral hepatitis
  'hepatitis_acute_i': [1,1,1,1,1,3],
  'hepatitis_acute_c': [1,1,1,1,1,2],
  'hepatitis_carrier': [1,1,1,1,1,1],
  'hepatitis_chronic': [1,1,1,1,1,1],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function combinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const rest = combinations(arr.slice(i + 1), k - 1);
    for (const combo of rest) result.push([arr[i], ...combo]);
  }
  return result;
}

function combineCategories(base, conditionIds) {
  const result = [...base];
  for (const condId of conditionIds) {
    const cats = CONDITIONS[condId];
    if (!cats) continue;
    for (let i = 0; i < 6; i++) result[i] = Math.max(result[i], cats[i]);
  }
  return result;
}

function powerSet(arr) {
  const result = [[]];
  for (const item of arr) {
    const len = result.length;
    for (let i = 0; i < len; i++) result.push([...result[i], item]);
  }
  return result;
}

function generateConditionOutputs() {
  console.log('Generating condition combination outputs...\n');
  const conditionIds = Object.keys(CONDITIONS);
  const N = conditionIds.length;

  let allCombos = [[]];
  for (let k = 1; k <= 3; k++) allCombos = allCombos.concat(combinations(conditionIds, k));

  console.log(`  Total condition entries: ${N}`);
  console.log(`  Total condition combos: ${allCombos.length}`);
  console.log(`  × ${AGE_GROUPS.length} age groups = ${allCombos.length * AGE_GROUPS.length} entries\n`);

  const entries = [];
  for (let ageIdx = 0; ageIdx < AGE_GROUPS.length; ageIdx++) {
    const base = getBaseByAge(AGE_GROUPS[ageIdx].representative);
    for (const combo of allCombos) entries.push([ageIdx, combo, combineCategories(base, combo)]);
    console.log(`  Age group "${AGE_GROUPS[ageIdx].label}": ${allCombos.length} entries`);
  }

  return {
    metadata: {
      source: 'WHO MEC 5th Edition (2015)',
      generatedAt: new Date().toISOString(),
      ageGroups: AGE_GROUPS.map(a => a.label),
      methods: METHOD_IDS,
      totalConditions: N,
      totalParentConditions: 56,
      maxConditions: 3,
      totalEntries: entries.length,
      format: '[ageGroupIndex, [conditionIds], [6 MEC categories]]',
    },
    conditionDatabase: CONDITIONS,
    entries,
  };
}

function generatePreferenceOutputs() {
  console.log('\nGenerating preference combination scores...\n');
  const prefCombos = powerSet(PREFERENCE_KEYS);
  console.log(`  Preference combos: ${prefCombos.length}`);

  const entries = [];
  for (const prefs of prefCombos) {
    const scores = METHOD_IDS.map(id => {
      if (prefs.length === 0) return 0;
      const attrs = METHOD_ATTRIBUTES[id];
      let matches = 0;
      for (const pref of prefs) { if (attrs[pref]) matches++; }
      return Math.round((matches / prefs.length) * 100);
    });
    entries.push([prefs, scores]);
  }

  return {
    metadata: {
      source: 'ContraceptIQ method attributes',
      generatedAt: new Date().toISOString(),
      methods: METHOD_IDS,
      preferences: PREFERENCE_KEYS,
      totalCombos: entries.length,
      format: '[[preferenceKeys], [6 match scores 0-100]]',
    },
    methodAttributes: METHOD_ATTRIBUTES,
    entries,
  };
}

function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  WHO MEC Output Generator (56 conditions, I/C)');
  console.log('═══════════════════════════════════════════════════\n');

  const outDir = path.join(__dirname, '..', 'src', 'data');

  const condOutputs = generateConditionOutputs();
  const condPath = path.join(outDir, 'mecConditionOutputs.json');
  fs.writeFileSync(condPath, JSON.stringify(condOutputs));
  const condSize = fs.statSync(condPath).size;
  console.log(`\n  Written: mecConditionOutputs.json (${(condSize / (1024*1024)).toFixed(1)} MB)`);

  const prefOutputs = generatePreferenceOutputs();
  const prefPath = path.join(outDir, 'mecPreferenceScores.json');
  fs.writeFileSync(prefPath, JSON.stringify(prefOutputs, null, 2));
  const prefSize = fs.statSync(prefPath).size;
  console.log(`  Written: mecPreferenceScores.json (${(prefSize / 1024).toFixed(1)} KB)`);

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Entries: ${condOutputs.entries.length} conditions × ${prefOutputs.entries.length} prefs = ${condOutputs.entries.length * prefOutputs.entries.length}`);
  console.log(`  Size: ${((condSize + prefSize) / (1024*1024)).toFixed(1)} MB`);
  console.log('═══════════════════════════════════════════════════\n');
}

main();
