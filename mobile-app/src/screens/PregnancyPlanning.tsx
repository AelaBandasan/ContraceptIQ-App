import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { CheckCircle, Circle, Info, Calendar, AlertTriangle, Stethoscope } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

const PregnancyPlanningScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();

    const [checklist, setChecklist] = useState({
        folicAcid: false,
        diet: false,
        weight: false,
        exercise: false,
        noSmoking: false,
        sleep: false,
    });

    const toggleCheck = (item: keyof typeof checklist) => {
        setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
    };

    const renderCheckItem = (key: keyof typeof checklist, label: string) => (
        <TouchableOpacity
            style={styles.checkItem}
            onPress={() => toggleCheck(key)}
            activeOpacity={0.7}
        >
            {checklist[key] ? (
                <CheckCircle size={24} color="#EC4899" fill="#FCE7F3" />
            ) : (
                <Circle size={24} color="#9CA3AF" />
            )}
            <Text style={[styles.checkText, checklist[key] && styles.checkTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.safeArea}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🌸 Explore Pregnancy Planning</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 1. Interactive Checklist Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>1. Prepare Your Body</Text>
                    <View style={styles.checklistContainer}>
                        {renderCheckItem('folicAcid', 'Folic acid (400 mcg)')}
                        {renderCheckItem('diet', 'Balanced diet')}
                        {renderCheckItem('weight', 'Healthy weight')}
                        {renderCheckItem('exercise', 'Exercise')}
                        {renderCheckItem('noSmoking', 'No smoking/alcohol')}
                        {renderCheckItem('sleep', 'Sleep & Stress management')}
                    </View>
                </View>

                {/* 2. Method Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Info size={22} color="#0EA5E9" />
                        <Text style={[styles.cardTitle, { marginLeft: 8, marginTop: 0 }]}>2. Stopping Your Contraceptive</Text>
                    </View>
                    <Text style={styles.cardText}>
                        <Text style={{ fontWeight: 'bold' }}>Focusing on The Pill (Combined):</Text> Note that fertility returns quickly. You can become pregnant almost immediately after stopping the pill.
                    </Text>
                    <View style={styles.noteBox}>
                        <Text style={styles.noteText}>If you are unsure, consult your healthcare provider.</Text>
                    </View>
                </View>

                {/* 3. Medical Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Stethoscope size={22} color="#10B981" />
                        <Text style={[styles.cardTitle, { marginLeft: 8, marginTop: 0 }]}>3. Pre-Pregnancy Checkup</Text>
                    </View>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Schedule a visit</Text>
                        <Text style={styles.bulletItem}>• Review medications</Text>
                        <Text style={styles.bulletItem}>• Update vaccines</Text>
                        <Text style={styles.bulletItem}>• Discuss medical conditions</Text>
                        <Text style={styles.bulletItem}>• Ask about prenatal vitamins</Text>
                    </View>
                </View>

                {/* 4. Education Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Calendar size={22} color="#8B5CF6" />
                        <Text style={[styles.cardTitle, { marginLeft: 8, marginTop: 0 }]}>4. Know Your Fertile Window</Text>
                    </View>
                    <Text style={styles.cardText}>
                        Ovulation typically occurs about 14 days before your next period starts. You have a 6-day fertile window leading up to and including the day of ovulation.
                    </Text>
                </View>

                {/* 5. Warning Card */}
                <View style={[styles.card, styles.warningCard]}>
                    <View style={styles.cardHeaderRow}>
                        <AlertTriangle size={22} color="#EF4444" />
                        <Text style={[styles.cardTitle, { marginLeft: 8, marginTop: 0, color: '#DC2626' }]}>5. When to Seek Medical Advice</Text>
                    </View>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• <Text style={{ fontWeight: 'bold' }}>Under 35:</Text> After 12 months of trying.</Text>
                        <Text style={styles.bulletItem}>• <Text style={{ fontWeight: 'bold' }}>35 and older:</Text> After 6 months of trying.</Text>
                    </View>
                </View>

                {/* Bottom Card */}
                <View style={styles.bottomCard}>
                    <Text style={styles.bottomCardText}>
                        🌼 Most people can become pregnant soon after stopping the pill.
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
};

export default PregnancyPlanningScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F4F6', // light gray background for contrast against white cards
    },
    header: {
        backgroundColor: '#EC4899', // Signature pink
        paddingHorizontal: wp('5%'),
        paddingBottom: hp('2.5%'),
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: hp('2.6%'),
        fontWeight: 'bold',
        color: '#FFF',
    },
    scrollContent: {
        padding: wp('5%'),
        paddingBottom: hp('10%'),
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24, // rounded-2xl
        padding: wp('5%'),
        marginBottom: hp('2%'),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    warningCard: {
        borderWidth: 1.5,
        borderColor: '#FECACA', // light-red accent for the border
        backgroundColor: '#FEF2F2',
    },
    bottomCard: {
        backgroundColor: '#FDF2F8', // soft pink-tinted
        borderRadius: 24,
        padding: wp('5%'),
        marginTop: hp('1%'),
        borderWidth: 1,
        borderColor: '#FCE7F3',
    },
    bottomCardText: {
        color: '#BE185D',
        fontSize: hp('2%'),
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: hp('3%'),
    },
    cardTitle: {
        fontSize: hp('2.2%'),
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: hp('1.5%'),
        marginTop: hp('0.5%'),
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('1%'),
    },
    cardText: {
        fontSize: hp('1.9%'),
        color: '#4B5563',
        lineHeight: hp('2.8%'),
    },
    checklistContainer: {
        marginTop: hp('0.5%'),
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp('1%'),
    },
    checkText: {
        marginLeft: 12,
        fontSize: hp('2%'),
        color: '#374151',
    },
    checkTextActive: {
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    noteBox: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: wp('3%'),
        marginTop: hp('1.5%'),
    },
    noteText: {
        fontSize: hp('1.7%'),
        color: '#4B5563',
        fontStyle: 'italic',
    },
    bulletList: {
        marginTop: hp('0.5%'),
    },
    bulletItem: {
        fontSize: hp('1.9%'),
        color: '#4B5563',
        marginBottom: hp('1%'),
        lineHeight: hp('2.5%'),
    },
});
