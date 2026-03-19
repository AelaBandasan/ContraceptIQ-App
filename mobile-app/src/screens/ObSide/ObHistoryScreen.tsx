import React, { useState, useCallback, useMemo } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, FlatList,
    RefreshControl, ActivityIndicator, LayoutAnimation, UIManager,
    Platform, Alert,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import {
    ChevronDown, ChevronUp,
    User as UserIcon, Baby, Cigarette, Calendar,
    Activity, Stethoscope, BookOpen,
    Clock, MessageSquare, WifiOff, PlusCircle,
} from 'lucide-react-native';
import { auth } from '../../config/firebaseConfig';
import {
    fetchDoctorAssessments, loadAssessmentsCache,
    deleteAssessments, AssessmentRecord,
} from '../../services/doctorService';
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

const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─── Expandable Card ──────────────────────────────────────────────────────────

interface HistoryCardProps {
    item: AssessmentRecord;
    initialExpanded?: boolean;
    isSelectMode: boolean;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onLongPress: (id: string) => void;
}

const HistoryCard = ({
    item,
    initialExpanded = false,
    isSelectMode,
    isSelected,
    onToggleSelect,
    onLongPress,
}: HistoryCardProps) => {
    const [expanded, setExpanded] = useState(initialExpanded);
    const navigation = useNavigation<any>();

    const pd = item.patientData || {};
    const riskColor = '#E45A92';
    const smokerLabel = pd.SMOKE_CIGAR && pd.SMOKE_CIGAR !== 'Never' && pd.SMOKE_CIGAR !== 'No' ? 'Smoker' : 'Non-Smoker';
    const riskResults = item.riskResults || {};

    const handlePress = () => {
        if (isSelectMode) {
            onToggleSelect(item.id);
        } else {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded(prev => !prev);
        }
    };

    const handleStartFollowUp = () => {
        navigation.navigate('ObAssessment', {
            record: item,
            isFollowUp: true,
        });
    };

    return (
        <View style={[styles.card, expanded && styles.cardExpanded]}>
            {/* Color Strip */}
            <View style={[styles.strip, { backgroundColor: riskColor }]} />

            <View style={styles.cardBody}>
                {/* ── Header Row ── */}
                <View style={styles.cardHeader}>
                    <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={{ flex: 1 }}>
                        <Text style={styles.patientName}>{item.patientName || pd.NAME || 'Unknown Patient'}</Text>
                        <View style={styles.metaChips}>
                            <View style={styles.metaChip}>
                                <Calendar size={15} color="#94A3B8" />
                                <Text style={styles.metaChipText}>{formatDate(item.createdAt)}</Text>
                            </View>
                        )}

                        <View style={{ flex: 1 }}>
                            <Text style={styles.patientName}>{item.patientName || pd.NAME || 'Unknown Patient'}</Text>
                            <View style={styles.metaChips}>
                                <View style={styles.metaChip}>
                                    <Clock size={15} color="#F59E0B" />
                                    <Text style={[styles.metaChipText, { color: '#F59E0B' }]}>Pending sync</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.followUpBtn} onPress={handleStartFollowUp}>
                            <PlusCircle size={15} color="#FFF" />
                            <Text style={styles.followUpBtnText}>Follow-Up</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={[styles.chevronBtn, { backgroundColor: riskColor + '12' }]}>
                            {expanded
                                ? <ChevronUp size={16} color={riskColor} />
                                : <ChevronDown size={16} color={riskColor} />
                            }
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Collapsed Summary Pill Row ── */}
                {!expanded && (
                    <View style={styles.pillRow}>
                        <View style={styles.pill}>
                            <UserIcon size={15} color="#64748B" />
                            <Text style={styles.pillText}>{pd.AGE ? pd.AGE + 'y' : '—'}</Text>
                        </View>
                        <View style={styles.pill}>
                            <Cigarette size={15} color="#64748B" />
                            <Text style={styles.pillText}>{smokerLabel}</Text>
                        </View>
                        <View style={styles.pill}>
                            <Baby size={15} color="#64748B" />
                            <Text style={styles.pillText}>P{pd.PARITY ?? '0'}</Text>
                        </View>
                        {item.mecConditionIds && item.mecConditionIds.length > 0 && (
                            <View style={[styles.pill, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                                <Stethoscope size={15} color="#0369A1" />
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
                        <MessageSquare size={15} color="#94A3B8" />
                        <Text style={styles.noteSnippetText} numberOfLines={1}>{item.clinicalNotes}</Text>
                    </View>
                ) : null}

                {/* ── EXPANDED CONTENT ── */}
                {expanded && (
                    <View style={styles.expandedContent}>

                        {/* ─ Patient Profile ─ */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <UserIcon size={17} color="#E45A92" />
                                <Text style={styles.sectionTitle}>Patient Profile</Text>
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
                    {!expanded && !isSelectMode && item.clinicalNotes ? (
                        <View style={styles.noteSnippet}>
                            <MessageSquare size={11} color="#94A3B8" />
                            <Text style={styles.noteSnippetText} numberOfLines={1}>{item.clinicalNotes}</Text>
                        </View>
                    ) : null}

                    {/* ── EXPANDED CONTENT ── */}
                    {expanded && !isSelectMode && (
                        <View style={styles.expandedContent}>

                            {/* ─ Patient Profile ─ */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Stethoscope size={17} color="#E45A92" />
                                    <Text style={styles.sectionTitle}>Medical Conditions (MEC)</Text>
                                </View>
                                <View style={styles.historyChipList}>
                                    {item.mecConditionIds.map((id) => {
                                        const entry = WHO_MEC_CONDITIONS.find(c => c.id === id);
                                        let label = entry ? entry.condition : id;
                                        if (entry?.subCondition) label += ` — ${entry.subCondition}`;
                                        return (
                                            <View key={id} style={styles.historyChipItem}>
                                                <Text style={styles.historyChipText}>{label}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* ─ OB Clinical Notes ─ */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Activity size={17} color="#E45A92" />
                                    <Text style={styles.sectionTitle}>Discontinuation Risk</Text>
                                </View>
                                {Object.entries(riskResults).map(([method, result]) => {
                                    const mColor = result.riskLevel?.toLowerCase() === 'high' ? '#EF4444' : '#10B981';
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
                                <Stethoscope size={17} color="#E45A92" />
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
        </TouchableOpacity>
    );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const ObHistoryScreen = () => {
    const route = useRoute<any>();
    const scrollToId = route.params?.recordId;

    const [history, setHistory]         = useState<AssessmentRecord[]>([]);
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [isOffline, setIsOffline]     = useState(false);
    const [cachedAt, setCachedAt]       = useState<number | null>(null);
    const [isDeleting, setIsDeleting]   = useState(false);

    // ── Selection state ───────────────────────────────────────────────────────
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());

    const doctorUid = auth.currentUser?.uid;

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadHistory = useCallback(async (isManualRefresh = false) => {
        if (!doctorUid) { setLoading(false); return; }
        if (isManualRefresh) setRefreshing(true);

        const cached = await loadAssessmentsCache(doctorUid);
        if (cached.length > 0) {
            setHistory(cached);
            setCachedAt(Date.now());
            setLoading(false);
        }

        const online = await isOnline();
        setIsOffline(!online);

        if (online) {
            try {
                const fresh = await fetchDoctorAssessments(doctorUid);
                setHistory(fresh);
                setCachedAt(Date.now());
                setIsOffline(false);
            } catch { /* local cache already shown */ }
        }

        setLoading(false);
        setRefreshing(false);
    }, [doctorUid]);

    useFocusEffect(useCallback(() => {
        loadHistory();
        // Exit select mode whenever the screen comes into focus from elsewhere
        setIsSelectMode(false);
        setSelectedIds(new Set());
    }, [loadHistory]));

    // ── Selection helpers ─────────────────────────────────────────────────────

    const enterSelectMode = useCallback((id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSelectMode(true);
        setSelectedIds(new Set([id]));
    }, []);

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const exitSelectMode = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSelectMode(false);
        setSelectedIds(new Set());
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(history.map(r => r.id)));
    }, [history]);

    // ── Delete ────────────────────────────────────────────────────────────────

    const confirmDelete = useCallback(() => {
        const count = selectedIds.size;
        if (count === 0) return;

        Alert.alert(
            'Delete Records',
            `Permanently delete ${count} assessment record${count > 1 ? 's' : ''}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!doctorUid) return;
                        setIsDeleting(true);
                        try {
                            const ids = Array.from(selectedIds);
                            await deleteAssessments(doctorUid, ids);
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setHistory(prev => prev.filter(r => !selectedIds.has(r.id)));
                            exitSelectMode();
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ],
        );
    }, [selectedIds, doctorUid, exitSelectMode]);

    // ── Derived values ────────────────────────────────────────────────────────

    const stats = useMemo(() => ({ total: history.length }), [history]);
    const allSelected = selectedIds.size === history.length && history.length > 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <ObHeader title="Patient History" subtitle="Completed Consultations" />

            <View pointerEvents="none" style={styles.bgDecorWrap}>
                <View style={styles.bgBlobOne} />
                <View style={styles.bgBlobTwo} />
            </View>

            {/* ── Top bar: stats + select/cancel toggle ── */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryCardPrimary}>
                    <Text style={styles.summaryLabel}>Total Cases</Text>
                    <Text style={styles.summaryValue}>{stats.total}</Text>
                </View>

                {history.length > 0 && (
                    isSelectMode ? (
                        <View style={styles.selectActions}>
                            <TouchableOpacity onPress={selectAll} style={styles.selectActionBtn}>
                                <Text style={styles.selectActionText}>
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={exitSelectMode} style={styles.cancelBtn}>
                                <X size={16} color="#64748B" />
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.selectBtn}
                            onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setIsSelectMode(true);
                            }}
                            activeOpacity={0.75}
                        >
                            <Trash2 size={15} color={colors.primary} />
                            <Text style={styles.selectBtnText}>Select</Text>
                        </TouchableOpacity>
                    )
                )}
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

            <FlatList
                data={history}
                renderItem={({ item }) => (
                    <HistoryCard
                        item={item}
                        initialExpanded={item.id === scrollToId}
                        isSelectMode={isSelectMode}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={toggleSelect}
                        onLongPress={enterSelectMode}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.list, { paddingBottom: isSelectMode ? 110 : 100 }]}
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

            {/* ── Floating delete action bar ── */}
            {isSelectMode && (
                <View style={styles.deleteBar}>
                    <Text style={styles.deleteBarCount}>
                        {selectedIds.size} record{selectedIds.size !== 1 ? 's' : ''} selected
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.deleteBarBtn,
                            (selectedIds.size === 0 || isDeleting) && styles.deleteBarBtnDisabled,
                        ]}
                        onPress={confirmDelete}
                        disabled={selectedIds.size === 0 || isDeleting}
                        activeOpacity={0.8}
                    >
                        {isDeleting
                            ? <ActivityIndicator size="small" color="#FFFFFF" />
                            : <Trash2 size={16} color="#FFFFFF" />
                        }
                        <Text style={styles.deleteBarBtnText}>
                            {isDeleting ? 'Deleting…' : 'Delete'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default ObHistoryScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    bgDecorWrap: { ...StyleSheet.absoluteFillObject },
    bgBlobOne: {
        position: 'absolute', top: 110, right: -90,
        width: 210, height: 210, borderRadius: 105,
        backgroundColor: 'rgba(236, 72, 153, 0.08)',
    },
    bgBlobTwo: {
        position: 'absolute', bottom: 100, left: -95,
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(244, 114, 182, 0.07)',
    },

    // ── Top bar ───────────────────────────────────────────────────────────────
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
    },
    summaryCardPrimary: {
        alignSelf: 'flex-start',
        minWidth: 120,
        backgroundColor: '#FDF2F8',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F8D6E5',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    summaryLabel: {
        fontSize: 13, color: colors.text.secondary,
        fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3,
    },
    summaryValue: {
        marginTop: 2, fontSize: 22,
        color: colors.text.primary, fontWeight: '800',
    },
    offlineBannerText: { fontSize: 13, color: '#92400E', fontWeight: '500' },

    // Select button (normal mode)
    selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 12,
        backgroundColor: '#FDF2F8',
        borderWidth: 1,
        borderColor: '#F8D6E5',
    },
    selectBtnText: {
        fontSize: 14, fontWeight: '700', color: colors.primary,
    },

    // Select actions (select mode)
    selectActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectActionBtn: {
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
    },
    selectActionText: {
        fontSize: 13, fontWeight: '600', color: '#475569',
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: {
        fontSize: 13, fontWeight: '600', color: '#64748B',
    },

    // ── Offline Banner ────────────────────────────────────────────────────────
    offlineBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#FDE68A',
    },
    offlineBannerText: { fontSize: 12, color: '#92400E', fontWeight: '500' },

    // ── List ──────────────────────────────────────────────────────────────────
    list: { padding: 14 },

    // ── Card ──────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 10,
        flexDirection: 'row', overflow: 'hidden',
        borderWidth: 1, borderColor: '#EEF2F7',
        shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 7, elevation: 1,
    },
    cardExpanded: {
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08,
        shadowRadius: 10, elevation: 4, borderColor: '#E2E8F0',
    },
    cardSelected: {
        borderColor: '#F9A8D4',
        backgroundColor: '#FFF0F6',
        shadowColor: '#D81B60',
        shadowOpacity: 0.08,
    },
    strip: { width: 6 },
    cardBody: { flex: 1, padding: 15 },

    // Card header
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    patientName: { fontSize: 19, fontWeight: '800', color: colors.text.primary, marginBottom: 6 },
    metaChips: { flexDirection: 'row', flexWrap: 'nowrap', gap: 6 },
    metaChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EEF2F7',
        borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6,
    },
    metaChipText: { fontSize: 12.5, color: '#94A3B8', fontWeight: '500' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 10 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, gap: 4 },
    statusLabel: { fontSize: 12.5, fontWeight: '800' },
    chevronBtn: { padding: 5, borderRadius: 8 },
    followUpBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E45A92',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    followUpBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF',
    },

    // Collapsed pills
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    pillText: { fontSize: 12.5, color: '#64748B', fontWeight: '500' },
    noteSnippet: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        marginTop: 10, paddingTop: 8, borderTopWidth: 1,
        borderTopColor: '#F8FAFC', backgroundColor: '#F8FAFC',
        borderRadius: 10, paddingHorizontal: 8, paddingBottom: 8,
    },
    noteSnippetText: {
        fontSize: 12, color: '#94A3B8', flex: 1, fontStyle: 'italic',
    },

    // Expanded content
    expandedContent: {
        marginTop: 14, borderTopWidth: 1,
        borderTopColor: '#F1F5F9', paddingTop: 14,
    },
    section: { marginBottom: 18 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.6 },

    // Profile grid (2-col table)
    profileGrid: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 9, paddingHorizontal: 12 },
    profileRowAlt: { backgroundColor: '#FAFBFC' },
    profileLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
    profileValue: {
        fontSize: 14, color: '#1E293B',
        fontWeight: '600', textAlign: 'right',
    },
    prefLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    prefValue: { fontSize: 13.5, color: '#1E293B', fontWeight: '700' },

    // Chip list (for conditions)
    historyChipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    historyChipItem: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    historyChipText: { fontSize: 13, color: '#334155', fontWeight: '500' },

    // Risk bars
    riskRow: { marginBottom: 12 },
    riskRowTop: {
        flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4,
    },
    riskMethodName: {
        fontSize: 15, fontWeight: '600', color: colors.text.primary,
    },
    riskPct: { fontSize: 13, fontWeight: '800' },
    barBg: {
        height: 6, backgroundColor: '#E2E8F0',
        borderRadius: 4, overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 4 },
    riskNote: { fontSize: 13, color: '#94A3B8', marginTop: 3, fontStyle: 'italic' },
    notesBox: {
        backgroundColor: '#FFFBEB', borderRadius: 12,
        padding: 13, borderWidth: 1, borderColor: '#FEF3C7',
    },
    notesText: { fontSize: 14, color: colors.text.primary, lineHeight: 21 },
    obRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7,
    },
    obNameText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },

    // ── Empty state ───────────────────────────────────────────────────────────
    emptyContainer: { padding: 60, alignItems: 'center' },
    emptyIcon: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#F1F5F9', justifyContent: 'center',
        alignItems: 'center', marginBottom: 16,
    },
    emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
    emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

    // ── Floating delete bar ───────────────────────────────────────────────────
    deleteBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        paddingBottom: Platform.OS === 'ios' ? 28 : 14,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 12,
    },
    deleteBarCount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#334155',
    },
    deleteBarBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#EF4444',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 12,
    },
    deleteBarBtnDisabled: {
        backgroundColor: '#FCA5A5',
    },
    deleteBarBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
