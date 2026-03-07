/**
 * mecDataService.ts
 *
 * Manages remote MEC configuration stored in Firestore.
 * Allows editing WHO MEC condition categories and method attributes
 * in the database without redeploying the app.
 *
 * Strategy: stale-while-revalidate
 *   1. Load AsyncStorage cache into live arrays on startup (~5ms, non-blocking)
 *   2. Cache < 24h → stop, use cached data
 *   3. Cache ≥ 24h or absent → refresh from Firestore in background
 *   4. All failures silent → bundled data is already in arrays as fallback
 *
 * No changes required in screens or mecService — WHO_MEC_CONDITIONS and
 * METHOD_ATTRIBUTES are mutated in-place so all consumers update automatically.
 *
 * Firestore structure:
 *   Collection : mec_config
 *   Document   : v1
 *   Fields     : conditions[], methodAttributes[], version, updatedAt
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { WHO_MEC_CONDITIONS, type MecConditionEntry } from '../data/whoMecData';
import { METHOD_ATTRIBUTES, type MethodAttributes } from './mecService';

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_KEY = '@mec_data_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FIRESTORE_COLLECTION = 'mec_config';
const FIRESTORE_DOC_ID = 'v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MecDataCache {
  conditions: MecConditionEntry[];
  methodAttributes: MethodAttributes[];
  fetchedAt: number;
  version: string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize MEC data at app startup.
 *
 * Loads from AsyncStorage cache immediately, then refreshes from Firestore
 * in the background if the cache is stale (> 24 hours).
 *
 * Call once in App.tsx:
 *   useEffect(() => { initMecData(); }, []);
 */
export async function initMecData(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: MecDataCache = JSON.parse(raw);
      _applyData(cached.conditions, cached.methodAttributes);

      // Cache is still fresh — no need to hit Firestore this session
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return;
      }
    }

    // Refresh Firestore in background — non-blocking, won't delay the UI
    _fetchAndCache().catch(() => {});
  } catch {
    // Silent failure — bundled data is already in the arrays
  }
}

/**
 * Upload the current bundled MEC data to Firestore.
 *
 * Run once to seed the database. After seeding, edit entries directly
 * in the Firebase Console (mec_config → v1 → conditions[]).
 * Changes will be picked up by all clients within 24 hours.
 */
export async function uploadMecData(): Promise<void> {
  await setDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID), {
    conditions: WHO_MEC_CONDITIONS,
    methodAttributes: METHOD_ATTRIBUTES,
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Force a fresh fetch from Firestore, bypassing the TTL check.
 * Useful after manually editing the database and wanting immediate pickup.
 */
export async function refreshMecData(): Promise<void> {
  await _fetchAndCache();
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function _fetchAndCache(): Promise<void> {
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID));

  if (!snap.exists()) {
    // First run — auto-seed Firestore with the bundled data.
    // After seeding, admins can edit entries directly in the Firebase Console.
    await uploadMecData();
    return; // Bundled data is already in memory
  }

  const data = snap.data() as Partial<MecDataCache>;
  if (!data.conditions?.length) return;

  const conditions = data.conditions;
  const methodAttributes = data.methodAttributes?.length
    ? data.methodAttributes
    : METHOD_ATTRIBUTES;

  _applyData(conditions, methodAttributes);

  const cache: MecDataCache = {
    conditions: [...WHO_MEC_CONDITIONS],
    methodAttributes: [...METHOD_ATTRIBUTES],
    fetchedAt: Date.now(),
    version: data.version ?? '1.0.0',
  };

  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * Mutate exported arrays in-place so every consumer (screens, mecService
 * calculations) automatically sees the updated data — no import changes needed.
 */
function _applyData(
  conditions: MecConditionEntry[],
  methodAttributes: MethodAttributes[],
): void {
  if (conditions.length) {
    WHO_MEC_CONDITIONS.splice(0, WHO_MEC_CONDITIONS.length, ...conditions);
  }
  if (methodAttributes.length) {
    METHOD_ATTRIBUTES.splice(0, METHOD_ATTRIBUTES.length, ...methodAttributes);
  }
}
