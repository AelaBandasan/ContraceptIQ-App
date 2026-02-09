import React, { useState, useCallback } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, FlatList,
    RefreshControl, Modal, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Plus, Clock, X } from 'lucide-react-native';
import { auth } from '../../config/firebaseConfig';
import { claimGuest, fetchDoctorQueue, ConsultationRecord } from '../../services/doctorService';
import ObHeader from '../../components/ObHeader';

/**
 * Doctor Dashboard
 * 1. "New Consultation" Button -> Opens Claim Modal
 * 2. "My Waiting Queue" -> List of waiting patients
 */
const DoctorDashboardScreen = ({ route }: any) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [queue, setQueue] = useState<ConsultationRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [claiming, setClaiming] = useState(false);

    // Get current doctor details
    const doctorUid = auth.currentUser?.uid;
    // We try to get name from route or default to auth
    const doctorName = route?.params?.doctorName || "Dr. " + (auth.currentUser?.email?.split('@')[0] || "OB");

    const loadQueue = useCallback(async () => {
        if (!doctorUid) return;
        setLoading(true);
        const data = await fetchDoctorQueue(doctorUid);
        setQueue(data);
        setLoading(false);
    }, [doctorUid]);

    useFocusEffect(
        useCallback(() => {
            loadQueue();
        }, [loadQueue])
    );

    const handleClaim = async () => {
        if (!inputCode.trim()) {
            Alert.alert("Required", "Please enter the 6-digit code.");
            return;
        }
        if (!doctorUid) {
            Alert.alert("Error", "You are not logged in.");
            return;
        }

        setClaiming(true);
        const { success, data, error } = await claimGuest(inputCode.trim(), doctorUid, doctorName);
        setClaiming(false);

        if (success && data) {
            setModalVisible(false);
            setInputCode('');
            // Navigate to Assessment
            navigation.navigate('ObAssessment', {
                patientData: data.patientData,
                mec_recommendations: data.patientData.mec_recommendations,
                consultationId: data.code,
                doctorName: doctorName,
                isDoctorAssessment: true
            });
        } else {
            if (error === 'already-claimed') {
                Alert.alert("Unavailable", "This patient is already being seen by another doctor.");
            } else if (error === 'invalid-code') {
                Alert.alert("Not Found", "Invalid code. Please check with the patient.");
            } else {
                Alert.alert("Error", "Could not claim consultation.");
            }
        }
    };

    const renderQueueItem = ({ item }: { item: ConsultationRecord }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ObAssessment', {
                patientData: item.patientData,
                mec_recommendations: item.patientData.mec_recommendations,
                consultationId: item.code,
                doctorName: doctorName,
                isDoctorAssessment: true
            })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.badge}>
                    <Clock size={12} color="#D97706" />
                    <Text style={styles.badgeText}>WAITING</Text>
                </View>
                <Text style={styles.timeText}>
                    Code: {item.code}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <View style={[styles.avatar, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={{ fontSize: 18 }}>👤</Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.patientName}>{item.patientData?.NAME || "Guest Patient"}</Text>
                    <Text style={styles.patientSub}>Age: {item.patientData?.AGE || '-'} • Region: {item.patientData?.REGION || '-'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ObHeader title="Welcome back," subtitle={doctorName} />

            {/* Quick Action */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={styles.newBtn}
                    onPress={() => setModalVisible(true)}
                >
                    <View style={styles.iconCircle}>
                        <Plus color="#E45A92" size={24} />
                    </View>
                    <View>
                        <Text style={styles.newBtnTitle}>New Consultation</Text>
                        <Text style={styles.newBtnSub}>Enter patient guest code</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Queue Section */}
            <View style={styles.queueSection}>
                <Text style={styles.sectionTitle}>My Waiting Queue</Text>
                <FlatList
                    data={queue}
                    renderItem={renderQueueItem}
                    keyExtractor={item => item.code}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={loadQueue} tintColor="#E45A92" />}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            {!loading && <Text style={styles.emptyText}>No waiting patients.</Text>}
                        </View>
                    )}
                />
            </View>

            {/* Claim Modal */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Enter Guest Code</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSub}>Ask the patient for their 6-character code.</Text>

                        <TextInput
                            style={styles.codeInput}
                            placeholder="e.g. A7X99P"
                            placeholderTextColor="#CBD5E1"
                            value={inputCode}
                            onChangeText={text => setInputCode(text.toUpperCase())}
                            maxLength={6}
                            autoCapitalize="characters"
                        />

                        <TouchableOpacity
                            style={styles.claimBtn}
                            onPress={handleClaim}
                            disabled={claiming}
                        >
                            {claiming ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.claimBtnText}>Start Consultation</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default DoctorDashboardScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    // Header styles removed as we use ObHeader
    actionContainer: {
        marginTop: -30, // Pull up to overlap slightly with the curved header
        paddingHorizontal: 20,
        zIndex: 10, // Ensure it sits on top.
    },
    newBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#E45A92',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    iconCircle: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15
    },
    newBtnTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    newBtnSub: { fontSize: 14, color: '#64748B' },
    queueSection: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 25,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 15 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
    },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: '#D97706', marginLeft: 4 },
    timeText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    patientName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    patientSub: { fontSize: 13, color: '#64748B' },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#94A3B8' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    modalSub: { fontSize: 14, color: '#64748B', marginVertical: 10 },
    codeInput: {
        backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16,
        fontSize: 24, fontWeight: 'bold', textAlign: 'center', letterSpacing: 4,
        color: '#1E293B', marginBottom: 20
    },
    claimBtn: {
        backgroundColor: '#E45A92', borderRadius: 16, padding: 16,
        alignItems: 'center'
    },
    claimBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
