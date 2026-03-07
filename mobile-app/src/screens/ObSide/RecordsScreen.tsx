import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../config/firebaseConfig';
import { fetchDoctorHistory, ConsultationRecord } from '../../services/doctorService';
import { CheckCircle2, AlertTriangle, FileText } from 'lucide-react-native';

const RecordsScreen = () => {
    const [history, setHistory] = useState<ConsultationRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Doctor ID
    const doctorUid = auth.currentUser?.uid;

    const loadHistory = useCallback(async () => {
        if (!doctorUid) return;
        setLoading(true);
        const data = await fetchDoctorHistory(doctorUid);
        setHistory(data);
        setLoading(false);
    }, [doctorUid]);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [loadHistory])
    );

    const renderItem = ({ item }: { item: ConsultationRecord }) => {
        const isHighRisk = item.riskResult?.riskLevel === 'HIGH' || item.status === 'critical';

        return (
            <View style={styles.card}>
                <View style={styles.row}>
                    <View style={styles.iconBox}>
                        <FileText size={20} color="#64748B" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.name}>{item.patientData?.NAME || "Patient"}</Text>
                        <Text style={styles.date}>
                            Date: {item.assessedAt ? new Date(item.assessedAt).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>

                    {/* Risk Badge */}
                    <View style={[
                        styles.badge,
                        isHighRisk ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#DCFCE7' }
                    ]}>
                        {isHighRisk ? (
                            <AlertTriangle size={14} color="#DC2626" />
                        ) : (
                            <CheckCircle2 size={14} color="#16A34A" />
                        )}
                        <Text style={[
                            styles.badgeText,
                            isHighRisk ? { color: '#B91C1C' } : { color: '#15803D' }
                        ]}>
                            {item.riskResult?.riskLevel || "DONE"}
                        </Text>
                    </View>
                </View>

                {/* Sub Detail */}
                <View style={styles.divider} />
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Method: {item.patientData?.CONTRACEPTIVE_METHOD || "None"}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>History Records</Text>
            </View>

            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.code}
                contentContainerStyle={{ padding: 20 }}
                refreshing={loading}
                onRefresh={loadHistory}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No completed records found.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

export default RecordsScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    iconBox: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center'
    },
    name: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    date: { fontSize: 13, color: '#64748B', marginTop: 2 },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20
    },
    badgeText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    footer: { flexDirection: 'row' },
    footerText: { fontSize: 13, color: '#64748B' },
    empty: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#94A3B8' }
});
