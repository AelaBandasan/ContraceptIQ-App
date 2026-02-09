import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../theme';

const DUMMY_HISTORY = [
    { id: '1', date: '2025-05-10', patient: 'Sarah J.', result: 'Copper IUD Recommended' },
    { id: '2', date: '2025-05-09', patient: 'Emily R.', result: 'COC Prescribed' },
    { id: '3', date: '2025-05-08', patient: 'Jessica M.', result: 'Implant Inserted' },
];

const ObHistoryScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Patient Sessions / History</Text>
            </View>
            <FlatList
                data={DUMMY_HISTORY}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.date}>{item.date}</Text>
                        <Text style={styles.patient}>{item.patient}</Text>
                        <Text style={styles.result}>{item.result}</Text>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

export default ObHistoryScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    listContent: { padding: 20 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    date: { fontSize: 12, color: '#64748B', marginBottom: 4 },
    patient: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
    result: { fontSize: 14, color: colors.primary, marginTop: 4 }
});
