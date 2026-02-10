import React, { useState, useCallback } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, FlatList,
    RefreshControl, Modal, TextInput, Alert, ActivityIndicator,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
    Plus, X, CheckCircle, AlertTriangle,
    ChevronDown, ChevronUp, Palette, Info, ArrowRight,
    Search, Filter, Users, Baby, Cigarette, User as UserIcon,
    PlayCircle, Eye, Calendar, MapPin, Hash, CheckCircle2,
    Activity, ChevronRight, Clipboard, Trash2
} from 'lucide-react-native';
import { auth } from '../../config/firebaseConfig';
import { fetchDoctorQueue, claimGuest, ConsultationRecord } from '../../services/doctorService';
import { calculateMEC } from '../../services/mecService';
import ObHeader from '../../components/ObHeader';

const ObHistoryScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // Core State
    const [queue, setQueue] = useState<ConsultationRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // UI State
    const [filterRisk, setFilterRisk] = useState<'All' | 'Low' | 'Moderate' | 'High'>('All');
    const [sortBy, setSortBy] = useState<'Recent' | 'Oldest' | 'High Risk'>('Recent');
    const [selectedPatient, setSelectedPatient] = useState<ConsultationRecord | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);

    // Mock Data for Demo (Matching Dashboard for consistency)
    const mockData: ConsultationRecord[] = [
        {
            code: "A7X99P",
            patientData: {
                NAME: "Elena Ramos",
                AGE: "28",
                AGE_GROUP: "25–29",
                SMOKING: "No",
                PARITY: "2",
                RISK_LEVEL: "Low",
                STATUS: "completed",
                RECOMMENDED: "Implant",
                REGION: "Metro Manila"
            },
            status: "waiting",
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            expiresIn: 3600
        },
        {
            code: "B2Z11K",
            patientData: {
                NAME: "Maria Clara",
                AGE: "34",
                AGE_GROUP: "30–34",
                SMOKING: "Yes",
                PARITY: "4",
                RISK_LEVEL: "High",
                STATUS: "high risk",
                RECOMMENDED: "None (Referral Required)",
                REGION: "Cebu City"
            },
            status: "waiting",
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            expiresIn: 3600
        },
        {
            code: "C5M44L",
            patientData: {
                NAME: "Liza Soberano",
                AGE: "22",
                AGE_GROUP: "20–24",
                SMOKING: "No",
                PARITY: "0",
                RISK_LEVEL: "Moderate",
                STATUS: "in progress",
                RECOMMENDED: "Pill",
                REGION: "Davao"
            },
            status: "waiting",
            createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
            expiresIn: 3600
        }
    ];

    const doctorUid = auth.currentUser?.uid;

    const loadQueue = useCallback(async () => {
        if (!doctorUid) return;
        setLoading(true);
        try {
            const data = await fetchDoctorQueue(doctorUid);
            setQueue(data.length > 0 ? [...data, ...mockData] : mockData);
        } catch (error) {
            console.error("Fetch Queue Error:", error);
            setQueue(mockData);
        } finally {
            setLoading(false);
        }
    }, [doctorUid]);

    useFocusEffect(
        useCallback(() => {
            loadQueue();
        }, [loadQueue])
    );

    const filteredQueue = queue
        .filter(item => filterRisk === 'All' || item.patientData?.RISK_LEVEL === filterRisk)
        .sort((a, b) => {
            if (sortBy === 'Recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'Oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === 'High Risk') {
                const riskOrder: any = { 'High': 0, 'Moderate': 1, 'Low': 2 };
                return riskOrder[a.patientData?.RISK_LEVEL] - riskOrder[b.patientData?.RISK_LEVEL];
            }
            return 0;
        });

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case 'high': return '#EF4444';
            case 'moderate': return '#F59E0B';
            case 'low': return '#10B981';
            default: return '#64748B';
        }
    };

    const getStatusBadge = (status: string, risk: string) => {
        if (risk === 'High') return { label: 'HIGH RISK', color: '#FEF2F2', textColor: '#EF4444', icon: AlertTriangle };
        if (status === 'completed') return { label: 'COMPLETED', color: '#F0FDF4', textColor: '#10B981', icon: CheckCircle2 };
        return { label: 'IN PROGRESS', color: '#FFFBEB', textColor: '#D97706', icon: Activity };
    };

    const renderCard = ({ item }: { item: ConsultationRecord }) => {
        const riskColor = getRiskColor(item.patientData?.RISK_LEVEL);
        const status = getStatusBadge(item.patientData?.STATUS || 'in progress', item.patientData?.RISK_LEVEL);
        const StatusIcon = status.icon;

        return (
            <TouchableOpacity
                key={item.code}
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
                            <Text style={styles.patientName}>{item.patientData?.NAME || "Guest Patient"}</Text>
                            <Text style={styles.patientSub}>
                                Code: {item.code} • {new Date(item.createdAt).toLocaleDateString()}
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
                            <Text style={styles.summaryText}>{item.patientData?.AGE_GROUP || 'N/A'}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Cigarette size={14} color="#64748B" />
                            <Text style={styles.summaryText}>{item.patientData?.SMOKING === 'Yes' ? 'Smoker' : 'Non-Smoker'}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Baby size={14} color="#64748B" />
                            <Text style={styles.summaryText}>{item.patientData?.PARITY ? `Parity: ${item.patientData.PARITY}` : 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.rowBetween}>
                        <View style={styles.recBox}>
                            <Text style={styles.recTitle}>Top Recommended:</Text>
                            <View style={styles.row}>
                                <Text style={styles.recValue}>{item.patientData?.RECOMMENDED || 'None'}</Text>
                                <View style={[styles.riskDotMini, { backgroundColor: riskColor }]} />
                            </View>
                        </View>
                        <View style={styles.cardActions}>
                            {item.patientData?.STATUS !== 'completed' && (
                                <TouchableOpacity
                                    style={[styles.miniActionBtn, { backgroundColor: '#F1F5F9' }]}
                                    onPress={() => navigation.navigate('ObAssessment', { consultationId: item.code })}
                                >
                                    <PlayCircle size={16} color="#475569" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.miniActionBtn, { backgroundColor: riskColor + '15' }]}
                                onPress={() => navigation.navigate('ObAssessment', { consultationId: item.code })}
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
                title="Recent Assessments"
                subtitle="Patient History & Records"
            />

            <View style={styles.filterSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterScrollContent}
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
            </View>

            <FlatList
                data={filteredQueue}
                renderItem={renderCard}
                keyExtractor={(item) => item.code}
                contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadQueue} tintColor="#E45A92" />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Clipboard size={32} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>No assessments found</Text>
                        <Text style={styles.emptySub}>Adjust your filters or start a new assessment.</Text>
                    </View>
                }
            />

            {/* Preview Modal (Ported from Dashboard) */}
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
                                    <Text style={styles.sheetTitle}>{selectedPatient.patientData?.NAME}</Text>
                                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(selectedPatient.patientData?.RISK_LEVEL) }]}>
                                        <Text style={styles.riskBadgeText}>{selectedPatient.patientData?.RISK_LEVEL} Risk</Text>
                                    </View>
                                </View>

                                <View style={styles.summaryRow}>
                                    <MapPin size={14} color="#94A3B8" />
                                    <Text style={styles.summarySub}>{selectedPatient.patientData?.REGION}</Text>
                                    <View style={styles.dividerDot} />
                                    <Calendar size={14} color="#94A3B8" />
                                    <Text style={styles.summarySub}>{new Date(selectedPatient.createdAt).toLocaleDateString()}</Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailHeading}>Risk Summary</Text>
                                    <Text style={styles.detailBody}>
                                        The overall risk level is {selectedPatient.patientData?.RISK_LEVEL}.
                                        {selectedPatient.patientData?.RISK_LEVEL === 'High' ? ' Immediate referral advised.' : ' Standard contraceptive protocols can be considered.'}
                                    </Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailHeading}>Top Recommended Method</Text>
                                    <View style={styles.recChipBig}>
                                        <CheckCircle size={20} color="#10B981" />
                                        <Text style={styles.recChipText}>{selectedPatient.patientData?.RECOMMENDED}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.fullResultsBtn}
                                    onPress={() => {
                                        setPreviewVisible(false);
                                        if (selectedPatient) {
                                            const ageValue = parseInt(selectedPatient.patientData?.AGE || '25');
                                            const smokingStatus = selectedPatient.patientData?.SMOKING === 'Yes' ? 'current_daily' : 'never';
                                            const mecResults = calculateMEC({ age: ageValue, smokingStatus });

                                            navigation.navigate('ViewRecommendation', {
                                                ageLabel: selectedPatient.patientData?.AGE_GROUP,
                                                ageValue: ageValue,
                                                prefs: selectedPatient.patientData?.prefs || [],
                                                mecResults
                                            });
                                        }
                                    }}
                                >
                                    <Text style={styles.fullResultsBtnText}>Open Full Results</Text>
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

export default ObHistoryScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    filterSection: { paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    filterScroll: { paddingHorizontal: 20 },
    filterScrollContent: { paddingRight: 40 },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 10 },
    filterChipActive: { backgroundColor: '#E45A92' },
    filterText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    filterTextActive: { color: '#FFFFFF' },
    smallDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    listContent: { padding: 20 },
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
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    row: { flexDirection: 'row', alignItems: 'center' },
    summaryGrid: { flexDirection: 'row', marginVertical: 12, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    summaryText: { fontSize: 11, color: '#64748B', fontWeight: '500', marginLeft: 4 },
    recBox: { flex: 1 },
    recTitle: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
    recValue: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
    riskDotMini: { width: 6, height: 6, borderRadius: 3, marginLeft: 6 },
    cardActions: { flexDirection: 'row' },
    miniActionBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    emptyContainer: { padding: 40, alignItems: 'center', marginTop: 100 },
    emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
    emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
    // Modal / Bottom Sheet
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
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
});
