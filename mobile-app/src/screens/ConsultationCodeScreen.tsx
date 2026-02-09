import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Clipboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitPatientIntake, PatientIntakeData } from '../services/discontinuationRiskService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const ConsultationCodeScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { patientData, riskResult } = route.params as { patientData: any, riskResult?: any } || {};

    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState<string | null>(null);
    const [expiresIn, setExpiresIn] = useState<string | null>(null);

    useEffect(() => {
        generateCode();
    }, []);

    const generateCode = async () => {
        console.log("Generating code for patient:", patientData?.NAME);
        if (!patientData) {
            Alert.alert("Error", "No patient data found.");
            return;
        }

        setLoading(true);
        try {
            // Prepare data - ensure it matches PatientIntakeData type
            // Note: In a real scenario, we might need to filter out clinical fields if they exist
            const intakeData: PatientIntakeData = {
                ...patientData,
                // Ensure method_eligibility is present or empty
                method_eligibility: patientData.method_eligibility || {}
            };

            console.log("Submitting intake data...");
            const result = await submitPatientIntake(intakeData);
            console.log("Intake result:", result);

            // Save to Firestore for OB Retrieval
            console.log("Saving to Firestore...");
            await setDoc(doc(db, 'consultations', result.code), {
                code: result.code,
                patientData: {
                    ...intakeData,
                    mec_recommendations: patientData.mec_recommendations || []
                },
                riskResult: riskResult || null,
                createdAt: new Date().toISOString(),
                expiresIn: result.expires_in,
                status: 'waiting' // Initial status
            });
            console.log("Saved to Firestore successfully.");

            setCode(result.code);
            setExpiresIn(result.expires_in);
        } catch (error: any) {
            console.error("Generate Code Error:", error);
            Alert.alert("Submission Failed", error.message || "Could not generate consultation code.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (code) {
            Clipboard.setString(code);
            Alert.alert("Copied", "Code copied to clipboard.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Consultation Code</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Show this code to your doctor to share your health details instantly.
                </Text>

                <View style={styles.card}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#E11D48" />
                    ) : code ? (
                        <>
                            <Text style={styles.codeLabel}>YOUR CODE</Text>
                            <TouchableOpacity style={styles.codeContainer} onPress={copyToClipboard}>
                                <Text style={styles.codeText}>{code}</Text>
                                <Copy size={20} color="#64748B" style={{ marginLeft: 10 }} />
                            </TouchableOpacity>
                            <Text style={styles.expiryText}>Expires: {expiresIn || 'Session'}</Text>

                            <View style={styles.successBadge}>
                                <CheckCircle2 size={16} color="#166534" />
                                <Text style={styles.successText}>Ready for Doctor</Text>
                            </View>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ color: '#64748B' }}>Failed to generate code.</Text>
                            <TouchableOpacity onPress={generateCode} style={styles.retryButton}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Risk Result Section */}
                {riskResult && (
                    <View style={[styles.card, { marginTop: 16, backgroundColor: riskResult.risk_level === 'HIGH' ? '#FEF2F2' : '#F0FDF4' }]}>
                        <Text style={styles.codeLabel}>DISCONTINUATION RISK ASSESSMENT</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons
                                name={riskResult.risk_level === 'HIGH' ? 'alert-circle' : 'checkmark-circle'}
                                size={32}
                                color={riskResult.risk_level === 'HIGH' ? '#EF4444' : '#22C55E'}
                            />
                            <Text style={[
                                styles.riskLevelText,
                                { color: riskResult.risk_level === 'HIGH' ? '#EF4444' : '#166534' }
                            ]}>
                                {riskResult.risk_level} RISK
                            </Text>
                        </View>

                        <Text style={styles.recommendationText}>
                            {riskResult.recommendation}
                        </Text>

                        <Text style={styles.confidenceText}>
                            AI Confidence: {(riskResult.confidence * 100).toFixed(1)}%
                        </Text>
                    </View>
                )}

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>What is this?</Text>
                    <Text style={styles.infoText}>
                        This code allows your doctor to securely retrieve the information you just entered.
                        No account is required.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={() => (navigation as any).navigate('MainDrawer')}
                >
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    description: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 32,
    },
    codeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 12,
    },
    codeText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: 2,
    },
    expiryText: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 20,
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    successText: {
        color: '#166534',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    retryButton: {
        marginTop: 12,
        padding: 8,
    },
    retryButtonText: {
        color: '#E11D48',
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        width: '100%',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#3B82F6',
        lineHeight: 20,
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    doneButton: {
        backgroundColor: '#0F172A',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    riskLevelText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    recommendationText: {
        fontSize: 14,
        color: '#334155',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 20,
    },
    confidenceText: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
    }
});

export default ConsultationCodeScreen;
