import React, { useState, useCallback } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, FlatList,
    RefreshControl, Modal, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
    Plus, Clock, X, AlertTriangle,
    ChevronDown, ChevronUp, Palette, Info, ArrowRight, Book,
    Baby, Cigarette, User as UserIcon,
    Eye, Calendar, CheckCircle2,
    Activity, ChevronRight, Clipboard, HelpCircle
} from 'lucide-react-native';
import { auth } from '../../config/firebaseConfig';
import { loadAssessmentsCache, flushSyncQueue, AssessmentRecord } from '../../services/doctorService';
import ObHeader from '../../components/ObHeader';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

/**
 * Redesigned Doctor Dashboard
 */
const DoctorDashboardScreen = ({ route }: any) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // Core State
    const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // UI State
    const [mecExpanded, setMecExpanded] = useState(false);
    const [filterRisk, setFilterRisk] = useState<'All' | 'Low' | 'Moderate' | 'High'>('All');
    const [selectedPatient, setSelectedPatient] = useState<AssessmentRecord | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);

    // Computed stats from local assessment cache
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
    const stats = {
        total: assessments.length,
        today: assessments.filter(a => new Date(a.createdAt) >= todayStart).length,
        thisWeek: assessments.filter(a => new Date(a.createdAt) >= weekStart).length,
        critical: assessments.filter(a => a.status === 'critical').length,
    };

    // Dummy Date
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Mock Data for Demo
    const doctorUid = auth.currentUser?.uid;
    const doctorName = route?.params?.doctorName || auth.currentUser?.displayName || "Dr. Maria Santos, OB-GYN";

    const loadAssessments = useCallback(async () => {
        if (!doctorUid) return;
        setLoading(true);
        const data = await loadAssessmentsCache(doctorUid);
        setAssessments(data);
        setLoading(false);
        // Flush any records that failed to sync previously
        flushSyncQueue(doctorUid).catch(() => {});
    }, [doctorUid]);

    useFocusEffect(
        useCallback(() => {
            loadAssessments();
        }, [loadAssessments])
    );

    const getOverallRisk = (item: AssessmentRecord): string => {
        const hasCritical = item.status === 'critical';
        return hasCritical ? 'High' : 'Low';
    };

    const filteredQueue = assessments
        .filter(item => {
            if (filterRisk === 'All') return true;
            return getOverallRisk(item) === filterRisk;
        })
        .slice(0, 10); // show latest 10 on dashboard

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case 'high': return '#EF4444';
            case 'low': return '#10B981';
            default: return '#64748B';
        }
    };

    const getStatusBadge = (item: AssessmentRecord) => {
        if (item.status === 'critical') return { label: 'HIGH RISK', color: '#FEF2F2', textColor: '#EF4444', icon: AlertTriangle };
        return { label: 'COMPLETED', color: '#F0FDF4', textColor: '#10B981', icon: CheckCircle2 };
    };

    const renderCard = (item: AssessmentRecord) => {
        const risk = getOverallRisk(item);
        const riskColor = getRiskColor(risk);
        const status = getStatusBadge(item);
        const StatusIcon = status.icon;

        const smoker = item.patientData?.SMOKE_CIGAR && item.patientData.SMOKE_CIGAR !== 'Never' && item.patientData.SMOKE_CIGAR !== 'No';
        const topMethod = Object.keys(item.riskResults || {})[0] || '—';

        return (
            <TouchableOpacity
                key={item.id}
                style={styles.assessmentCard}
                onPress={() => {
                    setSelectedPatient(item);
                    setPreviewVisible(true);
                }}
            >
                <View style={[styles.mecStrip, { backgroundColor: riskColor }]} />
                <View style={styles.cardContent}>
                    <View style={styles.rowBetween}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.patientName}>{item.patientName || "Patient"}</Text>
                            <Text style={styles.patientSub}>
                                {new Date(item.createdAt).toLocaleDateString()}
                                {item.pendingSync ? ' · Pending sync' : ''}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                            <StatusIcon size={10} color={status.textColor} />
                            <Text style={[styles.statusLabel, { color: status.textColor }]}>{status.label}</Text>
                        </View>
                    </View>

                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <UserIcon size={14} color="#64748B" />
                            <Text style={styles.summaryText}>{item.patientData?.AGE ? `Age ${item.patientData.AGE}` : '—'}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Cigarette size={14} color="#64748B" />
                            <Text style={styles.summaryText}>{smoker ? 'Smoker' : 'Non-Smoker'}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Baby size={14} color="#64748B" />
                            <Text style={styles.summaryText}>{item.patientData?.PARITY != null ? `Parity: ${item.patientData.PARITY}` : '—'}</Text>
                        </View>
                    </View>

                    <View style={styles.rowBetween}>
                        <View style={styles.recBox}>
                            <Text style={styles.recTitle}>Assessed Method:</Text>
                            <View style={styles.row}>
                                <Text style={styles.recValue}>{topMethod}</Text>
                                <View style={[styles.riskDotMini, { backgroundColor: riskColor }]} />
                            </View>
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={[styles.miniActionBtn, { backgroundColor: riskColor + '15' }]}
                                onPress={() => navigation.navigate('ObAssessment', { record: item, isDoctorAssessment: true })}
                            >
                                <Eye size={16} color={riskColor} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ObHeader
                title="Welcome back,"
                subtitle={doctorName}
                date={today}
            />

            <FlatList
                data={[]}
                renderItem={null}
                ListHeaderComponent={
                    <View style={styles.content}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Quick Actions</Text>
                            <View style={styles.actionGrid}>
                                <TouchableOpacity
                                    style={[styles.actionCard, { backgroundColor: '#DCFCE7' }]}
                                    onPress={() => navigation.navigate('ObAssessment', { isDoctorAssessment: true })}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#BCF0DA' }]}>
                                        <Plus color="#059669" size={24} />
                                    </View>
                                    <View>
                                        <Text style={styles.actionTitle}>New Assessment</Text>
                                        <Text style={styles.actionSub}>Start a new evaluation</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionCard, { backgroundColor: '#E0E7FF' }]}
                                    onPress={() => navigation.navigate('ObMethods', { isDoctorAssessment: true })}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                                        <Book color="#4F46E5" size={24} />
                                    </View>
                                    <View>
                                        <Text style={styles.actionTitle}>Methods Guide</Text>
                                        <Text style={styles.actionSub}>Browse contraceptives</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionCard, { backgroundColor: '#FEF08A' }]}
                                    onPress={() => navigation.navigate('ObEducation')}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#FEF9C3' }]}>
                                        <HelpCircle color="#CA8A04" size={24} />
                                    </View>
                                    <View>
                                        <Text style={styles.actionTitle}>Patient FAQs</Text>
                                        <Text style={styles.actionSub}>Education resources</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionCard, { backgroundColor: '#FECACA' }]}
                                    onPress={() => navigation.navigate('ObEmergency')}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                                        <AlertTriangle color="#DC2626" size={24} />
                                    </View>
                                    <View>
                                        <Text style={styles.actionTitle}>Emergency</Text>
                                        <Text style={styles.actionSub}>Action guidelines</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Activity Summary</Text>

                            <View style={styles.activityCard}>
                                <View style={styles.activityLeft}>
                                    <Text style={styles.activityBigNum}>{stats.total}</Text>
                                    <Text style={styles.activityBigLabel}>Total Records</Text>
                                    <View style={styles.activityPendingBadge}>
                                        <Clock size={11} color="#E45A92" />
                                        <Text style={styles.activityPendingText}>
                                            {stats.today} today
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.activityDivider} />

                                <View style={styles.activityRight}>
                                    {[
                                        { label: 'Today', value: stats.today, color: '#10B981' },
                                        { label: 'This week', value: stats.thisWeek, color: '#6366F1' },
                                        { label: 'High risk', value: stats.critical, color: '#EF4444' },
                                    ].map(({ label, value, color }) => (
                                        <View key={label} style={styles.queueStatRow}>
                                            <View style={[styles.queueStatDot, { backgroundColor: color }]} />
                                            <Text style={styles.queueStatLabel}>{label}</Text>
                                            <Text style={[styles.queueStatValue, { color }]}>{value}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.sectionTitle}>Recent Assessments</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('ObHistory')}>
                                    <View style={styles.row}>
                                        <Text style={styles.viewAllText}>View History</Text>
                                        <ChevronRight size={14} color="#E45A92" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.filterScroll}
                            >
                                {['All', 'Low', 'Moderate', 'High'].map((risk) => (
                                    <TouchableOpacity
                                        key={risk}
                                        style={[
                                            styles.filterChip,
                                            filterRisk === risk && styles.filterChipActive
                                        ]}
                                        onPress={() => setFilterRisk(risk as any)}
                                    >
                                        {risk !== 'All' && <View style={[styles.smallDot, { backgroundColor: getRiskColor(risk) }]} />}
                                        <Text style={[styles.filterText, filterRisk === risk && styles.filterTextActive]}>
                                            {risk} Risk
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.recentList}>
                                {filteredQueue.map(item => renderCard(item))}
                                {filteredQueue.length === 0 && (
                                    <View style={styles.emptyContainer}>
                                        <View style={styles.emptyIconCircle}>
                                            <Clipboard size={32} color="#CBD5E1" />
                                        </View>
                                        <Text style={styles.emptyTitle}>No assessments yet</Text>
                                        <Text style={styles.emptySub}>Start a new patient assessment to see results here.</Text>
                                        <TouchableOpacity
                                            style={styles.emptyBtn}
                                            onPress={() => navigation.navigate('ObAssessment', { isDoctorAssessment: true })}
                                        >
                                            <Plus size={18} color="#FFF" />
                                            <Text style={styles.emptyBtnText}>Start New Assessment</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.mecCard}
                            onPress={() => setMecExpanded(!mecExpanded)}
                        >
                            <View style={styles.rowBetweenNoMargin}>
                                <View style={styles.row}>
                                    <Palette size={20} color="#E45A92" />
                                    <Text style={styles.mecTitle}>MEC Color Guide</Text>
                                </View>
                                {mecExpanded ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                            </View>

                            {mecExpanded && (
                                <View style={styles.mecContent}>
                                    <View style={styles.mecItem}>
                                        <View style={[styles.colorDot, { backgroundColor: '#10B981' }]} />
                                        <Text style={styles.mecLabel}>Green — Safe / Recommended</Text>
                                    </View>
                                    <View style={styles.mecItem}>
                                        <View style={[styles.colorDot, { backgroundColor: '#F59E0B' }]} />
                                        <Text style={styles.mecLabel}>Yellow — Use with caution</Text>
                                    </View>
                                    <View style={styles.mecItem}>
                                        <View style={[styles.colorDot, { backgroundColor: '#FB923C' }]} />
                                        <Text style={styles.mecLabel}>Orange — Limited use</Text>
                                    </View>
                                    <View style={styles.mecItem}>
                                        <View style={[styles.colorDot, { backgroundColor: '#EF4444' }]} />
                                        <Text style={styles.mecLabel}>Red — Not recommended</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.mecFullBtn}
                                        onPress={() => navigation.navigate('MecGuide')}
                                    >
                                        <Info size={16} color="#FFF" />
                                        <Text style={styles.mecFullBtnText}>View Full MEC Guide</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAssessments} tintColor="#E45A92" />}
            />

            {/* Preview Modal */}
            <Modal
                transparent={true}
                visible={previewVisible}
                animationType="slide"
                onRequestClose={() => setPreviewVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPreviewVisible(false)}
                >
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.dragHandle} />
                            <TouchableOpacity
                                style={styles.sheetClose}
                                onPress={() => setPreviewVisible(false)}
                            >
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {selectedPatient && (
                            <View style={styles.sheetContent}>
                                <View style={styles.rowBetween}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sheetTitle}>{selectedPatient.patientName || 'Patient'}</Text>
                                        <View style={styles.row}>
                                            <Calendar size={13} color="#94A3B8" />
                                            <Text style={styles.summarySub}>{new Date(selectedPatient.createdAt).toLocaleDateString()}</Text>
                                            {selectedPatient.pendingSync && (
                                                <>
                                                    <View style={styles.dividerDot} />
                                                    <Text style={[styles.summarySub, { color: '#F59E0B' }]}>Pending sync</Text>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.snapshotRow}>
                                    {[
                                        { label: selectedPatient.patientData?.AGE ? `Age ${selectedPatient.patientData.AGE}` : '' },
                                        { label: (selectedPatient.patientData?.SMOKE_CIGAR && selectedPatient.patientData.SMOKE_CIGAR !== 'Never' && selectedPatient.patientData.SMOKE_CIGAR !== 'No') ? 'Smoker' : 'Non-Smoker' },
                                        { label: `Parity: ${selectedPatient.patientData?.PARITY ?? 0}` },
                                        { label: selectedPatient.status === 'critical' ? 'High Risk' : 'Low Risk' },
                                    ].filter(c => c.label).map((chip, i) => (
                                        <View key={i} style={styles.snapChip}>
                                            <Text style={styles.snapChipText}>{chip.label}</Text>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={styles.fullResultsBtn}
                                    onPress={() => {
                                        setPreviewVisible(false);
                                        navigation.navigate('ObAssessment', { record: selectedPatient, isDoctorAssessment: true });
                                    }}
                                >
                                    <Text style={styles.fullResultsBtnText}>View Full Results</Text>
                                    <ArrowRight size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

        </View>
    );
};

export default DoctorDashboardScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowBetweenNoMargin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    row: { flexDirection: 'row', alignItems: 'center' },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    actionCard: { width: '48%', borderRadius: 20, padding: 16, height: 140, justifyContent: 'space-between' },
    iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginTop: 12, lineHeight: 20 },
    actionSub: { fontSize: 11, color: '#475569', marginTop: 4, fontWeight: '500' },
    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginVertical: 4 },
    statLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
    redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginLeft: 4 },
    viewAllText: { fontSize: 13, fontWeight: '700', color: '#E45A92', marginRight: 4 },
    recentList: { marginTop: 12 },
    assessmentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    mecStrip: { width: 6, height: '100%' },
    cardContent: { flex: 1, padding: 16 },
    patientName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    patientSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusLabel: { fontSize: 9, fontWeight: '800', marginLeft: 4 },
    summaryGrid: { flexDirection: 'row', marginVertical: 12, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    summaryText: { fontSize: 11, color: '#64748B', fontWeight: '500', marginLeft: 4 },
    recBox: { flex: 1 },
    recTitle: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
    recValue: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
    riskDotMini: { width: 6, height: 6, borderRadius: 3, marginLeft: 6 },
    cardActions: { flexDirection: 'row' },
    miniActionBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    filterScroll: { marginBottom: 15 },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 10 },
    filterChipActive: { backgroundColor: '#E45A92' },
    filterText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    filterTextActive: { color: '#FFFFFF' },
    smallDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    emptyContainer: { padding: 40, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: '#F1F5F9', borderStyle: 'dashed' },
    emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
    emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E45A92', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
    emptyBtnText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 8 },
    mecCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 24 },
    mecTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginLeft: 10 },
    mecContent: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    mecItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    mecLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
    mecFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B', padding: 12, borderRadius: 12, marginTop: 12 },
    mecFullBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginLeft: 8 },
    bottomSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, position: 'absolute', bottom: 0, left: 0, right: 0, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
    sheetHeader: { alignItems: 'center', paddingVertical: 15 },
    dragHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2 },
    sheetClose: { position: 'absolute', top: 15, right: 20, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 20 },
    sheetContent: { paddingHorizontal: 24 },
    sheetTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
    riskBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    riskBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 20 },
    summarySub: { fontSize: 13, color: '#94A3B8', marginLeft: 4 },
    dividerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1', marginHorizontal: 10 },
    detailSection: { marginBottom: 24 },
    detailHeading: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    detailBody: { fontSize: 15, color: '#475569', lineHeight: 22 },
    recChipBig: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DCFCE7' },
    recChipText: { fontSize: 18, fontWeight: 'bold', color: '#065F46', marginLeft: 12 },
    fullResultsBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B', padding: 18, borderRadius: 16 },
    fullResultsBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginRight: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    modalSub: { fontSize: 14, color: '#64748B', marginVertical: 10 },
    codeInput: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 24, fontWeight: 'bold', textAlign: 'center', letterSpacing: 4, color: '#1E293B', marginBottom: 20 },
    claimBtn: { backgroundColor: '#E45A92', borderRadius: 16, padding: 16, alignItems: 'center' },
    claimBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    emptyText: { color: '#94A3B8', fontSize: 13 },
    // Intake snapshot (preview modal)
    codeChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    codeChipText: { fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 1 },
    snapshotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 20 },
    snapChip: { backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    snapChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
    intakeGrid: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', marginTop: 8 },
    intakeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, paddingHorizontal: 14 },
    intakeLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500', flex: 1 },
    intakeVal: { fontSize: 13, color: '#1E293B', fontWeight: '600', flex: 1, textAlign: 'right' },
    // Activity Summary
    activityCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    activityLeft: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    activityBigNum: { fontSize: 42, fontWeight: '800', color: '#1E293B', lineHeight: 46 },
    activityBigLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
    activityPendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
    activityPendingText: { fontSize: 11, color: '#E45A92', fontWeight: '700' },
    activityDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 18 },
    activityRight: { flex: 2, justifyContent: 'center' },
    activityBreakdownTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },
    riskBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
    riskBarSeg: { height: '100%' },
    riskLegend: { flexDirection: 'row', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    highRiskAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#FECACA' },
    highRiskAlertText: { fontSize: 13, color: '#EF4444', fontWeight: '600', flex: 1 },
    // Queue stat rows
    queueStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    queueStatDot: { width: 8, height: 8, borderRadius: 4 },
    queueStatLabel: { flex: 1, fontSize: 13, color: '#64748B', fontWeight: '500' },
    queueStatValue: { fontSize: 14, fontWeight: '800' },
});
