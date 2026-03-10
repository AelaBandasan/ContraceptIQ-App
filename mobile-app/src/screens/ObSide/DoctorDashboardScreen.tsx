import React, { useState, useCallback } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, FlatList,
    RefreshControl, ScrollView, useWindowDimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
    Plus, Clock, AlertTriangle,
    ChevronDown, ChevronUp, Palette, Info, Book,
    Baby, Cigarette, User as UserIcon,
    Eye, CheckCircle2,
    ChevronRight, Clipboard, HelpCircle
} from 'lucide-react-native';
import { auth } from '../../config/firebaseConfig';
import { loadAssessmentsCache, flushSyncQueue, AssessmentRecord } from '../../services/doctorService';
import ObHeader from '../../components/ObHeader';
import { colors, shadows } from '../../theme';
import Animated, { FadeInDown, FadeOut, Layout } from 'react-native-reanimated';

/**
 * Redesigned Doctor Dashboard
 */
const DoctorDashboardScreen = ({ route }: any) => {
    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();
    const isCompact = width < 390;
    const isTablet = width >= 900;
    const horizontalPadding = isCompact ? 14 : isTablet ? 26 : 20;
    const actionCardWidth = isCompact ? '100%' : isTablet ? '31.5%' : '48%';

    // Core State
    const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // UI State
    const [mecExpanded, setMecExpanded] = useState(false);
    const [filterRisk, setFilterRisk] = useState<'All' | 'Low' | 'High'>('All');

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
        flushSyncQueue(doctorUid).catch(() => { });
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
        return { label: 'LOW RISK', color: '#F0FDF4', textColor: '#10B981', icon: CheckCircle2 };
    };

    const renderCard = (item: AssessmentRecord) => {
        const risk = getOverallRisk(item);
        const riskColor = getRiskColor(risk);
        const status = getStatusBadge(item);
        const StatusIcon = status.icon;

        const smoker = item.patientData?.SMOKE_CIGAR && item.patientData.SMOKE_CIGAR !== 'Never' && item.patientData.SMOKE_CIGAR !== 'No';
        const topMethod = Object.keys(item.riskResults || {})[0] || '—';

        return (
            <Animated.View key={item.id} entering={FadeInDown.duration(320)} layout={Layout.springify()}>
                <TouchableOpacity
                    style={styles.assessmentCard}
                    onPress={() => {
                        navigation.navigate('ObHistory', { recordId: item.id });
                    }}
                    activeOpacity={0.88}
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
                                <UserIcon size={15} color="#64748B" />
                                <Text style={styles.summaryText}>{item.patientData?.AGE ? `Age ${item.patientData.AGE}` : '—'}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Cigarette size={15} color="#64748B" />
                                <Text style={styles.summaryText}>{smoker ? 'Smoker' : 'Non-Smoker'}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Baby size={15} color="#64748B" />
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
                                    onPress={() => navigation.navigate('ObHistory', { recordId: item.id })}
                                >
                                    <Eye size={18} color={riskColor} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
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
                    <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}> 
                        <Animated.View entering={FadeInDown.delay(80).duration(360)} style={styles.section}>
                            <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>Quick Actions</Text>
                            <View style={styles.actionGrid}>
                                <TouchableOpacity
                                    style={[styles.actionCard, styles.actionCardSuccess, { width: actionCardWidth }, isCompact && styles.actionCardCompact]}
                                    onPress={() => navigation.navigate('ObAssessment', { isDoctorAssessment: true })}
                                    activeOpacity={0.88}
                                >
                                    <View style={[styles.iconBox, styles.iconBoxSuccess]}>
                                        <Plus color="#059669" size={24} />
                                    </View>
                                    <View>
                                        <Text style={styles.actionTitle}>New Assessment</Text>
                                        <Text style={styles.actionSub}>Start a new evaluation</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionCard, styles.actionCardInfo, { width: actionCardWidth }, isCompact && styles.actionCardCompact]}
                                    onPress={() => navigation.navigate('ObMethods', { isDoctorAssessment: true })}
                                    activeOpacity={0.88}
                                >
                                    <View style={[styles.iconBox, styles.iconBoxInfo]}>
                                        <Book color="#4F46E5" size={24} />
                                    </View>
                                    <View>
                                        <Text style={styles.actionTitle}>Methods Guide</Text>
                                        <Text style={styles.actionSub}>Browse contraceptives</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionCard, styles.actionCardWarning, { width: actionCardWidth }, isCompact && styles.actionCardCompact]}
                                    onPress={() => navigation.navigate('ObEducation')}
                                    activeOpacity={0.88}
                                >
                                    <View style={[styles.iconBox, styles.iconBoxWarning]}>
                                        <HelpCircle color="#CA8A04" size={24} />
                                    </View>
                                    <View>
                                        <Text style={styles.actionTitle}>Patient FAQs</Text>
                                        <Text style={styles.actionSub}>Education resources</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionCard, styles.actionCardDanger, { width: actionCardWidth }, isCompact && styles.actionCardCompact]}
                                    onPress={() => navigation.navigate('ObEmergency')}
                                    activeOpacity={0.88}
                                >
                                    <View style={[styles.iconBox, styles.iconBoxDanger]}>
                                        <AlertTriangle color="#DC2626" size={24} />
                                    </View>
                                    <View>
                                        <Text style={styles.actionTitle}>Emergency</Text>
                                        <Text style={styles.actionSub}>Action guidelines</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(140).duration(360)} style={styles.section}>
                            <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>Activity Summary</Text>

                            <View style={[styles.activityCard, isCompact && styles.activityCardCompact]}>
                                <View style={styles.activityLeft}>
                                    <Text style={styles.activityBigNum}>{stats.total}</Text>
                                    <Text style={styles.activityBigLabel}>Total Records</Text>
                                    <View style={styles.activityPendingBadge}>
                                        <Clock size={16} color={colors.primary} />
                                        <Text style={styles.activityPendingText}>
                                            {stats.today} today
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.activityDivider, isCompact && styles.activityDividerCompact]} />

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
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200).duration(360)} style={[styles.section, styles.recentSection]}>
                            <View style={styles.rowBetween}>
                                <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>Recent Assessments</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('ObHistory')}>
                                    <View style={styles.row}>
                                        <Text style={styles.viewAllText}>View History</Text>
                                        <ChevronRight size={15} color={colors.primary} />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.filterScroll}
                            >
                                {['All', 'Low', 'High'].map((risk) => (
                                    <TouchableOpacity
                                        key={risk}
                                        style={[
                                            styles.filterChip,
                                            filterRisk === risk && styles.filterChipActive
                                        ]}
                                        onPress={() => setFilterRisk(risk as 'All' | 'Low' | 'High')}
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
                                            <Clipboard size={36} color="#CBD5E1" />
                                        </View>
                                        <Text style={styles.emptyTitle}>No assessments yet</Text>
                                        <Text style={styles.emptySub}>Start a new patient assessment to see results here.</Text>
                                        <TouchableOpacity
                                            style={styles.emptyBtn}
                                            onPress={() => navigation.navigate('ObAssessment', { isDoctorAssessment: true })}
                                        >
                                            <Plus size={20} color="#FFF" />
                                            <Text style={styles.emptyBtnText}>Start New Assessment</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(240).duration(360)}>
                            <TouchableOpacity
                                style={[styles.mecCard, mecExpanded && styles.mecCardExpanded]}
                                onPress={() => setMecExpanded(!mecExpanded)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.rowBetweenNoMargin}>
                                    <View style={styles.mecHeaderLeft}>
                                        <View style={styles.mecIconWrap}>
                                            <Palette size={20} color={colors.primary} />
                                        </View>
                                        <View>
                                            <Text style={styles.mecTitle}>MEC Color Guide</Text>
                                            <Text style={styles.mecSubtitle}>WHO quick category legend</Text>
                                        </View>
                                    </View>
                                    <View style={styles.mecTogglePill}>
                                        {mecExpanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                                    </View>
                                </View>

                                {mecExpanded && (
                                    <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOut.duration(180)} layout={Layout.springify()} style={styles.mecContent}>
                                        <View style={styles.mecItem}>
                                            <View style={[styles.colorDot, { backgroundColor: '#10B981' }]} />
                                            <Text style={styles.mecLabel}>Green — Safe to Use</Text>
                                        </View>
                                        <View style={styles.mecItem}>
                                            <View style={[styles.colorDot, { backgroundColor: '#F59E0B' }]} />
                                            <Text style={styles.mecLabel}>Yellow — Generally Safe</Text>
                                        </View>
                                        <View style={styles.mecItem}>
                                            <View style={[styles.colorDot, { backgroundColor: '#FB923C' }]} />
                                            <Text style={styles.mecLabel}>Orange — Use With Caution</Text>
                                        </View>
                                        <View style={styles.mecItem}>
                                            <View style={[styles.colorDot, { backgroundColor: '#EF4444' }]} />
                                            <Text style={styles.mecLabel}>Red — Not recommended</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.mecFullBtn}
                                            onPress={() => navigation.navigate('ObMecGuide')}
                                        >
                                            <Info size={16} color="#FFF" />
                                            <Text style={styles.mecFullBtnText}>View Full MEC Guide</Text>
                                        </TouchableOpacity>
                                    </Animated.View>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAssessments} tintColor={colors.primary} />}
            />
        </View>
    );
};

export default DoctorDashboardScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.secondary },
    content: { paddingTop: 20, paddingBottom: 10 },
    section: { marginBottom: 24 },
    recentSection: { marginBottom: 8 },
    sectionTitle: { fontSize: 21, fontWeight: 'bold', color: colors.text.primary, marginBottom: 13 },
    sectionTitleCompact: { fontSize: 19 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowBetweenNoMargin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    row: { flexDirection: 'row', alignItems: 'center' },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between' },
    actionCard: {
        borderRadius: 20,
        padding: 16,
        minHeight: 160,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...shadows.sm,
    },
    actionCardCompact: {
        minHeight: 132,
    },
    actionCardSuccess: { backgroundColor: '#ECFDF5' },
    actionCardInfo: { backgroundColor: '#EEF2FF' },
    actionCardWarning: { backgroundColor: '#FEF9C3' },
    actionCardDanger: { backgroundColor: '#FEE2E2' },
    iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    iconBoxSuccess: { backgroundColor: '#D1FAE5' },
    iconBoxInfo: { backgroundColor: '#DBEAFE' },
    iconBoxWarning: { backgroundColor: '#FEF3C7' },
    iconBoxDanger: { backgroundColor: '#FECACA' },
    actionTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginTop: 12, lineHeight: 20 },
    actionSub: { fontSize: 13.5, color: '#475569', marginTop: 4, fontWeight: '500' },
    viewAllText: { fontSize: 13, fontWeight: '700', color: colors.primary, marginRight: 4 },
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
    cardContent: { flex: 1, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 15 },
    patientName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    patientSub: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    statusLabel: { fontSize: 13, fontWeight: '800', marginLeft: 4, },
    summaryGrid: { flexDirection: 'row', marginVertical: 12, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10 },
    summaryGridCompact: { flexWrap: 'wrap', rowGap: 8 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    summaryItemCompact: { width: '48%', marginRight: 0 },
    summaryText: { fontSize: 14, color: '#64748B', fontWeight: '500', marginLeft: 4 },
    recBox: { flex: 1 },
    recTitle: { fontSize: 13, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
    recValue: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    riskDotMini: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
    cardActions: { flexDirection: 'row' },
    miniActionBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    filterScroll: { marginBottom: 15 },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 10 },
    filterChipActive: { backgroundColor: colors.primary },
    filterText: { fontSize: 13.5, color: '#64748B', fontWeight: '600' },
    filterTextActive: { color: '#FFFFFF' },
    smallDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    emptyContainer: { padding: 40, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: '#F1F5F9', borderStyle: 'dashed' },
    emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 19, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
    emptySub: { fontSize: 15, color: '#94A3B8', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
    emptyBtnText: { fontSize: 17, color: '#FFFFFF', fontWeight: 'bold', marginLeft: 8 },
    mecCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 2, ...shadows.sm },
    mecCardExpanded: { borderColor: '#F8D6E5', backgroundColor: '#FFF9FC' },
    mecHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    mecIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFE4F1', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    mecTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    mecSubtitle: { fontSize: 13, color: '#64748B', marginTop: 1, fontWeight: '500' },
    mecTogglePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#E2E8F0' },
    mecToggleText: { fontSize: 12, color: '#64748B', fontWeight: '700', marginRight: 4 },
    mecPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
    mecPreviewItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
    mecPreviewDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    mecPreviewText: { fontSize: 12, color: '#475569', fontWeight: '600' },
    mecContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    mecItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    mecLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
    mecFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, padding: 12, borderRadius: 12, marginTop: 12 },
    mecFullBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    // Activity Summary
    activityCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF7FB',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F8D6E5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    activityCardCompact: {
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    activityLeft: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    activityBigNum: { fontSize: 42, fontWeight: '800', color: '#1E293B', lineHeight: 46 },
    activityBigLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
    activityPendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFE4F1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
    activityPendingText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
    activityDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 18 },
    activityDividerCompact: { width: '100%', height: 1, marginHorizontal: 0, marginVertical: 14 },
    activityRight: { flex: 2, justifyContent: 'center' },
    // Queue stat rows
    queueStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    queueStatDot: { width: 8, height: 8, borderRadius: 4 },
    queueStatLabel: { flex: 1, fontSize: 14, color: '#64748B', fontWeight: '500' },
    queueStatValue: { fontSize: 14, fontWeight: '800' },
});
