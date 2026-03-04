import React, { useState, useCallback } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, FlatList,
    RefreshControl, ScrollView, ActivityIndicator, LayoutAnimation, UIManager, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
    CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
    User as UserIcon, Baby, Cigarette, Calendar, MapPin,
    ClipboardList, FileText, Activity, Stethoscope, BookOpen,
    Hash, Clock, Heart, MessageSquare
} from 'lucide-react-native';
import { auth } from '../../config/firebaseConfig';
import { fetchDoctorHistory, ConsultationRecord } from '../../services/doctorService';
import ObHeader from '../../components/ObHeader';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Mock Data ---
const MOCK_HISTORY: ConsultationRecord[] = [
    {
        code: 'A7X99P',
        patientData: {
            NAME: 'Elena Ramos',
            AGE: '28',
            AGE_GROUP: '25–29',
            SMOKE_CIGAR: 'Never',
            PARITY: '2',
            RISK_LEVEL: 'Low',
            RECOMMENDED: 'Implant',
            REGION: 'Metro Manila',
            MARITAL_STATUS: 'Married',
            RELIGION: 'Catholic',
            EDUC_LEVEL: 'College graduate',
            DESIRE_FOR_MORE_CHILDREN: 'No',
            LAST_METHOD_DISCONTINUED: 'Pills',
            REASON_DISCONTINUED: 'Side effects',
        },
        riskResults: {
            Implant: { riskLevel: 'LOW', probability: 0.12, recommendation: 'Highly recommended based on profile', confidence: 'High' },
            Pills: { riskLevel: 'MODERATE', probability: 0.38, recommendation: 'Use with monitoring', confidence: 'Medium' },
        },
        riskResult: { riskLevel: 'LOW', probability: 0.12, recommendation: 'Implant is the top match', confidence: 'High' },
        clinicalNotes: 'Patient has history of pill discontinuation due to nausea. Switched to implant. No contraindications noted. Follow-up in 3 months.',
        obName: 'Dr. Maria Santos, OB-GYN',
        status: 'completed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        assessedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 3600000).toISOString(),
        expiresIn: 3600,
    },
    {
        code: 'B2Z11K',
        patientData: {
            NAME: 'Maria Clara',
            AGE: '34',
            AGE_GROUP: '30–34',
            SMOKE_CIGAR: 'Current daily',
            PARITY: '4',
            RISK_LEVEL: 'High',
            RECOMMENDED: 'None (Referral Required)',
            REGION: 'Cebu City',
            MARITAL_STATUS: 'Married',
            RELIGION: 'Catholic',
            EDUC_LEVEL: 'Secondary',
            DESIRE_FOR_MORE_CHILDREN: 'No',
            LAST_METHOD_DISCONTINUED: 'Injectable',
            REASON_DISCONTINUED: 'Health concerns',
        },
        riskResults: {
            'Copper IUD': { riskLevel: 'HIGH', probability: 0.74, recommendation: 'High discontinuation risk. Referral recommended.', confidence: 'High' },
        },
        riskResult: { riskLevel: 'HIGH', probability: 0.74, recommendation: 'Immediate referral advised.', confidence: 'High' },
        clinicalNotes: 'Referred to specialist due to cardiovascular risk factors and heavy smoking. Patient counseled on smoking cessation.',
        obName: 'Dr. Maria Santos, OB-GYN',
        status: 'critical',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        assessedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 3600000).toISOString(),
        expiresIn: 3600,
    },
    {
        code: 'C5M44L',
        patientData: {
            NAME: 'Liza Soberano',
            AGE: '22',
            AGE_GROUP: '20–24',
            SMOKE_CIGAR: 'Never',
            PARITY: '0',
            RISK_LEVEL: 'Low',
            RECOMMENDED: 'Pills',
            REGION: 'Davao',
            MARITAL_STATUS: 'Single',
            RELIGION: 'Christian',
            EDUC_LEVEL: 'College undergraduate',
            DESIRE_FOR_MORE_CHILDREN: 'Not Sure',
            LAST_METHOD_DISCONTINUED: 'None',
            REASON_DISCONTINUED: 'None / Not Applicable',
        },
        riskResults: {
            Pills: { riskLevel: 'LOW', probability: 0.09, recommendation: 'Well-suited for oral contraceptives', confidence: 'High' },
            Implant: { riskLevel: 'LOW', probability: 0.11, recommendation: 'Alternative long-term option', confidence: 'High' },
        },
        riskResult: { riskLevel: 'LOW', probability: 0.09, recommendation: 'Pills are the top match', confidence: 'High' },
        clinicalNotes: 'First-time contraceptive user. Educated on pill schedule adherence. Started on 21-day combined OCP.',
        obName: 'Dr. Maria Santos, OB-GYN',
        status: 'completed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        assessedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10 + 3600000).toISOString(),
        expiresIn: 3600,
    },
];

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
const HistoryCard = ({ item }: { item: ConsultationRecord }) => {
    const [expanded, setExpanded] = useState(false);

    const pd = item.patientData || {};
    const riskLevel = item.riskResult?.riskLevel || pd.RISK_LEVEL || '';
    const riskColor = getRiskColor(riskLevel);
    const statusMeta = getStatusMeta(item.status, riskLevel);
    const StatusIcon = statusMeta.icon;
    const smokerLabel = pd.SMOKE_CIGAR && pd.SMOKE_CIGAR !== 'Never' ? 'Smoker' : 'Non-Smoker';
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
                        <Text style={styles.patientName}>{pd.NAME || 'Unknown Patient'}</Text>
                        <View style={styles.metaChips}>
                            <View style={styles.metaChip}>
                                <Hash size={10} color="#94A3B8" />
                                <Text style={styles.metaChipText}>{item.code}</Text>
                            </View>
                            <View style={styles.metaChip}>
                                <Calendar size={10} color="#94A3B8" />
                                <Text style={styles.metaChipText}>{formatDate(item.assessedAt || item.createdAt)}</Text>
                            </View>
                            {pd.REGION && (
                                <View style={styles.metaChip}>
                                    <MapPin size={10} color="#94A3B8" />
                                    <Text style={styles.metaChipText}>{pd.REGION}</Text>
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
                            <Text style={styles.pillText}>{pd.AGE_GROUP || pd.AGE + 'y' || '—'}</Text>
                        </View>
                        <View style={styles.pill}>
                            <Cigarette size={11} color="#64748B" />
                            <Text style={styles.pillText}>{smokerLabel}</Text>
                        </View>
                        <View style={styles.pill}>
                            <Baby size={11} color="#64748B" />
                            <Text style={styles.pillText}>P{pd.PARITY ?? '0'}</Text>
                        </View>
                        <View style={[styles.pill, { backgroundColor: riskColor + '15' }]}>
                            <Text style={[styles.pillText, { color: riskColor, fontWeight: '700' }]}>
                                {pd.RECOMMENDED || '—'}
                            </Text>
                        </View>
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
                                    { label: 'Age', value: pd.AGE ? `${pd.AGE} yrs` : '—', sub: pd.AGE_GROUP },
                                    { label: 'Region', value: pd.REGION || '—' },
                                    { label: 'Marital', value: pd.MARITAL_STATUS || '—' },
                                    { label: 'Religion', value: pd.RELIGION || '—' },
                                    { label: 'Education', value: pd.EDUC_LEVEL || '—' },
                                    { label: 'Smoking', value: pd.SMOKE_CIGAR || 'Never' },
                                    { label: 'Parity', value: `${pd.PARITY ?? 0} birth${pd.PARITY !== '1' ? 's' : ''}` },
                                    { label: 'More Children', value: pd.DESIRE_FOR_MORE_CHILDREN || '—' },
                                ].map((row, i) => (
                                    <View key={i} style={[styles.profileRow, i % 2 === 0 && styles.profileRowAlt]}>
                                        <Text style={styles.profileLabel}>{row.label}</Text>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.profileValue}>{row.value}</Text>
                                            {row.sub ? <Text style={styles.profileSub}>{row.sub}</Text> : null}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* ─ Patient Preferences ─ */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Heart size={14} color="#E45A92" />
                                <Text style={styles.sectionTitle}>Stated Preferences</Text>
                            </View>
                            <View style={styles.prefGrid}>
                                <View style={styles.prefCard}>
                                    <Text style={styles.prefLabel}>Last Method</Text>
                                    <Text style={styles.prefValue}>{pd.LAST_METHOD_DISCONTINUED || 'None'}</Text>
                                </View>
                                <View style={styles.prefCard}>
                                    <Text style={styles.prefLabel}>Reason Stopped</Text>
                                    <Text style={styles.prefValue}>{pd.REASON_DISCONTINUED || 'N/A'}</Text>
                                </View>
                                <View style={styles.prefCard}>
                                    <Text style={styles.prefLabel}>Wants More Children</Text>
                                    <Text style={styles.prefValue}>{pd.DESIRE_FOR_MORE_CHILDREN || '—'}</Text>
                                </View>
                                <View style={[styles.prefCard, { backgroundColor: riskColor + '10', borderColor: riskColor + '30' }]}>
                                    <Text style={styles.prefLabel}>OB Recommended</Text>
                                    <Text style={[styles.prefValue, { color: riskColor }]}>{pd.RECOMMENDED || '—'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* ─ Risk Results ─ */}
                        {(Object.keys(riskResults).length > 0 || item.riskResult) && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Activity size={14} color="#E45A92" />
                                    <Text style={styles.sectionTitle}>Discontinuation Risk</Text>
                                </View>
                                {Object.keys(riskResults).length > 0
                                    ? Object.entries(riskResults).map(([method, result]) => {
                                        const mColor = getRiskColor(result.riskLevel);
                                        const pct = result.probability != null
                                            ? Math.min(result.probability * 100, 100)
                                            : 0;
                                        return (
                                            <View key={method} style={styles.riskRow}>
                                                <View style={styles.riskRowTop}>
                                                    <Text style={styles.riskMethodName}>{method}</Text>
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
                                    })
                                    : item.riskResult
                                        ? (() => {
                                            const mColor = getRiskColor(item.riskResult.riskLevel);
                                            const pct = Math.min((item.riskResult.probability || 0) * 100, 100);
                                            return (
                                                <View style={styles.riskRow}>
                                                    <View style={styles.riskRowTop}>
                                                        <Text style={styles.riskMethodName}>{pd.RECOMMENDED || 'Overall'}</Text>
                                                        <Text style={[styles.riskPct, { color: mColor }]}>{pct.toFixed(0)}%</Text>
                                                    </View>
                                                    <View style={styles.barBg}>
                                                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: mColor }]} />
                                                    </View>
                                                </View>
                                            );
                                        })()
                                        : null
                                }
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
                            {item.obName ? (
                                <View style={styles.obRow}>
                                    <Stethoscope size={11} color="#94A3B8" />
                                    <Text style={styles.obNameText}>{item.obName}</Text>
                                    <Clock size={11} color="#94A3B8" />
                                    <Text style={styles.obNameText}>{formatDate(item.assessedAt || item.createdAt)}</Text>
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
    const [history, setHistory] = useState<ConsultationRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterRisk, setFilterRisk] = useState<'All' | 'Low' | 'Moderate' | 'High'>('All');

    const doctorUid = auth.currentUser?.uid;

    const loadHistory = useCallback(async () => {
        setLoading(true);
        try {
            if (doctorUid) {
                const data = await fetchDoctorHistory(doctorUid);
                setHistory(data.length > 0 ? data : MOCK_HISTORY);
            } else {
                setHistory(MOCK_HISTORY);
            }
        } catch {
            setHistory(MOCK_HISTORY);
        } finally {
            setLoading(false);
        }
    }, [doctorUid]);

    useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

    const filtered = history.filter(item => {
        if (filterRisk === 'All') return true;
        const risk = (item.riskResult?.riskLevel || item.patientData?.RISK_LEVEL || '').toLowerCase();
        return risk === filterRisk.toLowerCase();
    });

    return (
        <View style={styles.container}>
            <ObHeader title="Patient History" subtitle="Completed Consultations" />

            {/* Filter Chips */}
            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                    {(['All', 'Low', 'Moderate', 'High'] as const).map(risk => (
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

            {/* Count */}
            {filtered.length > 0 && (
                <View style={styles.countRow}>
                    <ClipboardList size={13} color="#94A3B8" />
                    <Text style={styles.countText}>
                        {filtered.length} consultation{filtered.length !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.countHint}>· Tap a card to expand details</Text>
                </View>
            )}

            <FlatList
                data={filtered}
                renderItem={({ item }) => <HistoryCard item={item} />}
                keyExtractor={item => item.code}
                contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHistory} tintColor="#E45A92" />}
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
                            <Text style={styles.emptySub}>Completed assessments will appear here.</Text>
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

    // FILTER BAR
    filterBar: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 10 },
    filterContent: { paddingHorizontal: 16, gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 8 },
    chipActive: { backgroundColor: '#E45A92' },
    chipDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    chipText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    chipTextActive: { color: '#FFFFFF' },

    // COUNT
    countRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 5 },
    countText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    countHint: { fontSize: 11, color: '#CBD5E1', fontStyle: 'italic' },

    // LIST
    list: { padding: 14 },

    // ── CARD ─────────────────────────────────────────────────────────────
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 10,
        flexDirection: 'row', overflow: 'hidden',
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    cardExpanded: {
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
        borderColor: '#E2E8F0',
    },
    strip: { width: 5 },
    cardBody: { flex: 1, padding: 14 },

    // Card Header
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    patientName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaChipText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
    headerRight: { alignItems: 'flex-end', gap: 6, marginLeft: 10 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    statusLabel: { fontSize: 9, fontWeight: '800' },
    chevronBtn: { padding: 5, borderRadius: 8 },

    // Collapsed
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    pillText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
    noteSnippet: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
    noteSnippetText: { fontSize: 11, color: '#CBD5E1', flex: 1, fontStyle: 'italic' },

    // ── EXPANDED CONTENT ─────────────────────────────────────────────────
    expandedContent: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14 },

    // Section
    section: { marginBottom: 18 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.6 },

    // Profile grid (2-col table)
    profileGrid: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 9, paddingHorizontal: 12 },
    profileRowAlt: { backgroundColor: '#FAFBFC' },
    profileLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
    profileValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', textAlign: 'right' },
    profileSub: { fontSize: 10, color: '#CBD5E1', textAlign: 'right' },

    // Preference grid (2-col card chips)
    prefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    prefCard: {
        flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', borderRadius: 12,
        padding: 12, borderWidth: 1, borderColor: '#F1F5F9',
    },
    prefLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    prefValue: { fontSize: 13, color: '#1E293B', fontWeight: '700' },

    // Risk bars
    riskRow: { marginBottom: 12 },
    riskRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    riskMethodName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
    riskPct: { fontSize: 13, fontWeight: '800' },
    barBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    riskNote: { fontSize: 11, color: '#94A3B8', marginTop: 3, fontStyle: 'italic' },

    // Notes
    notesBox: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#FEF3C7' },
    notesText: { fontSize: 13, color: '#1E293B', lineHeight: 21 },
    obRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
    obNameText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },

    // EMPTY
    emptyContainer: { padding: 60, alignItems: 'center' },
    emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
    emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});
