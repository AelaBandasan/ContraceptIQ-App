/**
 * AnalyticsScreen.tsx — Aggregate analytics dashboard (OB flow)
 *
 * Data pipeline:
 *   1. On tab focus → seed any AsyncStorage records missing from SQLite (idempotent)
 *   2. On timeframe change → run three synchronous SQLite aggregate queries
 *   3. Render three charts + four KPI cards from the results
 *
 * Chart 1 — Method Risk Breakdown
 *   Per-method HIGH/LOW count. Each of the 4 assessed methods gets a stacked
 *   bar showing how many patient assessments were HIGH vs LOW risk for that method.
 *   Unit: individual method-level predictions, not patient-level summaries.
 *
 * Chart 2 — Average Discontinuation Probability
 *   Mean xgb_probability per method across all assessments in the timeframe.
 *   Shows which method the model consistently scores highest for this patient cohort.
 *
 * Chart 3 — Top Patient Risk Factors
 *   Frequency of the #1 SHAP-ranked feature per patient (e.g. "Use pattern",
 *   "More children"). Matches the Key Factors displayed on each RiskAssessmentCard.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
    BarChart2, TrendingUp, Users, AlertTriangle, Activity,
} from 'lucide-react-native';
import { auth } from '../../config/firebaseConfig';
import { loadAssessmentsCache } from '../../services/doctorService';
import {
    seedAssessmentAnalytics,
    getAnalyticsData,
    type Timeframe,
    type AnalyticsData,
    type MethodRiskCount,
    type MethodAvgProb,
    type FactorCount,
} from '../../services/database';
import ObHeader from '../../components/ObHeader';
import { colors, shadows } from '../../theme';

// ─── Layout constants ─────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;

const TIMEFRAME_OPTIONS: { label: string; value: Timeframe }[] = [
    { label: 'This Week',  value: 'week'  },
    { label: 'This Month', value: 'month' },
    { label: 'All Time',   value: 'all'   },
];

// Method colours — consistent across both charts
const METHOD_COLORS: Record<string, string> = {
    Pills:      '#D81B60',
    IUD:        '#7C3AED',
    Implant:    '#0891B2',
    Injectable: '#059669',
};
const METHOD_COLORS_LIGHT: Record<string, string> = {
    Pills:      '#FDF2F8',
    IUD:        '#EDE9FE',
    Implant:    '#E0F7FA',
    Injectable: '#ECFDF5',
};
const HIGH_COLOR = '#EF4444';
const LOW_COLOR  = '#10B981';

function formatProb(prob: number) {
    return `${Math.round(prob * 100)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    accent: string;
    border: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accent, border }) => (
    <View style={[styles.kpiCard, { backgroundColor: accent, borderColor: border }]}>
        <View style={styles.kpiTopContent}>
            <View style={styles.kpiIcon}>{icon}</View>
            <Text style={styles.kpiLabel}>{label}</Text>
        </View>
        <Text style={styles.kpiValue} numberOfLines={2} adjustsFontSizeToFit>{value}</Text>
    </View>
);

interface ChartCardProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}
const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children }) => (
    <View style={styles.chartCard}>
        <View style={styles.chartCardHeader}>
            <Text style={styles.chartTitle}>{title}</Text>
            <Text style={styles.chartSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.chartBody}>{children}</View>
    </View>
);

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
    <View style={styles.emptyChart}>
        <BarChart2 size={32} color="#CBD5E1" />
        <Text style={styles.emptyChartText}>{message}</Text>
    </View>
);

/**
 * Chart 1 — Stacked HIGH/LOW bars per method.
 * Each row shows count badges and proportional coloured bars.
 *
 * Example:
 *   Pills      [HIGH ██████ 8]  [LOW ████████████ 12]
 *   IUD        [HIGH ████ 4]    [LOW ████████████████ 16]
 */
const MethodRiskChart: React.FC<{ data: MethodRiskCount[] }> = ({ data }) => {
    const maxTotal = Math.max(...data.map(d => d.total), 1);
    return (
        <View style={styles.factorList}>
            {/* Legend */}
            <View style={styles.riskLegendRow}>
                <View style={styles.legendDot}>
                    <View style={[styles.dot, { backgroundColor: HIGH_COLOR }]} />
                    <Text style={styles.legendText}>High Risk</Text>
                </View>
                <View style={styles.legendDot}>
                    <View style={[styles.dot, { backgroundColor: LOW_COLOR }]} />
                    <Text style={styles.legendText}>Low Risk</Text>
                </View>
            </View>

            {data.map(item => {
                const highPct = maxTotal > 0 ? (item.high / maxTotal) * 100 : 0;
                const lowPct  = maxTotal > 0 ? (item.low  / maxTotal) * 100 : 0;
                const color   = METHOD_COLORS[item.method] ?? colors.primary;
                const bgColor = METHOD_COLORS_LIGHT[item.method] ?? '#F5F5F5';
                return (
                    <View key={item.method} style={styles.methodRow}>
                        {/* Method badge */}
                        <View style={[styles.methodBadge, { backgroundColor: bgColor }]}>
                            <Text style={[styles.methodBadgeText, { color }]}>{item.method}</Text>
                        </View>

                        {/* Bars */}
                        <View style={styles.stackedBars}>
                            {/* HIGH bar */}
                            <View style={styles.barLine}>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, {
                                        width: `${highPct}%`,
                                        backgroundColor: HIGH_COLOR,
                                    }]} />
                                </View>
                                <View style={[styles.countBadge, { backgroundColor: HIGH_COLOR + '18' }]}>
                                    <Text style={[styles.countBadgeText, { color: HIGH_COLOR }]}>
                                        {item.high}
                                    </Text>
                                </View>
                            </View>

                            {/* LOW bar */}
                            <View style={styles.barLine}>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, {
                                        width: `${lowPct}%`,
                                        backgroundColor: LOW_COLOR,
                                    }]} />
                                </View>
                                <View style={[styles.countBadge, { backgroundColor: LOW_COLOR + '18' }]}>
                                    <Text style={[styles.countBadgeText, { color: LOW_COLOR }]}>
                                        {item.low}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

/**
 * Chart 2 — Average discontinuation probability per method (horizontal bars).
 * The bar width represents the mean xgb_probability relative to the highest method.
 *
 * Example:
 *   1  Injectable  ████████████████████  62%  (n=20)
 *   2  Pills       █████████████         41%  (n=20)
 */
const AvgProbChart: React.FC<{ data: MethodAvgProb[] }> = ({ data }) => {
    const maxProb = Math.max(...data.map(d => d.avgProb), 0.01);
    return (
        <View style={styles.factorList}>
            {data.map((item, i) => {
                const barPct  = (item.avgProb / maxProb) * 100;
                const color   = METHOD_COLORS[item.method] ?? colors.primary;
                const bgColor = METHOD_COLORS_LIGHT[item.method] ?? '#F5F5F5';
                return (
                    <View key={item.method} style={styles.factorRow}>
                        <View style={[styles.factorRank, { backgroundColor: bgColor }]}>
                            <Text style={[styles.factorRankText, { color }]}>{i + 1}</Text>
                        </View>
                        <View style={styles.factorBarWrap}>
                            <View style={styles.probLabelRow}>
                                <Text style={styles.factorLabel}>{item.method}</Text>
                                <Text style={[styles.probValue, { color }]}>
                                    {formatProb(item.avgProb)}
                                </Text>
                            </View>
                            <View style={styles.factorTrack}>
                                <View style={[styles.factorFill, {
                                    width: `${barPct}%`,
                                    backgroundColor: color,
                                }]} />
                            </View>
                            <Text style={styles.probSampleSize}>n = {item.count} assessments</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

// Rank colours for the SHAP factor list
const FACTOR_COLORS = ['#D81B60', '#E45A92', '#EC81AC', '#F2A8C6', '#F7CFDF', '#FAE0EB'];

/**
 * Chart 3 — Top SHAP-ranked patient features by patient frequency.
 */
const FactorList: React.FC<{ factors: FactorCount[] }> = ({ factors }) => {
    const max = factors[0]?.count ?? 1;
    return (
        <View style={styles.factorList}>
            {factors.map((f, i) => {
                const barPct   = max > 0 ? (f.count / max) * 100 : 0;
                const barColor = FACTOR_COLORS[i] ?? FACTOR_COLORS[FACTOR_COLORS.length - 1];
                return (
                    <View key={f.label} style={styles.factorRow}>
                        <View style={[styles.factorRank, { backgroundColor: barColor + '22' }]}>
                            <Text style={[styles.factorRankText, { color: barColor }]}>{i + 1}</Text>
                        </View>
                        <View style={styles.factorBarWrap}>
                            <Text style={styles.factorLabel} numberOfLines={1}>{f.label}</Text>
                            <View style={styles.factorTrack}>
                                <View style={[styles.factorFill, {
                                    width: `${barPct}%`,
                                    backgroundColor: barColor,
                                }]} />
                            </View>
                        </View>
                        <View style={[styles.factorCount, { backgroundColor: barColor + '18' }]}>
                            <Text style={[styles.factorCountText, { color: barColor }]}>{f.count}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const AnalyticsScreen: React.FC = () => {
    const [timeframe, setTimeframe]   = useState<Timeframe>('month');
    const [analytics, setAnalytics]   = useState<AnalyticsData | null>(null);
    const [loading, setLoading]       = useState(true);
    const [seeding, setSeeding]       = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const seedingRef                  = useRef(false);
    const doctorUid                   = auth.currentUser?.uid;

    // ── Seed AsyncStorage → SQLite ────────────────────────────────────────────

    const seedFromCache = useCallback(async () => {
        if (!doctorUid || seedingRef.current) return;
        seedingRef.current = true;
        setSeeding(true);
        try {
            const cached = await loadAssessmentsCache(doctorUid);
            for (const record of cached) {
                try { seedAssessmentAnalytics(record); } catch { /* skip malformed */ }
            }
        } catch { /* non-fatal */ } finally {
            seedingRef.current = false;
            setSeeding(false);
        }
    }, [doctorUid]);

    // ── Query SQLite ──────────────────────────────────────────────────────────

    const queryAnalytics = useCallback((tf: Timeframe) => {
        setLoading(true);
        setError(null);
        setTimeout(() => {
            try {
                setAnalytics(getAnalyticsData(tf));
            } catch {
                setError('Unable to load analytics. Please try again.');
            } finally {
                setLoading(false);
            }
        }, 50);
    }, []);

    useFocusEffect(useCallback(() => {
        let active = true;
        (async () => {
            await seedFromCache();
            if (active) queryAnalytics(timeframe);
        })();
        return () => { active = false; };
    }, [seedFromCache, queryAnalytics, timeframe]));

    const handleTimeframeChange = useCallback((tf: Timeframe) => {
        setTimeframe(tf);
        queryAnalytics(tf);
    }, [queryAnalytics]);

    // ── Derived ───────────────────────────────────────────────────────────────

    const hasMethodData  = (analytics?.methodRiskCounts.length ?? 0) > 0;
    const hasAvgData     = (analytics?.methodAvgProbs.length ?? 0) > 0;
    const hasFactorData  = (analytics?.factorCounts.length ?? 0) > 0;
    const totalPatients  = analytics?.totalPatients ?? 0;
    const overallAvg     = analytics?.overallAvgProb ?? 0;
    const topMethod      = analytics?.mostAtRiskMethod ?? '—';
    const topFactor      = analytics?.factorCounts[0]?.label ?? '—';

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
            <ObHeader title="Analytics" subtitle="Patient Overview Analytics" />

            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <View style={styles.blobOne} />
                <View style={styles.blobTwo} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Timeframe toggle ──────────────────────────────────── */}
                <View style={styles.toggleRow}>
                    {TIMEFRAME_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.toggleBtn, timeframe === opt.value && styles.toggleBtnActive]}
                            onPress={() => handleTimeframeChange(opt.value)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.toggleLabel, timeframe === opt.value && styles.toggleLabelActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {seeding && (
                    <View style={styles.seedingBanner}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.seedingText}>Syncing records…</Text>
                    </View>
                )}

                {loading ? (
                    <View style={styles.centeredState}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.stateSubtext}>Loading analytics…</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centeredState}>
                        <AlertTriangle size={36} color={colors.error} />
                        <Text style={styles.stateTitle}>Something went wrong</Text>
                        <Text style={styles.stateSubtext}>{error}</Text>
                    </View>
                ) : (
                    <>
                        {/* ── KPI stat cards ──────────────────────────────── */}
                        <View style={styles.kpiRow}>
                            <StatCard
                                icon={<Users size={18} color={colors.primary} />}
                                label="Patients Assessed"
                                value={String(totalPatients)}
                                accent="#FDF2F8"
                                border="#F8D6E5"
                            />
                            <StatCard
                                icon={<Activity size={18} color="#EF4444" />}
                                label="Avg Discontinuation Risk"
                                value={formatProb(overallAvg)}
                                accent="#FEF2F2"
                                border="#FECACA"
                            />
                            <StatCard
                                icon={<TrendingUp size={18} color="#7C3AED" />}
                                label="Most At-Risk Method"
                                value={topMethod}
                                accent="#EDE9FE"
                                border="#C4B5FD"
                            />
                            <StatCard
                                icon={<BarChart2 size={18} color="#0891B2" />}
                                label="Top Risk Driver"
                                value={topFactor}
                                accent="#E0F7FA"
                                border="#A5F3FC"
                            />
                        </View>

                        {/* ── Chart 1: Method risk breakdown ───────────────── */}
                        <ChartCard
                            title="Risk by Method"
                            subtitle="HIGH vs LOW predictions per contraceptive method"
                        >
                            {hasMethodData
                                ? <MethodRiskChart data={analytics!.methodRiskCounts} />
                                : <EmptyChart message="No assessments recorded for this period." />
                            }
                        </ChartCard>

                        {/* ── Chart 2: Avg discontinuation probability ─────── */}
                        <ChartCard
                            title="Avg Discontinuation Probability"
                            subtitle="Mean XGBoost score per method across all patients"
                        >
                            {hasAvgData
                                ? <AvgProbChart data={analytics!.methodAvgProbs} />
                                : <EmptyChart message="No assessments recorded for this period." />
                            }
                        </ChartCard>

                        {/* ── Chart 3: Top SHAP factors ────────────────────── */}
                        <ChartCard
                            title="Top Risk Drivers"
                            subtitle="Leading SHAP-ranked patient feature (V4 model)"
                        >
                            {hasFactorData
                                ? <FactorList factors={analytics!.factorCounts} />
                                : <EmptyChart message="No assessments recorded for this period." />
                            }
                        </ChartCard>

                        <Text style={styles.legendNote}>
                            Risk drivers are derived from risk_factors_v4_signed.json and match
                            the Key Factors shown on each patient's assessment card. Patient count
                            reflects unique visits, not individual method predictions.
                        </Text>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default AnalyticsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },

    blobOne: {
        position: 'absolute', top: 110, right: -90,
        width: 210, height: 210, borderRadius: 105,
        backgroundColor: 'rgba(216, 27, 96, 0.07)',
    },
    blobTwo: {
        position: 'absolute', bottom: 100, left: -95,
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(244, 114, 182, 0.06)',
    },

    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },

    // ── Timeframe toggle ──────────────────────────────────────────────────────
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
        ...shadows.sm,
    },
    toggleBtn: {
        flex: 1, paddingVertical: 10,
        borderRadius: 10, alignItems: 'center',
    },
    toggleBtnActive: { backgroundColor: colors.primary },
    toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.text.secondary },
    toggleLabelActive: { color: '#FFFFFF', fontWeight: '700' },

    // ── Seeding banner ────────────────────────────────────────────────────────
    seedingBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF7ED', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 8,
        marginBottom: 10, borderWidth: 1, borderColor: '#FED7AA',
    },
    seedingText: { fontSize: 14, color: '#92400E', fontWeight: '500' },

    // ── State views ───────────────────────────────────────────────────────────
    centeredState: { alignItems: 'center', paddingTop: 80, gap: 12 },
    stateTitle:    { fontSize: 17, fontWeight: '700', color: '#334155' },
    stateSubtext:  { fontSize: 14, color: '#94A3B8', textAlign: 'center' },

    // ── KPI cards ─────────────────────────────────────────────────────────────
    kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    kpiCard: {
        width: (SCREEN_WIDTH - 42) / 2,
        borderRadius: 14, borderWidth: 1,
        padding: 14,
    },
    kpiTopContent: { flex: 1 },
    kpiIcon: {
        width: 40, height: 40, borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 6,
    },
    kpiLabel: {
        fontSize: 13, fontWeight: '700', color: '#64748B',
        textTransform: 'uppercase', letterSpacing: 0.4,
        marginBottom: 6,
    },
    kpiValue: {
        fontSize: 18, fontWeight: '800', color: '#1E293B',
        marginTop: 'auto',
    },

    // ── Chart card wrapper ────────────────────────────────────────────────────
    chartCard: {
        backgroundColor: '#FFFFFF', borderRadius: 18,
        marginBottom: 16, borderWidth: 1, borderColor: '#EEF2F7',
        overflow: 'hidden', ...shadows.sm,
    },
    chartCardHeader: {
        paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
    },
    chartTitle:    { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
    chartSubtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
    chartBody:     { paddingVertical: 8, paddingHorizontal: 4 },

    // ── Shared list layout (used by all three charts) ─────────────────────────
    factorList: { width: '100%', paddingHorizontal: 12, paddingBottom: 8, gap: 14 },
    factorRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    factorRank: {
        width: 28, height: 28, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    factorRankText:  { fontSize: 15, fontWeight: '800' },
    factorBarWrap:   { flex: 1, gap: 5 },
    factorLabel:     { fontSize: 15, fontWeight: '600', color: '#334155' },
    factorTrack:     { height: 8, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden' },
    factorFill:      { height: '100%', borderRadius: 999 },
    factorCount:     { minWidth: 32, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    factorCountText: { fontSize: 15, fontWeight: '800' },

    // ── Chart 2: avg prob extras ──────────────────────────────────────────────
    probLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    probValue:     { fontSize: 15, fontWeight: '800' },
    probSampleSize:{ fontSize: 12.5, color: '#94A3B8', fontWeight: '500', marginTop: 2 },

    // ── Chart 1: method risk breakdown ────────────────────────────────────────
    riskLegendRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
    legendDot:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot:           { width: 10, height: 10, borderRadius: 5 },
    legendText:    { fontSize: 14, color: '#64748B', fontWeight: '600' },

    methodRow:       { gap: 8 },
    methodBadge:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    methodBadgeText: { fontSize: 14, fontWeight: '700' },
    stackedBars:     { gap: 5 },
    barLine:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
    barTrack:        { flex: 1, height: 10, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden' },
    barFill:         { height: '100%', borderRadius: 999 },
    countBadge:      { minWidth: 30, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    countBadgeText:  { fontSize: 14, fontWeight: '700' },

    // ── Empty chart ───────────────────────────────────────────────────────────
    emptyChart:     { height: 120, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyChartText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 20 },

    // ── Legend note ───────────────────────────────────────────────────────────
    legendNote: {
        fontSize: 13, color: '#94A3B8', fontStyle: 'italic',
        textAlign: 'center', paddingHorizontal: 8, marginTop: 4, lineHeight: 17,
    },
});
