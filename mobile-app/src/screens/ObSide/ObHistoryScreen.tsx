import React, { useState, useCallback, useMemo } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, FlatList,
    RefreshControl, ScrollView, ActivityIndicator, LayoutAnimation, UIManager, Platform
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import {
    CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
    User as UserIcon, Baby, Cigarette, Calendar,
    Activity, Stethoscope, BookOpen,
    Clock, Heart, MessageSquare, WifiOff,
} from 'lucide-react-native';
import { auth } from '../../config/firebaseConfig';
import { fetchDoctorAssessments, loadAssessmentsCache, AssessmentRecord } from '../../services/doctorService';
import { isOnline } from '../../utils/networkUtils';
import ObHeader from '../../components/ObHeader';
import { colors } from '../../theme';
import { WHO_MEC_CONDITIONS } from '../../data/whoMecData';
import { getDisplayNameFromModelKey } from '../../services/mecService';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatRelativeTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

// --- Helpers ---
const getRiskColor = (risk?: string) => {
    switch ((risk || '').toLowerCase()) {
        case 'high': return '#EF4444';
        case 'moderate': return '#F59E0B';
        case 'low': return '#10B981';
        default: return '#64748B';
    }
};

const getStatusMeta = (status: string, riskLevel?: string) => {
    const risk = (riskLevel || '').toLowerCase();
    if (risk === 'high' || status === 'critical') return { label: 'HIGH RISK', bg: '#FEF2F2', text: '#EF4444', icon: AlertTriangle };
    if (status === 'completed') return { label: 'COMPLETED', bg: '#F0FDF4', text: '#10B981', icon: CheckCircle2 };
    return { label: 'REVIEWED', bg: '#F0F9FF', text: '#0EA5E9', icon: Activity };
};

const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─── Expandable Card ────────────────────────────────────────────────────────
const HistoryCard = ({ item, initialExpanded = false }: { item: AssessmentRecord; initialExpanded?: boolean }) => {
    const [expanded, setExpanded] = useState(initialExpanded);

    const pd = item.patientData || {};
    const riskLevel = item.status === 'critical' ? 'high' : 'low';
    const riskColor = getRiskColor(riskLevel);
    const statusMeta = getStatusMeta(item.status, riskLevel);
    const StatusIcon = statusMeta.icon;
    const smokerLabel = pd.SMOKE_CIGAR && pd.SMOKE_CIGAR !== 'Never' && pd.SMOKE_CIGAR !== 'No' ? 'Smoker' : 'Non-Smoker';
    const riskResults = item.riskResults || {};

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => !prev);
    };

    return (
        <View style={[styles.card, expanded && styles.cardExpanded]}>
            {/* Color Strip */}
            <View style={[styles.strip, { backgroundColor: riskColor }]} />

            <View style={styles.cardBody}>
                {/* ── Header Row ── */}
                <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.patientName}>{item.patientName || pd.NAME || 'Unknown Patient'}</Text>
                        <View style={styles.metaChips}>
                            <View style={styles.metaChip}>
                                <Calendar size={10} color="#94A3B8" />
                                <Text style={styles.metaChipText}>{formatDate(item.createdAt)}</Text>
                            </View>
                            {item.pendingSync && (
                                <View style={styles.metaChip}>
                                    <Clock size={10} color="#F59E0B" />
                                    <Text style={[styles.metaChipText, { color: '#F59E0B' }]}>Pending sync</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
                            <StatusIcon size={10} color={statusMeta.text} />
                            <Text style={[styles.statusLabel, { color: statusMeta.text }]}>{statusMeta.label}</Text>
                        </View>
                        <View style={[styles.chevronBtn, { backgroundColor: riskColor + '12' }]}>
                            {expanded
                                ? <ChevronUp size={16} color={riskColor} />
                                : <ChevronDown size={16} color={riskColor} />
                            }
                        </View>
                    </View>
                </TouchableOpacity>

                {/* ── Collapsed Summary Pill Row ── */}
                {!expanded && (
                    <View style={styles.pillRow}>
                        <View style={styles.pill}>
                            <UserIcon size={11} color="#64748B" />
                            <Text style={styles.pillText}>{pd.AGE ? pd.AGE + 'y' : '—'}</Text>
                        </View>
                        <View style={styles.pill}>
                            <Cigarette size={11} color="#64748B" />
                            <Text style={styles.pillText}>{smokerLabel}</Text>
                        </View>
                        <View style={styles.pill}>
                            <Baby size={11} color="#64748B" />
                            <Text style={styles.pillText}>P{pd.PARITY ?? '0'}</Text>
                        </View>
                        {item.mecConditionIds && item.mecConditionIds.length > 0 && (
                            <View style={[styles.pill, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                                <Stethoscope size={11} color="#0369A1" />
                                <Text style={[styles.pillText, { color: '#0369A1' }]}>
                                    {item.mecConditionIds.length} MEC
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ── OB Note Snippet (collapsed only) ── */}
                {!expanded && item.clinicalNotes ? (
                    <View style={styles.noteSnippet}>
                        <MessageSquare size={11} color="#94A3B8" />
                        <Text style={styles.noteSnippetText} numberOfLines={1}>{item.clinicalNotes}</Text>
                    </View>
                ) : null}

                {/* ── EXPANDED CONTENT ── */}
                {expanded && (
                    <View style={styles.expandedContent}>

                        {/* ─ Patient Profile ─ */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <UserIcon size={14} color="#E45A92" />
                                <Text style={styles.sectionTitle}>Patient Profile</Text>
                            </View>
                            <View style={styles.profileGrid}>
                                {[
                                    { label: 'Patient Age', value: pd.AGE ? `${pd.AGE} yrs` : '—' },
                                    { label: 'Husband Age', value: pd.HUSBAND_AGE || '—' },
                                    { label: 'Ethnicity', value: pd.ETHNICITY || '—' },
                                    { label: 'HH Head Sex', value: pd.HOUSEHOLD_HEAD_SEX || '—' },
                                    { label: 'Smoking', value: pd.SMOKE_CIGAR || 'Never' },
                                    { label: 'Parity', value: `${pd.PARITY ?? 0}` },
                                    { label: 'Use Pattern', value: pd.PATTERN_USE || '—' },
                                    { label: 'Child Plans', value: pd.DESIRE_FOR_MORE_CHILDREN || '—' },
                                ].map((row, i) => (
                                    <View key={i} style={[styles.profileRow, i % 2 === 0 && styles.profileRowAlt]}>
                                        <Text style={styles.profileLabel}>{row.label}</Text>
                                        <Text style={styles.profileValue}>{row.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* ─ Medical Conditions (MEC) ─ */}
                        {item.mecConditionIds && item.mecConditionIds.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Stethoscope size={14} color="#E45A92" />
                                    <Text style={styles.sectionTitle}>Medical Conditions (MEC)</Text>
                                </View>
                                <View style={styles.notesBox}>
                                    {item.mecConditionIds.map((id, idx) => {
                                        const entry = WHO_MEC_CONDITIONS.find(c => c.id === id);
                                        let label = entry ? entry.condition : id;
                                        if (entry?.subCondition) label += ` — ${entry.subCondition}`;
                                        return (
                                            <Text key={id} style={[styles.notesText, idx > 0 && { marginTop: 4 }]}>
                                                • {label}
                                            </Text>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* ─ Risk Results ─ */}
                        {Object.keys(riskResults).length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Activity size={14} color="#E45A92" />
                                    <Text style={styles.sectionTitle}>Discontinuation Risk</Text>
                                </View>
                                {Object.entries(riskResults).map(([method, result]) => {
                                    const mColor = getRiskColor(result.riskLevel);
                                    const pct = result.probability != null
                                        ? Math.min(result.probability * 100, 100)
                                        : 0;
                                    return (
                                        <View key={method} style={styles.riskRow}>
                                            <View style={styles.riskRowTop}>
                                                <Text style={styles.riskMethodName}>{getDisplayNameFromModelKey(method)}</Text>
                                                <Text style={[styles.riskPct, { color: mColor }]}>{pct.toFixed(0)}%</Text>
                                            </View>
                                            <View style={styles.barBg}>
                                                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: mColor }]} />
                                            </View>
                                            {result.recommendation
                                                ? <Text style={styles.riskNote}>{result.recommendation}</Text>
                                                : null}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* ─ OB Clinical Notes ─ */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Stethoscope size={14} color="#E45A92" />
                                <Text style={styles.sectionTitle}>OB Clinical Notes</Text>
                            </View>
                            <View style={styles.notesBox}>
                                <Text style={styles.notesText}>
                                    {item.clinicalNotes || 'No clinical notes recorded for this encounter.'}
                                </Text>
                            </View>
                            {item.doctorName ? (
                                <View style={styles.obRow}>
                                    <Stethoscope size={11} color="#94A3B8" />
                                    <Text style={styles.obNameText}>{item.doctorName}</Text>
                                    <Clock size={11} color="#94A3B8" />
                                    <Text style={styles.obNameText}>{formatDate(item.createdAt)}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

// ─── Screen ─────────────────────────────────────────────────────────────────
const ObHistoryScreen = () => {
    const route = useRoute<any>();
    const scrollToId = route.params?.recordId;

    const [history, setHistory] = useState<AssessmentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [cachedAt, setCachedAt] = useState<number | null>(null);
    const [filterRisk, setFilterRisk] = useState<'All' | 'Low' | 'High'>('All');

    const doctorUid = auth.currentUser?.uid;

    const loadHistory = useCallback(async (isManualRefresh = false) => {
        if (!doctorUid) {
            setLoading(false);
            return;
        }

        if (isManualRefresh) setRefreshing(true);

        // Step 1: Load local cache immediately (works offline)
        const cached = await loadAssessmentsCache(doctorUid);
        if (cached.length > 0) {
            setHistory(cached);
            setCachedAt(Date.now());
            setLoading(false);
        }

        // Step 2: Try Firestore refresh in background
        const online = await isOnline();
        setIsOffline(!online);

        if (online) {
            try {
                const fresh = await fetchDoctorAssessments(doctorUid);
                setHistory(fresh);
                setCachedAt(Date.now());
                setIsOffline(false);
            } catch {
                // Firestore failed — local cache already shown
            }
        }

        setLoading(false);
        setRefreshing(false);
    }, [doctorUid]);

    useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

    const stats = useMemo(() => {
        const high = history.filter(item => item.status === 'critical').length;
        const low = Math.max(history.length - high, 0);
        return { total: history.length, high, low };
    }, [history]);

    const filtered = history.filter(item => {
        if (filterRisk === 'All') return true;
        const risk = item.status === 'critical' ? 'High' : 'Low';
        return risk === filterRisk;
    });

    return (
        <View style={styles.container}>
            <ObHeader title="Patient History" subtitle="Completed Consultations" />

            <View pointerEvents="none" style={styles.bgDecorWrap}>
                <View style={styles.bgBlobOne} />
                <View style={styles.bgBlobTwo} />
            </View>

            <View style={styles.summaryRow}>
                <View style={styles.summaryCardPrimary}>
                    <Text style={styles.summaryLabel}>Total Cases</Text>
                    <Text style={styles.summaryValue}>{stats.total}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>High Risk</Text>
                    <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{stats.high}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Low Risk</Text>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>{stats.low}</Text>
                </View>
            </View>

            {/* Offline Banner */}
            {isOffline && (
                <View style={styles.offlineBanner}>
                    <WifiOff size={13} color="#92400E" />
                    <Text style={styles.offlineBannerText}>
                        Offline — showing cached data
                        {cachedAt ? ` · ${formatRelativeTime(Date.now() - cachedAt)}` : ''}
                    </Text>
                </View>
            )}

            {/* Filter Chips */}
            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                    {(['All', 'Low', 'High'] as const).map(risk => (
                        <TouchableOpacity
                            key={risk}
                            style={[styles.chip, filterRisk === risk && styles.chipActive]}
                            onPress={() => setFilterRisk(risk)}
                        >
                            {risk !== 'All' && (
                                <View style={[styles.chipDot, { backgroundColor: getRiskColor(risk) }]} />
                            )}
                            <Text style={[styles.chipText, filterRisk === risk && styles.chipTextActive]}>
                                {risk === 'All' ? 'All Patients' : `${risk} Risk`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filtered}
                renderItem={({ item }) => (
                    <HistoryCard
                        item={item}
                        initialExpanded={item.id === scrollToId}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadHistory(true)}
                        tintColor="#E45A92"
                    />
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator size="large" color="#E45A92" />
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <BookOpen size={32} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>No completed consultations</Text>
                            <Text style={styles.emptySub}>
                                {isOffline
                                    ? 'Connect to the internet to sync your history.'
                                    : 'Completed assessments will appear here.'}
                            </Text>
                        </View>
                    )
                }
            />
        </View>
    );
};

export default ObHistoryScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    bgDecorWrap: {
        ...StyleSheet.absoluteFillObject,
    },
    bgBlobOne: {
        position: 'absolute',
        top: 110,
        right: -90,
        width: 210,
        height: 210,
        borderRadius: 105,
        backgroundColor: 'rgba(236, 72, 153, 0.08)',
    },
    bgBlobTwo: {
        position: 'absolute',
        bottom: 100,
        left: -95,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(244, 114, 182, 0.07)',
    },

    // SUMMARY CARDS
    summaryRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
    },
    summaryCardPrimary: {
        flex: 1,
        backgroundColor: '#FDF2F8',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F8D6E5',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    summaryCard: {
        minWidth: 88,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EDF2F7',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    summaryLabel: {
        fontSize: 13,
        color: colors.text.secondary,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    summaryValue: {
        marginTop: 2,
        fontSize: 22,
        color: colors.text.primary,
        fontWeight: '800',
    },

    // OFFLINE BANNER
    offlineBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#FDE68A',
    },
    offlineBannerText: { fontSize: 12, color: '#92400E', fontWeight: '500' },

    // FILTER BAR
    filterBar: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingVertical: 10,
    },
    filterContent: { paddingHorizontal: 16, gap: 8 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#FFF0F6',
        borderWidth: 1,
        borderColor: '#F8D6E5',
        marginRight: 8,
    },
    chipActive: { backgroundColor: '#E45A92' },
    chipDot: { width: 8, height: 8, borderRadius: 3, marginRight: 6 },
    chipText: { fontSize: 14, color: '#BE185D', fontWeight: '700' },
    chipTextActive: { color: '#FFFFFF' },

    // LIST
    list: { padding: 14 },

    // ── CARD ─────────────────────────────────────────────────────────────
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 10,
        flexDirection: 'row', overflow: 'hidden',
        borderWidth: 1, borderColor: '#EEF2F7',
        shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 7, elevation: 1,
    },
    cardExpanded: {
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
        borderColor: '#E2E8F0',
    },
    strip: { width: 6 },
    cardBody: { flex: 1, padding: 15 },

    // Card Header
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    patientName: { fontSize: 17, fontWeight: '800', color: colors.text.primary, marginBottom: 6 },
    metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#EEF2F7',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    metaChipText: { fontSize: 11.5, color: '#94A3B8', fontWeight: '500' },
    headerRight: { alignItems: 'flex-end', gap: 6, marginLeft: 10 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, gap: 4 },
    statusLabel: { fontSize: 12, fontWeight: '800' },
    chevronBtn: { padding: 5, borderRadius: 8 },

    // Collapsed
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    pillText: { fontSize: 11.5, color: '#64748B', fontWeight: '500' },
    noteSnippet: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    noteSnippetText: { fontSize: 12, color: '#94A3B8', flex: 1, fontStyle: 'italic' },

    // ── EXPANDED CONTENT ─────────────────────────────────────────────────
    expandedContent: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14 },

    // Section
    section: { marginBottom: 18 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.6 },

    // Profile grid (2-col table)
    profileGrid: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 9, paddingHorizontal: 12 },
    profileRowAlt: { backgroundColor: '#FAFBFC' },
    profileLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
    profileValue: { fontSize: 14, color: '#1E293B', fontWeight: '600', textAlign: 'right' },
    profileSub: { fontSize: 12, color: '#CBD5E1', textAlign: 'right' },

    // Preference grid (2-col card chips)
    prefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    prefCard: {
        flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', borderRadius: 12,
        padding: 12, borderWidth: 1, borderColor: '#F1F5F9',
    },
    prefLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    prefValue: { fontSize: 13.5, color: '#1E293B', fontWeight: '700' },

    // Risk bars
    riskRow: { marginBottom: 12 },
    riskRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    riskMethodName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
    riskPct: { fontSize: 13, fontWeight: '800' },
    barBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    riskNote: { fontSize: 13, color: '#94A3B8', marginTop: 3, fontStyle: 'italic' },

    // Notes
    notesBox: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#FEF3C7' },
    notesText: { fontSize: 14, color: colors.text.primary, lineHeight: 21 },
    obRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
    obNameText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },

    // EMPTY
    emptyContainer: { padding: 60, alignItems: 'center' },
    emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
    emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});
