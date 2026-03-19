# Analytics Dashboard — Implementation Documentation

**Project:** ContraceptIQ
**Feature:** Offline-First Analytics Dashboard + Multi-Select Delete (OB/Doctor Flow)
**Date:** March 2026
**Stack:** React Native 0.81 · Expo SDK 54 · expo-sqlite v16.0.10 · lucide-react-native

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decision](#architecture-decision)
3. [File Structure](#file-structure)
4. [Part 1 — The Database Layer (`database.ts`)](#part-1--the-database-layer)
5. [Part 2 — The Shadow Write & Delete (`doctorService.ts`)](#part-2--the-shadow-write--delete)
6. [Part 3 — The Dashboard UI (`AnalyticsScreen.tsx`)](#part-3--the-dashboard-ui)
7. [Part 4 — Multi-Select Delete (`ObHistoryScreen.tsx`)](#part-4--multi-select-delete)
8. [Part 5 — Navigation Wiring](#part-5--navigation-wiring)
9. [Data Flow Diagram](#data-flow-diagram)
10. [Key Design Decisions](#key-design-decisions)
11. [Dependencies](#dependencies)

---

## Overview

The Analytics Dashboard is a new tab in the OB/Doctor interface that visualises aggregate patient assessment data across configurable timeframes. It answers these clinical questions at a glance:

- **Which contraceptive method is most frequently predicted as HIGH discontinuation risk across my patients?**
- **What is the mean XGBoost-predicted discontinuation probability per method for my cohort?**
- **Which patient-level risk factors (SHAP-derived) are driving discontinuation risk most often?**

The dashboard is fully **offline-first** — it reads entirely from a local SQLite database and requires no network connection to display data.

The History screen was also enhanced with **multi-select delete**, allowing doctors to remove one or many assessment records with a single confirmation.

---

## Architecture Decision

### Why SQLite alongside AsyncStorage?

The existing system uses `AsyncStorage` (via `doctorService.ts`) as the primary offline store for full assessment records, with Firebase Firestore as the cloud backend. A full migration away from AsyncStorage would have been high-risk and out of scope.

Instead, the analytics layer uses a **shadow-write pattern**:

```
Assessment Saved
       │
       ▼
  AsyncStorage  ──────────────────────────────►  Firestore (cloud)
  (full record)                                   (when online)
       │
       ▼ (immediately after, non-fatal)
    SQLite
  (lightweight per-method analytics rows)
```

SQLite was chosen specifically for the analytics layer because:

| Concern | AsyncStorage | SQLite |
|---|---|---|
| Aggregate queries (`GROUP BY`, `COUNT`) | Must load all records into JS, parse JSON, aggregate in memory | Native SQL — runs in C, O(log n) with indexes |
| Timeframe filtering | Requires deserialising every record and filtering in JS | `WHERE assessment_date >= datetime('now', '-7 days')` — single indexed scan |
| Data size | Stores full patient records (KBs each) | Stores 6 narrow columns per row (bytes) |
| Failure impact | Critical — primary data store | Non-fatal — analytics only; original data is safe in AsyncStorage |

The SQLite database is intentionally a **read-optimised derivative store**, not the source of truth.

### Why per-method rows, not per-patient rows?

The V4 hybrid model (XGBoost + Decision Tree) produces one independent prediction per eligible contraceptive method — **Pills, IUD, Implant, Injectable**. There is no single patient-level classification; only per-method probabilities and HIGH/LOW decisions exist. Collapsing these into one row per patient (e.g. using the `status: 'critical'/'completed'` flag) discards the per-method signal that is the actual output of the model.

The correct analytics unit is one row per **(assessment × method)** pair, not per patient visit.

---

## File Structure

```
mobile-app/src/
├── services/
│   ├── database.ts              ← NEW: SQLite layer (init, write, query)
│   └── doctorService.ts         ← MODIFIED: shadow-write + deleteAssessments()
├── screens/ObSide/
│   ├── AnalyticsScreen.tsx      ← NEW: analytics dashboard UI
│   └── ObHistoryScreen.tsx      ← MODIFIED: multi-select delete
├── routes/
│   └── ObTabNavigator.tsx       ← MODIFIED: added Analytics tab
└── types/
    └── navigation.ts            ← MODIFIED: added ObAnalytics type
```

---

## Part 1 — The Database Layer

**File:** `src/services/database.ts`

### Schema

```sql
CREATE TABLE IF NOT EXISTS method_analytics (
    assessment_id    TEXT NOT NULL,
    patient_name     TEXT NOT NULL,
    method_name      TEXT NOT NULL,     -- 'Pills' | 'IUD' | 'Implant' | 'Injectable'
    risk_level       TEXT NOT NULL,     -- 'HIGH' | 'LOW' (directly from model, threshold = 0.25)
    probability      REAL NOT NULL,     -- xgb_probability (0.0–1.0)
    top_risk_factor  TEXT NOT NULL,     -- Patient's #1 SHAP feature label (patient-wide)
    assessment_date  TEXT NOT NULL,     -- 'YYYY-MM-DD HH:MM:SS' for SQLite datetime() comparisons
    PRIMARY KEY (assessment_id, method_name)
);

CREATE INDEX IF NOT EXISTS idx_method_date  ON method_analytics (assessment_date);
CREATE INDEX IF NOT EXISTS idx_method_name  ON method_analytics (method_name);
CREATE INDEX IF NOT EXISTS idx_method_risk  ON method_analytics (risk_level);
```

The schema is intentionally narrow. No sensitive clinical data beyond the patient name is stored — the full record (MEC conditions, parity, smoking status, clinical notes, etc.) remains exclusively in AsyncStorage and Firestore.

### Column derivation from `AssessmentRecord`

| SQLite column | Source | Derivation logic |
|---|---|---|
| `assessment_id` | `record.id` | Direct copy |
| `patient_name` | `record.patientName` | Direct copy |
| `method_name` | Key of `record.riskResults` | Shortened via `METHOD_SHORT` map |
| `risk_level` | `result.riskLevel` per method | `.toUpperCase() === 'HIGH' ? 'HIGH' : 'LOW'` |
| `probability` | `result.probability` per method | Direct copy (xgb_probability, 0.0–1.0) |
| `top_risk_factor` | `record.patientData` + `record.status` | Derived via `generateKeyFactors()` (see below) |
| `assessment_date` | `record.createdAt` | ISO 8601 normalised to `'YYYY-MM-DD HH:MM:SS'` |

### Method display name normalisation

The assessment screen uses full display names as `riskResults` keys (e.g. `'Intrauterine Device (IUD)'`). These are shortened for chart labels:

```typescript
const METHOD_SHORT: Record<string, string> = {
    'Pills':                       'Pills',
    'Intrauterine Device (IUD)':   'IUD',
    'Implant':                     'Implant',
    'Injectable':                  'Injectable',
};
```

### SHAP factor derivation (`top_risk_factor`)

`top_risk_factor` is derived using the same `generateKeyFactors()` function that powers the Key Factors display on each `RiskAssessmentCard`. This function reads `risk_factors_v4_signed.json` (a signed SHAP lookup table) and returns up to 4 ranked factors with descriptions.

Only the #1 factor (index 0) is stored, and the raw string is cleaned to extract the feature category name:

```typescript
// Raw factor string:  "↑ Use pattern: irregular use — raises discontinuation risk"
// Stored value:       "Use pattern"

function deriveTopFactor(patientData, riskLevel): string {
    const factors = generateKeyFactors(patientData, riskLevel);
    if (factors.length === 0) return 'Unknown';
    return factors[0]
        .replace(/^[↑↓] /, '')       // remove direction arrow
        .split(' — ')[0]              // remove description clause
        .split(': ')[0]               // remove sub-label
        .replace(/\s*\(.*?\)\s*$/, '') // remove parenthetical values e.g. "(24)"
        .trim();
}
```

The `top_risk_factor` is computed once per patient visit (using the overall risk level) and written identically to all 4 method rows for that assessment, since SHAP factors are patient-wide, not per-method.

### Analytics queries (`getAnalyticsData`)

Returns an `AnalyticsData` object with pre-formatted data for all three charts:

```typescript
interface AnalyticsData {
    methodRiskCounts:  MethodRiskCount[];   // Per-method HIGH/LOW counts
    methodAvgProbs:    MethodAvgProb[];     // Mean xgb_probability per method
    factorCounts:      FactorCount[];       // Top SHAP features by patient frequency
    totalPatients:     number;              // COUNT(DISTINCT assessment_id)
    overallAvgProb:    number;              // AVG(probability) across all rows
    mostAtRiskMethod:  string;              // Method with highest mean probability
}
```

**Timeframe SQL clauses:**

```sql
-- 'week'  → rolling last 7 days
WHERE assessment_date >= datetime('now', '-7 days')

-- 'month' → current calendar month
WHERE strftime('%Y-%m', assessment_date) = strftime('%Y-%m', 'now')

-- 'all'   → no filter
(empty string)
```

**Per-method HIGH/LOW count (Chart 1):**

```sql
SELECT method_name, risk_level, COUNT(*) AS count
FROM method_analytics
[WHERE ...]
GROUP BY method_name, risk_level
```

Results are assembled into `MethodRiskCount[]` in canonical method order: Pills → IUD → Implant → Injectable.

**Average probability per method (Chart 2):**

```sql
SELECT method_name, AVG(probability) AS avg_prob, COUNT(*) AS count
FROM method_analytics
[WHERE ...]
GROUP BY method_name
ORDER BY avg_prob DESC
```

**Top SHAP factors (Chart 3):**

```sql
SELECT top_risk_factor, COUNT(DISTINCT assessment_id) AS count
FROM method_analytics
[WHERE ...]
GROUP BY top_risk_factor
ORDER BY count DESC
LIMIT 6
```

Counts by *distinct patient* (`DISTINCT assessment_id`), not by method row, so a patient with 4 method rows contributes only 1 count to their top factor.

**KPI summary:**

```sql
SELECT COUNT(DISTINCT assessment_id) AS total_patients,
       AVG(probability)              AS overall_avg
FROM method_analytics
[WHERE ...]
```

### Write functions

| Function | SQL | When called |
|---|---|---|
| `insertAssessmentAnalytics(record)` | `INSERT OR REPLACE` | Inside `saveAssessment()` — every new or re-synced assessment |
| `seedAssessmentAnalytics(record)` | `INSERT OR IGNORE` | Inside `AnalyticsScreen` seed pass — backfills existing AsyncStorage records |
| `deleteAnalyticsRows(ids)` | `DELETE WHERE assessment_id IN (...)` | Inside `deleteAssessments()` — mirrors cache deletion |

### Singleton database connection

```typescript
let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
    if (_db) return _db;
    _db = SQLite.openDatabaseSync(DB_NAME);
    _db.execSync(`CREATE TABLE IF NOT EXISTS ...`);
    return _db;
}
```

The database is opened once and reused across all calls. Schema creation is embedded in `getDb()` — no separate initialisation step is needed in `App.tsx`.

---

## Part 2 — The Shadow Write & Delete

**File:** `src/services/doctorService.ts`

### Shadow write in `saveAssessment()`

Two lines were added to `saveAssessment()`. The change is minimal and isolated:

```typescript
export async function saveAssessment(record: AssessmentRecord): Promise<void> {
    // 1. Persist locally first  (unchanged)
    await _writeToCache(record);

    // 2. Shadow-write to SQLite analytics layer  ← NEW
    try {
        insertAssessmentAnalytics(record);
    } catch {
        // Analytics write failure must never block the primary save path
    }

    // 3. Try Firestore sync  (unchanged)
    try {
        await _syncRecord(record);
    } catch {
        await _enqueue(record.doctorId, record.id);
    }
}
```

The `try/catch` around the SQLite write is intentional: if the analytics database fails for any reason (corrupt DB, device storage full), the clinical save to AsyncStorage must still complete successfully.

### `deleteAssessments(doctorId, ids)`

New public function that removes records atomically across all three storage layers, in order of safety:

```typescript
export async function deleteAssessments(doctorId: string, ids: string[]): Promise<void> {
    // 1. AsyncStorage — immediate, works offline, primary store
    // 2. SQLite analytics — keeps charts in sync with cache
    // 3. Firestore — best-effort when online, silent on failure
}
```

Failure at step 2 or 3 does not roll back step 1. The record is gone locally regardless of network state.

---

## Part 3 — The Dashboard UI

**File:** `src/screens/ObSide/AnalyticsScreen.tsx`

### State

```typescript
const [timeframe, setTimeframe]  = useState<Timeframe>('month');   // default: current month
const [analytics, setAnalytics]  = useState<AnalyticsData | null>(null);
const [loading, setLoading]      = useState(true);
const [seeding, setSeeding]      = useState(false);   // shows "Syncing records…" banner
const [error, setError]          = useState<string | null>(null);
const seedingRef                 = useRef(false);      // prevents concurrent seed runs
```

### Lifecycle — seed then query

```
useFocusEffect (runs every time the tab becomes active)
    │
    ├─ seedFromCache()
    │       └─ loadAssessmentsCache(doctorId)       [AsyncStorage]
    │               └─ seedAssessmentAnalytics(r)   [SQLite, INSERT OR IGNORE × n]
    │
    └─ queryAnalytics(timeframe)
            └─ getAnalyticsData(timeframe)           [SQLite, GROUP BY queries]
                    └─ setAnalytics(data)            [triggers re-render]
```

`useFocusEffect` is used (not `useEffect`) so charts refresh automatically whenever the doctor navigates to the Analytics tab after completing a new assessment.

The seeding pass uses `INSERT OR IGNORE`, making it fully **idempotent** — running it 100 times produces the same result as running it once. No "has been seeded" flag is needed.

A `seedingRef` (ref, not state) guards against concurrent seed invocations when the tab is revisited in quick succession.

### Synchronous SQLite and the 50ms timeout

`expo-sqlite` v16's synchronous API (`getAllSync`, `runSync`) executes on the JavaScript thread. For datasets under a few thousand rows this is imperceptibly fast, but calling it synchronously during a render would block the frame. A small timeout defers the work until after the loading spinner paints:

```typescript
setTimeout(() => {
    try {
        setAnalytics(getAnalyticsData(tf));
    } catch {
        setError('Unable to load analytics. Please try again.');
    } finally {
        setLoading(false);
    }
}, 50);
```

### Charts

All three charts are custom native `View`-based components — no SVG chart library is used. This avoids label clipping and x-axis overflow issues that affect `react-native-chart-kit`'s `BarChart` with rotated labels.

#### Chart 1 — `MethodRiskChart` (Risk by Method)

Per-method stacked bars showing HIGH vs LOW prediction counts. Each method has a colour-coded badge (Pills = pink, IUD = purple, Implant = cyan, Injectable = green). Bar widths are proportional to the highest-total method.

```
Pills      [HIGH ██████ 8]  [LOW ████████████ 12]
IUD        [HIGH ████ 4]    [LOW ████████████████ 16]
Implant    [HIGH ██████████ 10] [LOW ████████ 8]
Injectable [HIGH ██ 2]      [LOW ████████████████████ 20]
```

#### Chart 2 — `AvgProbChart` (Avg Discontinuation Probability)

Horizontal bars showing mean `xgb_probability` per method, sorted descending. Each bar shows the percentage label inline and sample size below.

```
1  Injectable  ████████████████████  62%  (n=20)
2  Pills       █████████████         41%  (n=20)
3  IUD         ██████████            31%  (n=20)
4  Implant     ████████              27%  (n=20)
```

#### Chart 3 — `FactorList` (Top Risk Drivers)

Ranked list of the most frequent #1 SHAP feature categories across patients. Each item shows a rank badge, label, proportional bar, and patient count. Up to 6 factors are shown.

```
1  Use pattern          ████████████████████  15
2  More children        ████████████          9
3  Patient age          ██████████            7
…
```

These factor labels match exactly what the doctor sees on each patient's `RiskAssessmentCard` under "Key Factors", since both use `generateKeyFactors()` from the same SHAP lookup table.

### KPI stat cards

Four summary cards appear above the charts:

| Card | Source field | Description |
|---|---|---|
| Patients Assessed | `totalPatients` | `COUNT(DISTINCT assessment_id)` |
| Avg Discontinuation Risk | `overallAvgProb` | `AVG(probability)` across all method rows |
| Most At-Risk Method | `mostAtRiskMethod` | Method with highest mean `xgb_probability` |
| Top Risk Driver | `factorCounts[0].label` | Most frequent #1 SHAP feature |

### Empty and error states

- **No data for timeframe:** Charts are replaced with a placeholder icon and message — no crash, no empty axes.
- **SQLite error:** An error card with the message is shown; the `try/catch` in `queryAnalytics` always exits cleanly.
- **Not logged in:** `doctorUid` is `null` → seed pass is skipped, charts show empty state.

---

## Part 4 — Multi-Select Delete

**File:** `src/screens/ObSide/ObHistoryScreen.tsx`

### State additions

```typescript
const [isSelectMode, setIsSelectMode] = useState(false);
const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
const [isDeleting, setIsDeleting]     = useState(false);
```

### Interaction flow

| User action | Result |
|---|---|
| Long-press a card | Enters select mode; that card is pre-selected |
| Tap card in select mode | Toggles selection (adds/removes from `selectedIds`) |
| Tap "Select" button (top-right) | Enters select mode with no pre-selection |
| Tap "Select All" | Selects all records in the list |
| Tap "Deselect All" | Clears all selections (stays in select mode) |
| Tap "Cancel" or navigate away | Exits select mode, clears selections |
| Tap "Delete" in floating bar | Shows `Alert.alert` confirmation |
| Confirm delete | Calls `deleteAssessments()`, animates list update, exits select mode |

### `HistoryCard` props

```typescript
interface HistoryCardProps {
    item: AssessmentRecord;
    initialExpanded?: boolean;
    isSelectMode: boolean;      // ← NEW: switches card into selection UI
    isSelected: boolean;        // ← NEW: highlights card, shows checkbox
    onToggleSelect: (id) => void; // ← NEW
    onLongPress: (id) => void;    // ← NEW: enters select mode
}
```

In select mode, the card shows a `CheckCircle2` (selected) or `Circle` (unselected) icon from `lucide-react-native`. Selected cards have a pink border and background tint. Tapping a card calls `onToggleSelect` instead of expanding/collapsing. The chevron expand button is hidden during select mode.

### Delete confirmation

```typescript
Alert.alert(
    'Delete Records',
    `Permanently delete ${count} assessment record${count > 1 ? 's' : ''}? This cannot be undone.`,
    [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            await deleteAssessments(doctorId, Array.from(selectedIds));
            // Optimistically remove from local list state
            setHistory(prev => prev.filter(r => !selectedIds.has(r.id)));
            exitSelectMode();
        }},
    ],
);
```

`LayoutAnimation.configureNext` is called before the list update so the removal animates smoothly on both iOS and Android. `UIManager.setLayoutAnimationEnabledExperimental(true)` is called at module level for Android.

---

## Part 5 — Navigation Wiring

### `navigation.ts`

```typescript
export type ObTabParamList = {
  ObHome:       undefined;
  ObAssessment: { isDoctorAssessment: boolean };
  ObHistory:    undefined;
  ObAnalytics:  undefined;    // ← added
  // ...hidden screens
};
```

### `ObTabNavigator.tsx`

```tsx
import { BarChart2 } from 'lucide-react-native';
import AnalyticsScreen from '../screens/ObSide/AnalyticsScreen';

// Inserted after ObHistory tab:
<Tab.Screen
    name="ObAnalytics"
    component={AnalyticsScreen}
    options={{
        tabBarLabel: 'Analytics',
        tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
    }}
/>
```

The visible tab order is now: **Home → Assess → History → Analytics → MEC → Profile**.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ObAssessment.tsx                         │
│            (doctor completes patient assessment)                │
└──────────────────────────────┬──────────────────────────────────┘
                               │ saveAssessment(record)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       doctorService.ts                          │
│                                                                 │
│  1. _writeToCache(record)    ──────────────► AsyncStorage       │
│                                             @assessments_{uid}  │
│                                                                 │
│  2. insertAssessmentAnalytics(record)                           │
│     └─ buildMethodRows()     ──────────────► SQLite             │
│         ├─ risk_level    ← result.riskLevel  method_analytics   │
│         ├─ probability   ← result.probability                   │
│         └─ top_risk_factor ← generateKeyFactors()               │
│                                                                 │
│  3. _syncRecord(record)      ──────────────► Firestore          │
│     (or enqueue if offline)                  assessments/{id}   │
└─────────────────────────────────────────────────────────────────┘

              ┌── On AnalyticsScreen focus ──┐
              │                             │
              ▼                             ▼
         AsyncStorage                    SQLite
        (full records)             (lightweight rows)
               │                          │
               │ seedAssessmentAnalytics() │ getAnalyticsData()
               │ INSERT OR IGNORE          │ GROUP BY queries
               └─────────────┬────────────┘
                              │
                              ▼
                     AnalyticsScreen.tsx
                   ┌───────────────────────┐
                   │  KPI stat cards (×4)  │
                   │  MethodRiskChart      │
                   │  AvgProbChart         │
                   │  FactorList           │
                   └───────────────────────┘

              ┌── On ObHistoryScreen delete ─┐
              │                              │
              ▼                              ▼
         AsyncStorage                     SQLite
        (remove by id)               (deleteAnalyticsRows)
               │
               ▼ (best-effort, when online)
            Firestore
        (deleteDoc × n)
```

---

## Key Design Decisions

### 1. Non-destructive integration
No existing code was deleted or refactored. The `doctorService.ts` change is two lines inside a `try/catch`. If the entire `database.ts` module were removed, the app would work exactly as it did before.

### 2. Per-method analytics unit
The correct unit of analysis is the (assessment × method) pair, not the patient visit. Using the patient's `status` field ('critical'/'completed') to derive a single High/Low label would discard the actual model output — four independent method-level predictions. The `method_analytics` table preserves all four per-method risk levels and probabilities.

### 3. SHAP-consistent risk factors
`top_risk_factor` is derived from the same `generateKeyFactors()` function used in `RiskAssessmentCard`. This ensures the risk drivers shown in the analytics aggregates are semantically identical to the Key Factors the doctor sees on each patient's assessment card. Both read from `risk_factors_v4_signed.json`.

### 4. Idempotent seeding
`INSERT OR IGNORE` in `seedAssessmentAnalytics()` makes the seed pass safe to call on every screen focus. Records that already exist are silently skipped. No bookkeeping flags, no one-time migration scripts.

### 5. Custom native chart components
All three charts are built with plain React Native `View` components rather than `react-native-chart-kit`. This avoids SVG label clipping on the x-axis (a known limitation of `BarChart` in `react-native-chart-kit` when labels exceed available width), provides full style control, and eliminates an unnecessary dependency.

### 6. Offline-first by design
`getAnalyticsData()` is a pure SQLite read — no network calls. Charts display correctly in airplane mode. The seeding pass reads from AsyncStorage (also local), so the only operation that requires a network connection is the initial Firestore sync in `doctorService.ts`, which is unchanged.

### 7. Delete atomicity ordering
Delete proceeds AsyncStorage → SQLite → Firestore, in order of importance. AsyncStorage is the source of truth, so it is always cleared first. SQLite is cleared second to keep analytics in sync. Firestore deletion is best-effort — failure there does not affect the local experience.

---

## Dependencies

| Package | Version | Purpose | Already installed? |
|---|---|---|---|
| `expo-sqlite` | 16.0.10 | SQLite database engine | No — added via `npx expo install expo-sqlite` |
| `@react-native-async-storage/async-storage` | 2.2.0 | Source of existing assessment records for seeding | **Yes** |
| `lucide-react-native` | ^0.563.0 | `BarChart2` icon for the Analytics tab, `CheckCircle2`/`Circle`/`Trash2` for History delete | **Yes** |
| `react-native-svg` | 15.12.1 | Peer dependency (already present; no new SVG charts added) | **Yes** |

> **Note:** `react-native-chart-kit` was evaluated but not used for the final charts. All chart rendering is done with native React Native `View` components.

### Build note

`expo-sqlite` contains native iOS and Android modules. After installing it, a **full native rebuild** is required before it will work on a physical device or emulator:

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

Running `npx expo start` alone (Metro only, without a custom dev client build) will result in a `NativeModule 'ExpoSQLite' not found` error.
