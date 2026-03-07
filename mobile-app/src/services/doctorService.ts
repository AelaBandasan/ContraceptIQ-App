/**
 * doctorService.ts
 *
 * Manages OB assessment records with an offline-first strategy:
 *
 *   1. SAVE   — write to AsyncStorage immediately, then try Firestore.
 *               If Firestore fails, record is queued for retry.
 *   2. LOAD   — always read from AsyncStorage first (instant, works offline).
 *               Refresh from Firestore in the background when online.
 *   3. FLUSH  — on app resume / network reconnect, retry any queued records.
 *
 * Firestore collection: `assessments`
 *   Document ID: `{doctorId}_{timestamp_ms}` (unique per OB per session)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    query,
    where,
    getDocs,
    orderBy,
} from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssessmentRecord {
    /** Unique ID: `{doctorId}_{createdAt timestamp ms}` */
    id: string;
    doctorId: string;
    doctorName: string;

    /** Patient display name (from form NAME field) */
    patientName: string;

    /** All 9 V4 model features + any extra form values */
    patientData: Record<string, any>;

    /** WHO MEC results: method key → category 1–4 */
    mecResults?: Record<string, number>;

    /** Selected WHO MEC condition IDs (up to 3) */
    mecConditionIds?: string[];

    /** Per-method discontinuation risk predictions */
    riskResults: Record<string, {
        riskLevel: string;
        probability: number;
        recommendation: string;
        confidence: number;
    }>;

    /** OB free-text clinical notes */
    clinicalNotes: string;

    /** completed = all methods LOW risk; critical = ≥1 method HIGH risk */
    status: 'completed' | 'critical';

    /** ISO 8601 creation timestamp */
    createdAt: string;

    /** true = not yet synced to Firestore */
    pendingSync: boolean;
}

// ─── AsyncStorage keys ────────────────────────────────────────────────────────

const CACHE_PREFIX = '@assessments_';
const QUEUE_PREFIX  = '@sync_queue_';

const cacheKey = (doctorId: string) => `${CACHE_PREFIX}${doctorId}`;
const queueKey  = (doctorId: string) => `${QUEUE_PREFIX}${doctorId}`;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Save a completed assessment.
 *
 * Always writes to AsyncStorage first so the record is immediately available
 * in the history screen, even offline. Then attempts a Firestore sync.
 * If Firestore fails (offline / error), the record ID is added to the sync queue.
 */
export async function saveAssessment(record: AssessmentRecord): Promise<void> {
    // 1. Persist locally first
    await _writeToCache(record);

    // 2. Try Firestore sync — silently queue on failure
    try {
        await _syncRecord(record);
    } catch {
        await _enqueue(record.doctorId, record.id);
    }
}

/**
 * Load all assessment records for a doctor from AsyncStorage.
 * Instant and works fully offline.
 */
export async function loadAssessmentsCache(doctorId: string): Promise<AssessmentRecord[]> {
    try {
        const raw = await AsyncStorage.getItem(cacheKey(doctorId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Fetch assessments from Firestore and merge with local cache.
 * - Pending (unsynced) local records are preserved at the top.
 * - Updates the local cache with the merged result.
 *
 * Throws if Firestore is unreachable — caller should fall back to cache.
 */
export async function fetchDoctorAssessments(doctorId: string): Promise<AssessmentRecord[]> {
    const local = await loadAssessmentsCache(doctorId);

    const q = query(
        collection(db, 'assessments'),
        where('doctorId', '==', doctorId),
        orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    const remote: AssessmentRecord[] = [];
    snap.forEach(d => remote.push(d.data() as AssessmentRecord));

    // Keep locally-pending records that haven't reached Firestore yet
    const remoteIds = new Set(remote.map(r => r.id));
    const pendingLocal = local.filter(r => r.pendingSync && !remoteIds.has(r.id));

    const merged = [...pendingLocal, ...remote].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    await AsyncStorage.setItem(cacheKey(doctorId), JSON.stringify(merged));
    return merged;
}

/**
 * Retry all queued (unsynced) records.
 * Call this on app resume or when network comes back online.
 */
export async function flushSyncQueue(doctorId: string): Promise<void> {
    const key = queueKey(doctorId);
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return;

        const pendingIds: string[] = JSON.parse(raw);
        if (pendingIds.length === 0) return;

        const local = await loadAssessmentsCache(doctorId);
        const remaining: string[] = [];

        for (const id of pendingIds) {
            const record = local.find(r => r.id === id);
            if (!record) continue;
            try {
                await _syncRecord(record);
            } catch {
                remaining.push(id);
            }
        }

        await AsyncStorage.setItem(key, JSON.stringify(remaining));
    } catch {
        // Silent — will retry next time
    }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function _writeToCache(record: AssessmentRecord): Promise<void> {
    const key = cacheKey(record.doctorId);
    const raw = await AsyncStorage.getItem(key);
    const records: AssessmentRecord[] = raw ? JSON.parse(raw) : [];

    // Replace existing entry or prepend new one
    const idx = records.findIndex(r => r.id === record.id);
    if (idx >= 0) {
        records[idx] = record;
    } else {
        records.unshift(record);
    }

    await AsyncStorage.setItem(key, JSON.stringify(records));
}

async function _syncRecord(record: AssessmentRecord): Promise<void> {
    await setDoc(doc(db, 'assessments', record.id), {
        ...record,
        pendingSync: false,
    });
    await _markSynced(record.doctorId, record.id);
}

async function _markSynced(doctorId: string, id: string): Promise<void> {
    const key = cacheKey(doctorId);
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return;
        const records: AssessmentRecord[] = JSON.parse(raw);
        const idx = records.findIndex(r => r.id === id);
        if (idx >= 0) records[idx].pendingSync = false;
        await AsyncStorage.setItem(key, JSON.stringify(records));
    } catch {
        // Cache update is best-effort
    }
}

async function _enqueue(doctorId: string, id: string): Promise<void> {
    const key = queueKey(doctorId);
    try {
        const raw = await AsyncStorage.getItem(key);
        const queue: string[] = raw ? JSON.parse(raw) : [];
        if (!queue.includes(id)) {
            queue.push(id);
            await AsyncStorage.setItem(key, JSON.stringify(queue));
        }
    } catch {
        // Best-effort
    }
}
