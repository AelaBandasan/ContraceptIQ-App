# Plan: Replicate WHO MEC Tool for OB Side

## Goal
Create a static JSON data file containing ALL outputs from the WHO MEC Tool for every combination of:
- **Age groups** (3 groups)
- **Medical conditions** (up to 3 selected from ~40 WHO conditions)
- **Preferences** (all 7 can be selected)

Then build two new OB-side screens (Conditions + Preferences) that look up results from this data.

---

## Key Insight: How Combinations Work

The MEC system has a simple combination rule: **take the MOST RESTRICTIVE (highest) category** across all selected conditions for each method. This means:

1. **Base data needed**: ~40 conditions × 6 methods = ~240 individual category values
2. **Combination logic**: `max(category)` across selected conditions per method
3. **Preferences**: Simple attribute matching (already exists in `calculateMatchScore`)

Rather than storing billions of pre-computed combinations, we store:
- A **base MEC lookup table** (each condition → categories for all 6 methods, per age group)
- The combination rule is just `Math.max()` — trivial to compute

BUT: To satisfy "all outputs from all combinations" as static JSON, I'll also generate a **pre-computed output file** with all valid (age × condition-combo × preference-combo) results.

---

## Step 1: Create WHO MEC Condition Data File

**File**: `mobile-app/src/data/whoMecData.ts`

Expand from current 6 conditions to the full WHO MEC 5th Edition condition set (~40 conditions with sub-types that have Category 3 or 4 for at least one method):

### Complete WHO MEC Condition List (with sub-conditions):

**Personal Characteristics:**
1. Age — Menarche to <18 / 18–39 / ≥40
2. Postpartum (breastfeeding) — <6 weeks / 6 weeks–6 months / ≥6 months
3. Postpartum (non-breastfeeding) — <21 days / 21–42 days (no VTE risk) / 21–42 days (with VTE risk) / >42 days
4. Post-abortion — 1st trimester / 2nd trimester / Post-septic abortion
5. Smoking — Age <35 / Age ≥35 & <15 cig/day / Age ≥35 & ≥15 cig/day
6. Obesity — BMI ≥30

**Cardiovascular:**
7. Hypertension — Adequately controlled / Systolic 140–159 or Diastolic 90–99 / Systolic ≥160 or Diastolic ≥100 / With vascular disease
8. History of high BP during pregnancy
9. DVT/PE — History / Current / Family history only / Known thrombogenic mutations
10. Major surgery — With prolonged immobilization / Without prolonged immobilization
11. Superficial venous thrombosis
12. Ischaemic heart disease (current or history)
13. Stroke (history)
14. Known dyslipidaemias (without other CV risk factors)
15. Valvular heart disease — Uncomplicated / Complicated
16. Peripartum cardiomyopathy — <6 months / ≥6 months (normal/mildly impaired / moderately or severely impaired)

**Neurological:**
17. Headaches — Non-migrainous / Migraine without aura age <35 / Migraine without aura age ≥35 / Migraine with aura (any age)
18. Epilepsy

**Reproductive/Breast:**
19. Unexplained vaginal bleeding (suspicious for serious condition)
20. Cervical cancer (awaiting treatment)
21. Breast disease — Undiagnosed mass / Current breast cancer / Past breast cancer (≥5 years no recurrence)
22. Endometrial cancer
23. Ovarian cancer
24. Uterine fibroids — Without uterine cavity distortion / With uterine cavity distortion
25. Current PID (pelvic inflammatory disease)
26. Current purulent cervicitis / chlamydia / gonorrhoea
27. Increased risk of STIs

**Infections:**
28. HIV — High risk / HIV-infected (WHO Stage 1-2) / AIDS
29. Tuberculosis (pelvic)

**Endocrine:**
30. Diabetes — Non-insulin dependent (no vascular disease) / Insulin dependent (no vascular disease) / Nephropathy, retinopathy, neuropathy / Other vascular disease or >20 yrs duration

**Gastrointestinal/Hepatic:**
31. Gallbladder disease — Symptomatic (treated by cholecystectomy) / Symptomatic (medically treated) / Current / Asymptomatic
32. History of cholestasis — Pregnancy-related / COC-related
33. Viral hepatitis — Acute or flare / Carrier
34. Cirrhosis — Mild (compensated) / Severe (decompensated)
35. Liver tumours — Benign (hepatocellular adenoma) / Malignant (hepatocellular carcinoma)

**Autoimmune/Other:**
36. SLE — Positive/unknown antiphospholipid antibodies / Severe thrombocytopenia / Immunosuppressive treatment / None of the above
37. Solid organ transplantation (complicated)

**Drug Interactions:**
38. Rifampicin or rifabutin
39. Certain anticonvulsants (phenytoin, carbamazepine, barbiturates, primidone, topiramate, oxcarbazepine)
40. Antiretroviral therapy (ritonavir-boosted protease inhibitors)

Each condition/sub-condition stores its MEC categories for all 6 methods:
```typescript
{
  id: "hypertension_controlled",
  group: "Cardiovascular",
  condition: "Hypertension",
  subCondition: "Adequately controlled",
  categories: {
    "Cu-IUD": 1, "LNG-IUD": 1, "Implant": 1,
    "DMPA": 2, "POP": 1, "CHC": 3
  }
}
```

---

## Step 2: Generate Static JSON Output File

**File**: `mobile-app/src/data/mecOutputs.json`

### Structure:
```json
{
  "metadata": {
    "source": "WHO MEC 5th Edition (2015)",
    "generatedAt": "ISO timestamp",
    "ageGroups": ["<18", "18-39", "≥40"],
    "methods": ["Cu-IUD", "LNG-IUD", "Implant", "DMPA", "CHC", "POP"],
    "totalConditions": 40,
    "maxConditions": 3,
    "preferences": ["regular", "effectiveness", "longterm", "privacy", "client", "nonhormonal", "sti"]
  },
  "conditionCategories": { ... base condition data ... },
  "methodAttributes": { ... preference matching data ... },
  "precomputedOutputs": [
    {
      "ageGroup": "<18",
      "conditions": ["migraine_with_aura"],
      "preferences": ["effectiveness", "nonhormonal"],
      "results": {
        "mecCategories": { "Cu-IUD": 2, "LNG-IUD": 2, "Implant": 1, "DMPA": 2, "CHC": 4, "POP": 2 },
        "matchScores": { "Cu-IUD": 100, "LNG-IUD": 50, ... },
        "recommended": ["Cu-IUD", "Implant", ...],
        "notRecommended": ["CHC"]
      }
    }
  ]
}
```

### Generation Strategy:
Since full enumeration of all combinations is enormous, the JSON will contain:

**Section A — Base Data (compact, ~40 rows):**
All individual condition → method category mappings

**Section B — Pre-computed Condition Combinations (for validation):**
All unique (age × 1 condition), (age × 2 conditions), (age × 3 conditions) MEC outputs
- 3 age groups × (C(40,1) + C(40,2) + C(40,3)) = 3 × (40 + 780 + 9,880) = ~32,100 entries
- Each entry is just 6 numbers (one MEC category per method)

**Section C — Method Attributes (6 rows):**
The preference-matching attributes for each method (static, no combinations needed)

The preference match scores don't need pre-computation because they're a pure function of selected preferences × method attributes (no condition dependency).

---

## Step 3: Create Generator Script

**File**: `mobile-app/scripts/generateMecOutputs.ts`

A Node.js script that:
1. Reads the base WHO MEC condition data
2. Generates all valid combinations (age × up to 3 conditions)
3. For each combination, computes MEC categories using max() rule
4. Outputs `mecOutputs.json`
5. Reports stats (total combos generated, methods affected, etc.)

---

## Step 4: Update mecService.ts

Expand the existing service to:
1. Import from the new WHO MEC data file
2. Support the full ~40 condition set (not just 6)
3. Add a `lookupMecOutput()` function that can look up pre-computed results
4. Keep backward compatibility with existing `calculateMEC()` for the guest flow

---

## Step 5: Build OB-Side Screens

### Screen 1: WHO MEC Conditions Screen
**File**: `mobile-app/src/screens/ObSide/WhoMecConditionsScreen.tsx`

- **Age selector** at top (3 groups: <18, 18-39, ≥40)
- **Conditions list** grouped by category (Cardiovascular, Neurological, etc.)
- Each condition expandable to show sub-conditions
- **Max 3 conditions** enforced with counter badge
- Search/filter bar for quick condition lookup
- "Next" button → navigates to Preferences screen

### Screen 2: WHO MEC Preferences Screen
**File**: `mobile-app/src/screens/ObSide/WhoMecPreferencesScreen.tsx`

- Shows 7 preference toggles (all can be selected):
  1. Regular bleeding
  2. Highly effective
  3. Long lasting
  4. Privacy
  5. Client controlled
  6. No hormones
  7. STI prevention
- "View Results" button → shows output

### Screen 3: WHO MEC Results Screen
**File**: `mobile-app/src/screens/ObSide/WhoMecResultsScreen.tsx`

- Shows all 6 methods with:
  - MEC category color badge (1-4)
  - Preference match score (%)
  - Sorted: safest + best match first
  - Category 4 methods marked as "Not Recommended"
- Selected conditions summary at top
- Selected preferences summary

---

## Step 6: Navigation Updates

Update `ObTabNavigator.tsx` and `navigation.ts` to add the new screens:
- Add `ObWhoMecConditions`, `ObWhoMecPreferences`, `ObWhoMecResults` to `ObTabParamList`
- Add navigation from OB Dashboard → WHO MEC Tool

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/data/whoMecData.ts` | **NEW** — Full WHO MEC condition database |
| `src/data/mecOutputs.json` | **NEW** — Pre-computed static output file |
| `scripts/generateMecOutputs.ts` | **NEW** — Generator script |
| `src/services/mecService.ts` | **MODIFY** — Expand to use full condition set |
| `src/screens/ObSide/WhoMecConditionsScreen.tsx` | **NEW** — Conditions selection screen |
| `src/screens/ObSide/WhoMecPreferencesScreen.tsx` | **NEW** — Preferences selection screen |
| `src/screens/ObSide/WhoMecResultsScreen.tsx` | **NEW** — Results display screen |
| `src/routes/ObTabNavigator.tsx` | **MODIFY** — Add new screen routes |
| `src/types/navigation.ts` | **MODIFY** — Add new screen type definitions |
