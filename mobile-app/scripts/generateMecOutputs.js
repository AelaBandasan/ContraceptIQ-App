#!/usr/bin/env node
/**
 * WHO MEC Output Generator
 *
 * Generates TWO static JSON files:
 *
 * 1. mecConditionOutputs.json — All pre-computed MEC category outputs for
 *    every valid (age group × up to 3 conditions) combination.
 *    This is the core lookup table.
 *
 * 2. mecPreferenceScores.json — All preference combo → method match scores.
 *    Independent of conditions, so computed separately.
 *
 * The app combines both at runtime: look up MEC categories from file 1,
 * look up match scores from file 2, sort and display.
 *
 * Usage:  node scripts/generateMecOutputs.js
 */

const fs = require('fs');
const path = require('path');

// ─── Data (mirrors whoMecData.ts) ────────────────────────────────────────────

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

// Condition categories stored as arrays [Cu-IUD, LNG-IUD, Implant, DMPA, POP, CHC]
const CONDITIONS = {
  'pp_bf_lt6w': [1,1,2,2,2,4],
  'pp_bf_6w_6m': [1,1,1,1,1,3],
  'pp_bf_gte6m': [1,1,1,1,1,2],
  'pp_nbf_lt21d': [1,1,1,1,1,4],
  'pp_nbf_21_42d_no_vte': [1,1,1,1,1,2],
  'pp_nbf_21_42d_vte': [1,1,1,1,1,3],
  'pp_nbf_gt42d': [1,1,1,1,1,1],
  'post_abortion_1st': [1,1,1,1,1,1],
  'post_abortion_2nd': [2,2,1,1,1,1],
  'post_abortion_septic': [4,4,1,1,1,1],
  'smoking_lt35': [1,1,1,1,1,2],
  'smoking_gte35_lt15': [1,1,1,1,1,3],
  'smoking_gte35_gte15': [1,1,1,1,1,4],
  'obesity': [1,1,1,2,1,2],
  'htn_controlled': [1,1,1,2,1,3],
  'htn_140_159': [1,1,1,2,1,3],
  'htn_gte160': [1,2,2,3,2,4],
  'htn_vascular': [1,2,2,3,2,4],
  'htn_pregnancy_history': [1,1,1,1,1,2],
  'dvt_history': [1,2,2,2,2,4],
  'dvt_current': [1,3,3,3,3,4],
  'dvt_family_history': [1,1,1,1,1,2],
  'thrombogenic_mutations': [1,2,2,2,2,4],
  'surgery_immobilization': [1,2,2,2,2,4],
  'surgery_no_immobilization': [1,1,1,1,1,2],
  'svt': [1,1,1,1,1,2],
  'ihd': [1,2,2,3,2,4],
  'stroke': [1,2,2,3,2,4],
  'dyslipidaemia': [1,2,2,2,2,2],
  'vhd_uncomplicated': [1,1,1,1,1,2],
  'vhd_complicated': [2,2,1,1,1,4],
  'ppcm_lt6m_normal': [2,2,1,1,1,4],
  'ppcm_lt6m_impaired': [2,2,1,1,1,4],
  'ppcm_gte6m_normal': [2,2,1,1,1,2],
  'ppcm_gte6m_impaired': [2,2,1,1,1,4],
  'headache_nonmigraine': [1,1,1,1,1,2],
  'migraine_no_aura_lt35': [1,2,2,2,1,2],
  'migraine_no_aura_gte35': [1,2,2,2,1,3],
  'migraine_with_aura': [1,2,2,2,2,4],
  'epilepsy': [1,1,1,1,1,1],
  'vaginal_bleeding_irregular': [1,1,1,2,2,1],
  'vaginal_bleeding_heavy': [2,1,1,1,1,1],
  'vaginal_bleeding_unexplained': [4,4,3,3,3,3],
  'cervical_cancer': [4,4,2,2,1,2],
  'breast_undiagnosed_mass': [1,2,2,2,2,2],
  'breast_cancer_current': [1,4,4,4,4,4],
  'breast_cancer_past': [1,3,3,3,3,3],
  'endometrial_cancer': [4,4,1,1,1,1],
  'ovarian_cancer': [3,3,1,1,1,1],
  'fibroids_no_distortion': [1,1,1,1,1,1],
  'fibroids_with_distortion': [4,4,1,1,1,1],
  'pid_current': [4,4,1,1,1,1],
  'sti_current_purulent': [4,4,1,1,1,1],
  'sti_increased_risk': [2,2,1,1,1,1],
  'hiv_high_risk': [2,2,1,1,1,1],
  'hiv_infected': [2,2,1,1,1,1],
  'hiv_aids': [3,3,1,1,1,1],
  'tb_pelvic': [4,4,1,1,1,1],
  'tb_nonpelvic': [1,1,1,1,1,1],
  'diabetes_gestational_history': [1,1,1,1,1,1],
  'diabetes_no_vascular': [1,2,2,2,2,2],
  'diabetes_vascular': [1,2,2,3,2,3],
  'thyroid': [1,1,1,1,1,1],
  'gallbladder_cholecystectomy': [1,2,2,2,2,2],
  'gallbladder_medically_treated': [1,2,2,2,2,3],
  'gallbladder_current': [1,2,2,2,2,3],
  'cholestasis_pregnancy': [1,1,1,1,1,2],
  'cholestasis_coc': [1,1,1,1,1,3],
  'hepatitis_acute': [1,1,1,1,1,3],
  'hepatitis_carrier': [1,1,1,1,1,1],
  'cirrhosis_mild': [1,1,1,1,1,1],
  'cirrhosis_severe': [1,3,3,3,3,4],
  'liver_tumour_benign': [1,3,3,3,3,4],
  'liver_tumour_malignant': [1,3,3,3,3,4],
  'sle_antiphospholipid': [1,3,3,3,3,4],
  'sle_thrombocytopenia': [3,2,2,2,2,2],
  'sle_immunosuppressive': [2,2,2,2,2,2],
  'sle_none': [1,1,1,1,1,2],
  'anaemia_iron_deficiency': [2,1,1,1,1,1],
  'sickle_cell': [2,2,1,1,1,2],
  'thalassaemia': [2,1,1,1,1,1],
  'organ_transplant_complicated': [3,3,2,2,2,4],
  'organ_transplant_uncomplicated': [2,2,2,2,2,2],
  'drug_rifampicin': [1,1,2,1,3,3],
  'drug_anticonvulsants': [1,1,2,1,3,3],
  'drug_arv_ritonavir': [1,1,2,1,3,3],
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

function calcMatchScores(prefs) {
  const scores = {};
  for (const methodId of METHOD_IDS) {
    if (!prefs || prefs.length === 0) { scores[methodId] = 0; continue; }
    const attrs = METHOD_ATTRIBUTES[methodId];
    let matches = 0;
    for (const pref of prefs) {
      if (attrs[pref]) matches++;
    }
    scores[methodId] = Math.round((matches / prefs.length) * 100);
  }
  return scores;
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

  // Use compact format: each entry is [ageIdx, [condIds...], [6 categories]]
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
  console.log('  WHO MEC Output Generator');
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
  console.log(`  Condition combos: ${condOutputs.entries.length}`);
  console.log(`  Preference combos: ${prefOutputs.entries.length}`);
  console.log(`  Total unique outputs: ${condOutputs.entries.length} × ${prefOutputs.entries.length} = ${condOutputs.entries.length * prefOutputs.entries.length}`);
  console.log(`  Total file size: ${((condSize + prefSize) / (1024*1024)).toFixed(1)} MB`);
  console.log('\n  The app computes final results by combining:');
  console.log('  MEC categories (from condition file) + match scores (from preference file)\n');
}

main();
