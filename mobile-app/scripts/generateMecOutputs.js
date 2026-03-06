#!/usr/bin/env node
/**
 * WHO MEC Output Generator
 *
 * Generates TWO static JSON files:
 *
 * 1. mecConditionOutputs.json — All pre-computed MEC category outputs for
 *    every valid (age group × up to 3 conditions) combination.
 *
 * 2. mecPreferenceScores.json — All preference combo → method match scores.
 *
 * Usage:  node scripts/generateMecOutputs.js
 */

const fs = require('fs');
const path = require('path');

// ─── Data (mirrors whoMecData.ts — all 55 parent conditions, 116 sub-entries) ─

const METHOD_IDS = ['Cu-IUD', 'LNG-IUD', 'Implant', 'DMPA', 'POP', 'CHC'];

const AGE_GROUPS = [
  { label: '<18', representative: 16 },
  { label: '18-39', representative: 25 },
  { label: '>=40', representative: 45 },
];

function getBaseByAge(age) {
  if (age < 18) return [2, 2, 1, 2, 1, 1]; // Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC
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

// All 116 condition entries — [Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC]
const CONDITIONS = {
  // Personal Characteristics
  'bf_lt6w': [1,1,2,2,2,4],
  'bf_6w_6m': [1,1,1,1,1,3],
  'bf_gte6m': [1,1,1,1,1,2],
  'obesity': [1,1,1,2,1,2],
  'parity_nulliparous': [2,2,1,1,1,1],
  'parity_parous': [1,1,1,1,1,1],
  'post_abortion_1st': [1,1,1,1,1,1],
  'post_abortion_2nd': [2,2,1,1,1,1],
  'post_abortion_septic': [4,4,1,1,1,1],
  'pp_nbf_lt21d': [1,1,1,1,1,4],
  'pp_nbf_21_42d_no_vte': [1,1,1,1,1,2],
  'pp_nbf_21_42d_vte': [1,1,1,1,1,3],
  'pp_nbf_gt42d': [1,1,1,1,1,1],
  'pregnancy': [4,4,4,4,4,4],
  'smoking_lt35': [1,1,1,1,1,2],
  'smoking_gte35_lt15': [1,1,1,1,1,3],
  'smoking_gte35_gte15': [1,1,1,1,1,4],

  // Cardiovascular
  'bp_unavailable': [1,1,1,1,1,2],
  'cvd_ppcm_lt6m_normal': [2,2,1,1,1,4],
  'cvd_ppcm_lt6m_impaired': [2,2,1,1,1,4],
  'cvd_ppcm_gte6m_normal': [2,2,1,1,1,2],
  'cvd_ppcm_gte6m_impaired': [2,2,1,1,1,4],
  'ihd': [1,2,2,3,2,4],
  'dvt_history': [1,2,2,2,2,4],
  'dvt_current': [1,3,3,3,3,4],
  'dvt_family_history': [1,1,1,1,1,2],
  'dvt_surgery_immobilization': [1,2,2,2,2,4],
  'dvt_surgery_no_immobilization': [1,1,1,1,1,2],
  'dvt_minor_surgery': [1,1,1,1,1,1],
  'htn_pregnancy_history': [1,1,1,1,1,2],
  'htn_controlled': [1,1,1,2,1,3],
  'htn_140_159': [1,1,1,2,1,3],
  'htn_gte160': [1,2,2,3,2,4],
  'htn_vascular': [1,2,2,3,2,4],
  'dyslipidaemia': [1,2,2,2,2,2],
  'thrombogenic_mutations': [1,2,2,2,2,4],
  'stroke': [1,2,2,3,2,4],
  'svd_varicose': [1,1,1,1,1,1],
  'svd_thrombophlebitis': [1,1,1,1,1,2],
  'vhd_uncomplicated': [1,1,1,1,1,2],
  'vhd_complicated': [2,2,1,1,1,4],

  // Neurological
  'depressive_disorders': [1,1,1,1,1,1],
  'epilepsy': [1,1,1,1,1,1],
  'headache_nonmigraine': [1,1,1,1,1,2],
  'migraine_no_aura_lt35': [1,2,2,2,1,2],
  'migraine_no_aura_gte35': [1,2,2,2,1,3],
  'migraine_with_aura': [1,2,2,2,2,4],

  // Reproductive / Gynaecological
  'benign_ovarian_tumours': [1,1,1,1,1,1],
  'breast_benign': [1,1,1,1,1,1],
  'breast_family_history': [1,1,1,1,1,1],
  'breast_undiagnosed_mass': [1,2,2,2,2,2],
  'breast_cancer_current': [1,4,4,4,4,4],
  'breast_cancer_past': [1,3,3,3,3,3],
  'cervical_cancer': [4,4,2,2,1,2],
  'cin': [1,2,2,2,1,2],
  'endometrial_cancer': [4,4,1,1,1,1],
  'endometriosis': [2,1,1,1,1,1],
  'pelvic_surgery': [1,1,1,1,1,1],
  'ovarian_cancer': [3,3,1,1,1,1],
  'past_ectopic': [1,1,1,1,1,1],
  'pid_current': [4,4,1,1,1,1],
  'pid_past_with_pregnancy': [1,1,1,1,1,1],
  'pid_past_without_pregnancy': [2,2,1,1,1,1],
  'severe_dysmenorrhoea': [2,1,1,1,1,1],
  'sti_current_purulent': [4,4,1,1,1,1],
  'sti_vaginitis': [2,2,1,1,1,1],
  'sti_increased_risk': [2,2,1,1,1,1],
  'vaginal_bleeding_unexplained': [4,4,3,3,3,3],
  'fibroids_no_distortion': [1,1,1,1,1,1],
  'fibroids_with_distortion': [4,4,1,1,1,1],
  'vaginal_bleeding_irregular': [1,1,1,2,2,1],
  'vaginal_bleeding_heavy': [2,1,1,1,1,1],

  // Infections
  'hiv_high_risk': [2,2,1,1,1,1],
  'hiv_infected': [2,2,1,1,1,1],
  'hiv_aids': [3,3,1,1,1,1],
  'malaria': [1,1,1,1,1,1],
  'schistosomiasis_uncomplicated': [1,1,1,1,1,1],
  'schistosomiasis_fibrosis': [1,1,1,1,1,1],
  'tb_nonpelvic': [1,1,1,1,1,1],
  'tb_pelvic': [4,4,1,1,1,1],

  // Endocrine / Metabolic
  'diabetes_gestational': [1,1,1,1,1,1],
  'diabetes_no_vascular': [1,2,2,2,2,2],
  'diabetes_vascular': [1,2,2,3,2,3],
  'thyroid': [1,1,1,1,1,1],

  // Gastrointestinal / Hepatic
  'cirrhosis_mild': [1,1,1,1,1,1],
  'cirrhosis_severe': [1,3,3,3,3,4],
  'gallbladder_cholecystectomy': [1,2,2,2,2,2],
  'gallbladder_medically_treated': [1,2,2,2,2,3],
  'gallbladder_current': [1,2,2,2,2,3],
  'gallbladder_asymptomatic': [1,2,2,2,2,2],
  'gtd_decreasing': [3,3,1,1,1,1],
  'gtd_persistent': [4,4,1,1,1,1],
  'cholestasis_pregnancy': [1,1,1,1,1,2],
  'cholestasis_coc': [1,1,1,1,1,3],
  'liver_tumour_fnh': [1,2,2,2,2,2],
  'liver_tumour_adenoma': [1,3,3,3,3,4],
  'liver_tumour_malignant': [1,3,3,3,3,4],
  'hepatitis_acute': [1,1,1,1,1,3],
  'hepatitis_carrier': [1,1,1,1,1,1],

  // Haematological / Autoimmune
  'iron_deficiency_anaemia': [2,1,1,1,1,1],
  'sickle_cell': [2,2,1,1,1,2],
  'sle_antiphospholipid': [1,3,3,3,3,4],
  'sle_thrombocytopenia': [3,2,2,2,2,2],
  'sle_immunosuppressive': [2,2,2,2,2,2],
  'sle_none': [1,1,1,1,1,2],
  'thalassaemia': [2,1,1,1,1,1],

  // Drug Interactions
  'anticonvulsant_enzyme_inducing': [1,1,2,1,3,3],
  'anticonvulsant_lamotrigine': [1,1,1,1,1,3],
  'antimicrobial_broad_spectrum': [1,1,1,1,1,1],
  'antimicrobial_antifungals': [1,1,1,1,1,1],
  'antimicrobial_antiparasitics': [1,1,1,1,1,1],
  'antimicrobial_rifampicin': [1,1,2,1,3,3],
  'arv_nrtis': [1,1,1,1,1,1],
  'arv_nnrtis': [1,1,1,1,1,1],
  'arv_ritonavir_boosted': [1,1,2,1,3,3],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function combinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const rest = combinations(arr.slice(i + 1), k - 1);
    for (const combo of rest) {
      result.push([arr[i], ...combo]);
    }
  }
  return result;
}

function combineCategories(base, conditionIds) {
  const result = [...base];
  for (const condId of conditionIds) {
    const cats = CONDITIONS[condId];
    if (!cats) continue;
    for (let i = 0; i < 6; i++) {
      result[i] = Math.max(result[i], cats[i]);
    }
  }
  return result;
}

function powerSet(arr) {
  const result = [[]];
  for (const item of arr) {
    const len = result.length;
    for (let i = 0; i < len; i++) {
      result.push([...result[i], item]);
    }
  }
  return result;
}

// ─── Generate condition outputs ──────────────────────────────────────────────

function generateConditionOutputs() {
  console.log('Generating condition combination outputs...\n');

  const conditionIds = Object.keys(CONDITIONS);
  const N = conditionIds.length;

  // Generate all condition combos (0 through 3)
  let allCombos = [[]]; // k=0
  for (let k = 1; k <= 3; k++) {
    const combos = combinations(conditionIds, k);
    allCombos = allCombos.concat(combos);
  }

  console.log(`  Total conditions: ${N}`);
  console.log(`  k=0: 1, k=1: ${N}, k=2: ${N*(N-1)/2}, k=3: ${N*(N-1)*(N-2)/6}`);
  console.log(`  Total condition combos: ${allCombos.length}`);
  console.log(`  × ${AGE_GROUPS.length} age groups = ${allCombos.length * AGE_GROUPS.length} entries\n`);

  const entries = [];

  for (let ageIdx = 0; ageIdx < AGE_GROUPS.length; ageIdx++) {
    const base = getBaseByAge(AGE_GROUPS[ageIdx].representative);

    for (const combo of allCombos) {
      const cats = combineCategories(base, combo);
      entries.push([ageIdx, combo, cats]);
    }

    console.log(`  Age group "${AGE_GROUPS[ageIdx].label}": ${allCombos.length} entries`);
  }

  return {
    metadata: {
      source: 'WHO MEC 5th Edition (2015)',
      generatedAt: new Date().toISOString(),
      description: 'Pre-computed MEC categories for all (age × condition) combinations',
      ageGroups: AGE_GROUPS.map(a => a.label),
      methods: METHOD_IDS,
      methodOrder: 'Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC',
      totalConditions: N,
      totalParentConditions: 55,
      maxConditions: 3,
      totalEntries: entries.length,
      format: '[ageGroupIndex, [conditionIds], [6 MEC categories]]',
    },
    conditionDatabase: CONDITIONS,
    entries,
  };
}

// ─── Generate preference outputs ─────────────────────────────────────────────

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
      description: 'Pre-computed preference match scores for all preference combinations',
      methods: METHOD_IDS,
      methodOrder: 'Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC',
      preferences: PREFERENCE_KEYS,
      totalCombos: entries.length,
      format: '[[preferenceKeys], [6 match scores 0-100]]',
    },
    methodAttributes: METHOD_ATTRIBUTES,
    entries,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  WHO MEC Output Generator (55 conditions)');
  console.log('═══════════════════════════════════════════════════\n');

  const outDir = path.join(__dirname, '..', 'src', 'data');

  // 1. Condition outputs
  const condOutputs = generateConditionOutputs();
  const condPath = path.join(outDir, 'mecConditionOutputs.json');
  fs.writeFileSync(condPath, JSON.stringify(condOutputs));
  const condSize = fs.statSync(condPath).size;
  console.log(`\n  Written: mecConditionOutputs.json (${(condSize / (1024*1024)).toFixed(1)} MB)`);

  // 2. Preference outputs
  const prefOutputs = generatePreferenceOutputs();
  const prefPath = path.join(outDir, 'mecPreferenceScores.json');
  fs.writeFileSync(prefPath, JSON.stringify(prefOutputs, null, 2));
  const prefSize = fs.statSync(prefPath).size;
  console.log(`  Written: mecPreferenceScores.json (${(prefSize / 1024).toFixed(1)} KB)`);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Condition entries: ${Object.keys(CONDITIONS).length}`);
  console.log(`  Condition combos: ${condOutputs.entries.length}`);
  console.log(`  Preference combos: ${prefOutputs.entries.length}`);
  console.log(`  Total unique outputs: ${condOutputs.entries.length} × ${prefOutputs.entries.length} = ${condOutputs.entries.length * prefOutputs.entries.length}`);
  console.log(`  Total file size: ${((condSize + prefSize) / (1024*1024)).toFixed(1)} MB`);
  console.log('\n  The app computes final results by combining:');
  console.log('  MEC categories (from condition file) + match scores (from preference file)\n');
}

main();
