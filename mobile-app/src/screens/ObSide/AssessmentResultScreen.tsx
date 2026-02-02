import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    Platform, StatusBar, TextInput, ScrollView, Alert,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ChevronLeft, Check, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { RootStackParamList } from '../../types/navigation';
import { RiskAssessmentResponse } from '../../services/discontinuationRiskService';

type AssessmentResultScreenRouteProp = RouteProp<RootStackParamList, 'AssessmentResultScreen'>;

const AssessmentResultScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<AssessmentResultScreenRouteProp>();

    // Params validation handle
    const { riskResult, patientData } = route.params || {};

    const [notes, setNotes] = useState('');

    if (!riskResult) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 50 }}>No result data found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignSelf: 'center', marginTop: 20 }}>
                    <Text style={{ color: '#E45A92' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const { risk_level, confidence, recommendation } = riskResult;
    const isHighRisk = risk_level === 'HIGH';

    const handleSaveAndFinish = () => {
        // Construct the final patient object
        const newPatient = {
            id: Date.now().toString(),
            name: patientData.NAME || 'New Patient',
            lastVisit: 'Just now',
            status: isHighRisk ? 'Critical' : 'Completed',
            age: patientData.AGE || '-',
            type: 'New Visit',
            details: patientData,
            assessmentResult: riskResult,
            clinicalNotes: notes
        };

        // Log result as requested
        console.log("Saving Patient Record:", JSON.stringify(newPatient, null, 2));

        // Navigate home with new patient
        navigation.navigate('ObDrawer', {
            screen: 'ObHomeScreen',
            params: { newPatient }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#d3347a" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color="#FFF" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Risk Assessment Result</Text>
                <View style={{ width: 28 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Result Card */}
                    <View style={styles.resultCard}>
                        {/* Risk Status Header */}
                        <View style={[
                            styles.riskHeader,
                            { backgroundColor: isHighRisk ? '#FEE2E2' : '#DCFCE7' }
                        ]}>
                            {isHighRisk ? (
                                <AlertTriangle color="#EF4444" size={32} />
                            ) : (
                                <ShieldCheck color="#16A34A" size={32} />
                            )}
                            <Text style={[
                                styles.riskTitle,
                                { color: isHighRisk ? '#991B1B' : '#166534' }
                            ]}>
                                {isHighRisk ? 'HIGH RISK' : 'LOW RISK'}
                            </Text>
                            <Text style={[
                                styles.riskSubtitle,
                                { color: isHighRisk ? '#B91C1C' : '#15803D' }
                            ]}>
                                of discontinuation
                            </Text>
                        </View>

                        {/* Confidence & Recommendation */}
                        <View style={styles.cardBody}>
                            <View style={styles.confidenceRow}>
                                <Text style={styles.label}>AI Confidence Score:</Text>
                                <View style={styles.confidenceBadge}>
                                    <Text style={styles.confidenceText}>{(confidence * 100).toFixed(0)}%</Text>
                                </View>
                            </View>

                            {/* Simple Progress Bar */}
                            <View style={styles.progressBarBg}>
                                <View style={[
                                    styles.progressBarFill,
                                    { width: `${confidence * 100}%`, backgroundColor: isHighRisk ? '#EF4444' : '#16A34A' }
                                ]} />
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.label}>Recommendation:</Text>
                            <Text style={styles.recommendationText}>
                                {recommendation}
                            </Text>
                        </View>
                    </View>

                    {/* Clinical Notes Section */}
                    <Text style={styles.sectionTitle}>Clinical Notes</Text>
                    <View style={styles.notesContainer}>
                        <TextInput
                            style={styles.notesInput}
                            multiline
                            placeholder="Add clinical observations, next steps, or patient concerns..."
                            placeholderTextColor="#94A3B8"
                            value={notes}
                            onChangeText={setNotes}
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.secondaryButtonText}>Edit Inputs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleSaveAndFinish}
                    >
                        <Text style={styles.primaryButtonText}>Save to Record & Finish</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AssessmentResultScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#d3347a',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    // Result Card
    resultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    riskHeader: {
        alignItems: 'center',
        paddingVertical: 25,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    riskTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginTop: 10,
        letterSpacing: 1,
    },
    riskSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 0,
        textTransform: 'uppercase',
    },
    cardBody: {
        padding: 20,
    },
    confidenceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    confidenceBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    confidenceText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 15,
    },
    recommendationText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#334155',
        fontWeight: '500',
    },
    // Notes Section
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 10,
        marginLeft: 4,
    },
    notesContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        height: 150,
        padding: 15,
        marginBottom: 20,
    },
    notesInput: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        lineHeight: 22,
    },
    // Footer
    footer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    primaryButton: {
        flex: 2,
        backgroundColor: '#E45A92',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E45A92',
    },
    secondaryButtonText: {
        color: '#E45A92',
        fontSize: 16,
        fontWeight: '600',
    }
});
