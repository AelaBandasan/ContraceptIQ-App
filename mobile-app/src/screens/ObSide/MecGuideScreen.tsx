import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ObHeader from '../../components/ObHeader';

const MEC_CATEGORIES = [
    { category: '1', color: '#4CAF50', desc: 'No restriction for use.' },
    { category: '2', color: '#FFEB3B', desc: 'Advantages generally outweigh theoretical or proven risks.' },
    { category: '3', color: '#FF9800', desc: 'Theoretical or proven risks usually outweigh the advantages.' },
    { category: '4', color: '#F44336', desc: 'Unacceptable health risk if the contraceptive method is used.' },
];

const MecGuideScreen = () => {
    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ObHeader title="MEC Guide" subtitle="Color Legend" />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.intro}>
                    Medical Eligibility Criteria for Contraceptive Use (MEC) categories:
                </Text>
                {MEC_CATEGORIES.map((item) => (
                    <View key={item.category} style={styles.card}>
                        <View style={[styles.circle, { backgroundColor: item.color }]}>
                            <Text style={styles.catNum}>{item.category}</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.desc}>{item.desc}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

export default MecGuideScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    content: { padding: 20 },
    intro: { fontSize: 14, color: '#64748B', marginBottom: 20 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    circle: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16
    },
    catNum: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    textContainer: { flex: 1 },
    desc: { fontSize: 14, color: '#334155', lineHeight: 20 }
});
