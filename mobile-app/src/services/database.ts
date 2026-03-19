/**
 * database.ts — SQLite analytics layer for ContraceptIQ
 *
 * ── Why per-method rows? ──────────────────────────────────────────────────────
 * The V4 hybrid model produces one independent prediction per eligible
 * contraceptive method (Pills, IUD, Implant, Injectable). There is no
 * single patient-level classification — only per-method probabilities and
 * HIGH/LOW decisions. Collapsing these into one row per patient (e.g. using
 * the `status` 'critical'/'completed' flag) discards the per-method signal
 * that is the actual output of the model.
 *
 * Schema: one row per (assessment × method) pair.
 *   assessment_id    — groups all 4 method rows for one patient visit
 *   method_name      — short display name: 'Pills' | 'IUD' | 'Implant' | 'Injectable'
 *   risk_level       — 'HIGH' | 'LOW' directly from the model (threshold = 0.25)
 *   probability      — xgb_probability (0.0–1.0), the raw XGBoost score
 *   top_risk_factor  — patient's #1 SHAP feature label (same across all 4 rows
 *                      for the same patient, since SHAP is patient-wide)
 *   assessment_date  — 'YYYY-MM-DD HH:MM:SS' for reliable SQLite comparisons
 *
 * ── Queries this enables ─────────────────────────────────────────────────────
 *   • Per-method HIGH/LOW counts   → GROUP BY method_name, risk_level
 *   • Average probability/method   → AVG(probability) GROUP BY method_name
 *   • Total unique patients        → COUNT(DISTINCT assessment_id)
 *   • Top SHAP factors             → GROUP BY top_risk_factor (DISTINCT patient)
 *
 * expo-sqlite v16 synchronous API: openDatabaseSync / execSync / runSync / getAllSync
 */

import * as SQLite from 'expo-sqlite';
import type { AssessmentRecord } from './doctorService';
import { generateKeyFactors } from '../components/RiskAssessmentCard';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Timeframe = 'week' | 'month' | 'all';

/** Returned by getAnalyticsData() — pre-formatted for chart components */
export interface MethodRiskCount {
    method: string;
    high: number;
    low: number;
    total: number;
}

export interface MethodAvgProb {
    method: string;
    /** Mean xgb_probability across all assessments (0.0–1.0) */
    avgProb: number;
    count: number;
}

export interface FactorCount {
    label: string;
    /** Number of distinct patients whose top SHAP factor is this label */
    count: number;
}

export interface AnalyticsData {
    /** Per-method HIGH/LOW breakdown — for stacked bar chart */
    methodRiskCounts: MethodRiskCount[];
    /** Mean probability per method, sorted desc — for horizontal bar chart */
    methodAvgProbs: MethodAvgProb[];
    /** Top SHAP feature labels by patient frequency — for factor list */
    factorCounts: FactorCount[];
    /** COUNT(DISTINCT assessment_id) — unique patient visits */
    totalPatients: number;
    /** AVG(probability) across all method rows in the timeframe (0.0–1.0) */
    overallAvgProb: number;
    /** Method name with the highest mean probability */
    mostAtRiskMethod: string;
}

// ─── Method display name normalisation ───────────────────────────────────────

/**
 * The assessment screen uses full display names as riskResults keys.
 * These are shortened for chart labels.
 */
const METHOD_SHORT: Record<string, string> = {
    'Pills':                       'Pills',
    'Intrauterine Device (IUD)':   'IUD',
    'Implant':                     'Implant',
    'Injectable':                  'Injectable',
};

function shortMethodName(raw: string): string {
    return METHOD_SHORT[raw] ?? raw;
}

// ─── Database singleton ───────────────────────────────────────────────────────

const DB_NAME = 'contraceptiq_analytics.db';
let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
    if (_db) return _db;

    _db = SQLite.openDatabaseSync(DB_NAME);

    _db.execSync(`
        CREATE TABLE IF NOT EXISTS method_analytics (
            assessment_id    TEXT NOT NULL,
            patient_name     TEXT NOT NULL,
            method_name      TEXT NOT NULL,
            risk_level       TEXT NOT NULL,
            probability      REAL NOT NULL,
            top_risk_factor  TEXT NOT NULL,
            assessment_date  TEXT NOT NULL,
            PRIMARY KEY (assessment_id, method_name)
        );
        CREATE INDEX IF NOT EXISTS idx_method_date
            ON method_analytics (assessment_date);
        CREATE INDEX IF NOT EXISTS idx_method_name
            ON method_analytics (method_name);
        CREATE INDEX IF NOT EXISTS idx_method_risk
            ON method_analytics (risk_level);
    `);

    return _db;
}

// ─── SHAP factor label extraction ────────────────────────────────────────────

/**
 * Calls generateKeyFactors() — the same function used in RiskAssessmentCard —
 * and extracts the clean feature-category name from the top-ranked result.
 *
 * "↑ Use pattern: irregular use — raises discontinuation risk" → "Use pattern"
 * "↑ Patient age (24) — raises discontinuation risk"          → "Patient age"
 */
function deriveTopFactor(patientData: Record<string, any>, riskLevel: 'HIGH' | 'LOW'): string {
    try {
        const factors = generateKeyFactors(patientData, riskLevel);
        if (factors.length === 0) return 'Unknown';
        return factors[0]
            .replace(/^[↑↓] /, '')
            .split(' — ')[0]
            .split(': ')[0]
            .replace(/\s*\(.*?\)\s*$/, '')
            .trim();
    } catch {
        return 'Unknown';
    }
}

/** Normalise ISO-8601 → 'YYYY-MM-DD HH:MM:SS' for reliable SQLite datetime() comparisons */
function toSqliteDate(iso: string): string {
    return iso.replace('T', ' ').replace('Z', '').replace(/\.\d+$/, '');
}

// ─── Internal: build per-method rows from an AssessmentRecord ────────────────

interface MethodRow {
    assessment_id: string;
    patient_name: string;
    method_name: string;
    risk_level: string;
    probability: number;
    top_risk_factor: string;
    assessment_date: string;
}

function buildMethodRows(record: AssessmentRecord): MethodRow[] {
    const rows: MethodRow[] = [];
    const sqliteDate = toSqliteDate(record.createdAt ?? new Date().toISOString());

    // Derive the patient's top SHAP factor once — it's patient-wide, not per-method
    // Use the overall risk level for the patient (any HIGH method → HIGH for SHAP lookup)
    const overallRisk: 'HIGH' | 'LOW' = record.status === 'critical' ? 'HIGH' : 'LOW';
    const topFactor = deriveTopFactor(record.patientData ?? {}, overallRisk);

    for (const [rawMethod, result] of Object.entries(record.riskResults ?? {})) {
        if (!result) continue;
        rows.push({
            assessment_id:   record.id,
            patient_name:    record.patientName || 'Unknown Patient',
            method_name:     shortMethodName(rawMethod),
            risk_level:      result.riskLevel?.toUpperCase() === 'HIGH' ? 'HIGH' : 'LOW',
            probability:     result.probability ?? 0,
            top_risk_factor: topFactor,
            assessment_date: sqliteDate,
        });
    }
    return rows;
}

// ─── Public write API ─────────────────────────────────────────────────────────

/**
 * Upsert all method rows for an assessment.
 * Uses INSERT OR REPLACE — safe to call on re-syncs.
 * Called by doctorService immediately after writing to AsyncStorage.
 */
export function insertAssessmentAnalytics(record: AssessmentRecord): void {
    const db = getDb();
    const rows = buildMethodRows(record);
    for (const row of rows) {
        db.runSync(
            `INSERT OR REPLACE INTO method_analytics
                 (assessment_id, patient_name, method_name, risk_level,
                  probability, top_risk_factor, assessment_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [row.assessment_id, row.patient_name, row.method_name, row.risk_level,
             row.probability, row.top_risk_factor, row.assessment_date],
        );
    }
}

/**
 * Insert method rows only if they do not already exist.
 * Used for backfilling from the AsyncStorage cache on AnalyticsScreen focus.
 */
export function seedAssessmentAnalytics(record: AssessmentRecord): void {
    const db = getDb();
    const rows = buildMethodRows(record);
    for (const row of rows) {
        db.runSync(
            `INSERT OR IGNORE INTO method_analytics
                 (assessment_id, patient_name, method_name, risk_level,
                  probability, top_risk_factor, assessment_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [row.assessment_id, row.patient_name, row.method_name, row.risk_level,
             row.probability, row.top_risk_factor, row.assessment_date],
        );
    }
}

/**
 * Delete all method rows belonging to the given assessment IDs.
 * Called by doctorService.deleteAssessments.
 */
export function deleteAnalyticsRows(ids: string[]): void {
    if (ids.length === 0) return;
    const db = getDb();
    const placeholders = ids.map(() => '?').join(', ');
    db.runSync(
        `DELETE FROM method_analytics WHERE assessment_id IN (${placeholders})`,
        ids,
    );
}

// ─── Public query API ─────────────────────────────────────────────────────────

/**
 * Returns all analytics data for the selected timeframe, ready for rendering.
 *
 * @param timeframe  'week' | 'month' | 'all'
 */
export function getAnalyticsData(timeframe: Timeframe): AnalyticsData {
    const db = getDb();
    const where = buildWhereClause(timeframe);

    // ── 1. Per-method HIGH/LOW counts ─────────────────────────────────────────
    const riskRows = db.getAllSync<{ method_name: string; risk_level: string; count: number }>(
        `SELECT method_name, risk_level, COUNT(*) AS count
         FROM method_analytics
         ${where}
         GROUP BY method_name, risk_level`,
    );

    const riskMap: Record<string, { high: number; low: number }> = {};
    for (const row of riskRows) {
        if (!riskMap[row.method_name]) riskMap[row.method_name] = { high: 0, low: 0 };
        if (row.risk_level === 'HIGH') riskMap[row.method_name].high = row.count;
        else riskMap[row.method_name].low = row.count;
    }
    const METHOD_ORDER = ['Pills', 'IUD', 'Implant', 'Injectable'];
    const methodRiskCounts: MethodRiskCount[] = METHOD_ORDER
        .filter(m => riskMap[m])
        .map(m => ({
            method: m,
            high:  riskMap[m].high,
            low:   riskMap[m].low,
            total: riskMap[m].high + riskMap[m].low,
        }));

    // ── 2. Average probability per method ─────────────────────────────────────
    const avgRows = db.getAllSync<{ method_name: string; avg_prob: number; count: number }>(
        `SELECT method_name, AVG(probability) AS avg_prob, COUNT(*) AS count
         FROM method_analytics
         ${where}
         GROUP BY method_name
         ORDER BY avg_prob DESC`,
    );
    const methodAvgProbs: MethodAvgProb[] = (avgRows as Array<{ method_name: string; avg_prob: number; count: number }>)
        .map(r => ({
            method:  r.method_name,
            avgProb: r.avg_prob,
            count:   r.count,
        }));

    // ── 3. Top SHAP factor frequency (per distinct patient) ───────────────────
    const factorRows = db.getAllSync<{ top_risk_factor: string; count: number }>(
        `SELECT top_risk_factor, COUNT(DISTINCT assessment_id) AS count
         FROM method_analytics
         ${where}
         GROUP BY top_risk_factor
         ORDER BY count DESC
         LIMIT 6`,
    );
    const factorCounts: FactorCount[] = (factorRows as Array<{ top_risk_factor: string; count: number }>)
        .map(r => ({ label: r.top_risk_factor, count: r.count }));

    // ── 4. Summary KPIs ───────────────────────────────────────────────────────
    const kpiRow = db.getFirstSync<{ total_patients: number; overall_avg: number }>(
        `SELECT COUNT(DISTINCT assessment_id) AS total_patients,
                AVG(probability)              AS overall_avg
         FROM method_analytics
         ${where}`,
    );

    const totalPatients   = kpiRow?.total_patients ?? 0;
    const overallAvgProb  = kpiRow?.overall_avg ?? 0;
    const mostAtRiskMethod = methodAvgProbs[0]?.method ?? '—';

    return {
        methodRiskCounts,
        methodAvgProbs,
        factorCounts,
        totalPatients,
        overallAvgProb,
        mostAtRiskMethod,
    };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildWhereClause(timeframe: Timeframe): string {
    switch (timeframe) {
        case 'week':
            return `WHERE assessment_date >= datetime('now', '-7 days')`;
        case 'month':
            return `WHERE strftime('%Y-%m', assessment_date) = strftime('%Y-%m', 'now')`;
        case 'all':
        default:
            return '';
    }
}
