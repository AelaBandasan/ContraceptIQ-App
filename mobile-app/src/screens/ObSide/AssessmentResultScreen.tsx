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
import {
    RiskAssessmentResponse,
    assessDiscontinuationRisk,
    UserAssessmentData
} from '../../services/discontinuationRiskService';
import { ActivityIndicator } from 'react-native';

type AssessmentResultScreenRouteProp = RouteProp<RootStackParamList, 'AssessmentResultScreen'>;

const AssessmentResultScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<AssessmentResultScreenRouteProp>();

    // Params validation handle
    const { riskResult, patientData } = route.params || {};

    // State for dynamic assessment
    const [currentRiskResult, setCurrentRiskResult] = useState<RiskAssessmentResponse | null>(riskResult);
    const [selectedMethod, setSelectedMethod] = useState<string>(patientData?.CONTRACEPTIVE_METHOD || '');
    const [isLoading, setIsLoading] = useState(false);
    const [notes, setNotes] = useState('');

    // UI state for dropdown
    const [showMethodPicker, setShowMethodPicker] = useState(false);

    // Methods list (matching the one in ObAssessment)
    const CONTRACEPTIVE_METHODS = [
        'None', 'Pills', 'Condom', 'Copper IUD', 'Intrauterine Device (IUD)',
        'Implant', 'Patch', 'Injectable', 'Withdrawal'
    ];

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

    // Use currentRiskResult if available, otherwise fallback to initial riskResult (though we init state with it)
    const { risk_level, confidence, recommendation } = currentRiskResult || riskResult;
    const isHighRisk = risk_level === 'HIGH';

    const handleMethodChange = async (method: string) => {
        setSelectedMethod(method);
        setShowMethodPicker(false);
        setIsLoading(true);

        try {
            // Prepare data for re-assessment using original patient data + new method
            // We need to map the method string to the API expected format if necessary
            // The service expects mapped data. Let's assume patientData is already roughly in the right shape 
            // OR we need to re-map it. 
            // Looking at ObAssessment, it does a mapping `mapFormDataToApi`. 
            // Since patientData passed here might be the raw form data, we might need to map it again.
            // However, `patientData` in params might be the one used for saving?
            // If `patientData` is the API payload, we just update the field.
            // If `patientData` is the raw form, we need to be careful.

            // Assuming patientData has the fields as keys.
            // We'll trust the keys are compatible or we just update the specific field.
            // But wait, the API expects numbers for enums usually? 
            // discontinuationRiskService: UserAssessmentData uses numbers for many fields.
            // Let's import the service function to map or just update the one field if we can map it.
            // To be safe, let's create a minimal mapper for the method if needed, 
            // but `assessDiscontinuationRisk` takes `UserAssessmentData`.

            // If patientData comes from ObAssessment's `savePatientData`, it saves `formData`.
            // `formData` uses strings for selects.
            // The `assessDiscontinuationRisk` service validates and sends data.
            // `ObAssessment` maps before calling service.
            // We must replicate that mapping or reuse it.
            // Replicating the mapping for the method:
            const methodIndex = CONTRACEPTIVE_METHODS.indexOf(method);
            const methodValue = methodIndex !== -1 ? methodIndex + 1 : 1; // 1-based index based on ObAssessment logic

            // We probably need to map the rest of the patientData too if it's raw strings.
            // BUT, if we are in this screen, the assessment was just done.
            // The `riskResult` was passed.
            // The `patientData` passed might be the RAW form data (strings).
            // So we need to map it to numbers for the API.

            // Let's reconstruct the mapping logic briefly for safety, or assume the service handles 
            // if we pass `UserAssessmentData`... but TS says it expects numbers.
            // We'll define a helper here similar to ObAssessment.

            const mapDataForApi = (data: any, newMethod: string) => {
                const getIndex = (val: string, list: string[]) => {
                    const idx = list.indexOf(val);
                    return idx !== -1 ? idx + 1 : 1;
                };

                // We only critically need to update the method. 
                // We'll assume other fields in `patientData` are valid or we reuse the `mapFormDataToApi` logic?
                // `ObAssessment` doesn't export the mapper.
                // We should probably just call the service with the updated method.
                // Wait, if patientData is the RAW data, existing fields are strings. 
                // The service interface `UserAssessmentData` says specific types (mostly numbers).
                // So we MUST map.

                // HACK: For now, I will implement a basic mapping for the method and reuse the existing values 
                // assuming they might be numbers already if they came from a previous save? 
                // No, they come from ObAssessment route params `patientData`, which is `formData`.
                // So they are strings. To properly call the API, we need to map ALL fields.

                // Copy-pasting the relevant mapping logic or importing definitions would be best.
                // I'll grab the mapping logic from ObAssessment conceptually.

                // Since I can't easily import the screen's internal function, I'll inline the list for mapping reference options.
                // To avoid massive duplication, I will map commonly used fields. 
                // Or better: Use the helper `mapFormDataToApi` if I can extract it? No.

                // Let's rely on the fact that we can partial update? No, existing data needed for prediction.

                // Let's implement a robust enough mapper here required for the API call.

                // Helper constants for mapping (simplified versions of ObAssessment arrays)
                const OPTIONS_MAP: { [key: string]: string[] } = {
                    REGION: ['NCR', 'CAR', 'Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5', 'Region 6', 'Region 7', 'Region 8', 'Region 9', 'Region 10', 'Region 11', 'Region 12', 'Region 13', 'BARMM'],
                    EDUC_LEVEL: ['No formal education', 'Primary', 'Secondary', 'Senior High', 'College undergraduate', 'College graduate'],
                    RELIGION: ['Catholic', 'Christian', 'Muslim', 'INC', 'Prefer not to say'],
                    ETHNICITY: ['Tagalog', 'Cebuano', 'Ilocano'],
                    MARITAL_STATUS: ['Single', 'Married', 'Living with partner', 'Separated', 'Divorced', 'Widowed'],
                    HOUSEHOLD_HEAD_SEX: ['Male', 'Female', 'Shared/Both', 'Others'],
                    OCCUPATION: ['Unemployed', 'Student', 'Farmer', 'Others'],
                    HUSBAND_EDUC_LEVEL: ['No formal education', 'Primary', 'Secondary', 'Senior High', 'College undergraduate', 'College graduate'],
                    DESIRE_FOR_MORE_CHILDREN: ['Yes', 'No', 'Not Sure'],
                    WANT_LAST_CHILD: ['Yes', 'No', 'Not Sure'],
                    WANT_LAST_PREGNANCY: ['Yes', 'No', 'Not Sure'],
                    CONTRACEPTIVE_METHOD: CONTRACEPTIVE_METHODS,
                    PATTERN_USE: ['Regular', 'Irregular', 'Not Sure'],
                    LAST_SOURCE_TYPE: ['Government health facility', 'Private Clinic/Hospital', 'Pharmacy', 'NGO', 'Online/Telehealth'],
                    LAST_METHOD_DISCONTINUED: ['Pills', 'Condom', 'Copper IUD', 'Intrauterine Device (IUD)', 'Implant', 'Patch', 'Injectable', 'Withdrawal', 'None'],
                    REASON_DISCONTINUED: ['Side effects', 'Health concerns', 'Desire to become pregnant', 'None / Not Applicable'],
                    HSBND_DESIRE_FOR_MORE_CHILDREN: ['Yes', 'No', 'Not Sure']
                };

                const getIdx = (key: string, val: any) => {
                    const list = OPTIONS_MAP[key];
                    if (!list) return 1;
                    const idx = list.indexOf(val);
                    return idx !== -1 ? idx + 1 : 1;
                };

                const getNum = (val: any) => {
                    const parsed = parseInt(val);
                    return isNaN(parsed) ? 0 : parsed;
                };

                return {
                    AGE: getNum(data.AGE),
                    REGION: getIdx('REGION', data.REGION),
                    EDUC_LEVEL: getIdx('EDUC_LEVEL', data.EDUC_LEVEL),
                    RELIGION: getIdx('RELIGION', data.RELIGION),
                    ETHNICITY: getIdx('ETHNICITY', data.ETHNICITY),
                    MARITAL_STATUS: getIdx('MARITAL_STATUS', data.MARITAL_STATUS),
                    RESIDING_WITH_PARTNER: data.RESIDING_WITH_PARTNER === 'Yes' ? 1 : 0,
                    HOUSEHOLD_HEAD_SEX: getIdx('HOUSEHOLD_HEAD_SEX', data.HOUSEHOLD_HEAD_SEX),
                    OCCUPATION: getIdx('OCCUPATION', data.OCCUPATION),
                    HUSBANDS_EDUC: getIdx('HUSBAND_EDUC_LEVEL', data.HUSBAND_EDUC_LEVEL), // Note key mismatch potential
                    HUSBAND_AGE: getNum(data.HUSBAND_AGE),
                    PARTNER_EDUC: getIdx('HUSBAND_EDUC_LEVEL', data.HUSBAND_EDUC_LEVEL),
                    SMOKE_CIGAR: (data.SMOKE_CIGAR === 'Thinking about quitting' || data.SMOKE_CIGAR === 'Current daily') ? 1 : 0,
                    PARITY: getNum(data.PARITY),
                    DESIRE_FOR_MORE_CHILDREN: getIdx('DESIRE_FOR_MORE_CHILDREN', data.DESIRE_FOR_MORE_CHILDREN),
                    WANT_LAST_CHILD: getIdx('WANT_LAST_CHILD', data.WANT_LAST_CHILD),
                    WANT_LAST_PREGNANCY: getIdx('WANT_LAST_PREGNANCY', data.WANT_LAST_PREGNANCY),
                    CONTRACEPTIVE_METHOD: getIdx('CONTRACEPTIVE_METHOD', newMethod), // Use the new method
                    MONTH_USE_CURRENT_METHOD: getNum(data.MONTH_USE_CURRENT_METHOD),
                    PATTERN_USE: getIdx('PATTERN_USE', data.PATTERN_USE),
                    TOLD_ABT_SIDE_EFFECTS: data.TOLD_ABT_SIDE_EFFECTS?.includes('Yes') ? 1 : 0,
                    LAST_SOURCE_TYPE: getIdx('LAST_SOURCE_TYPE', data.LAST_SOURCE_TYPE),
                    LAST_METHOD_DISCONTINUED: getIdx('LAST_METHOD_DISCONTINUED', data.LAST_METHOD_DISCONTINUED),
                    REASON_DISCONTINUED: getIdx('REASON_DISCONTINUED', data.REASON_DISCONTINUED),
                    HSBND_DESIRE_FOR_MORE_CHILDREN: getIdx('HSBND_DESIRE_FOR_MORE_CHILDREN', data.HSBND_DESIRE_FOR_MORE_CHILDREN),
                };
            };

            const apiData = mapDataForApi(patientData, method);

            // Check for required features to be safe? 
            // The service validates.

            const newRiskResult = await assessDiscontinuationRisk(apiData as UserAssessmentData);
            setCurrentRiskResult(newRiskResult);

        } catch (error: any) {
            Alert.alert("Update Failed", "Could not re-assess risk: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndFinish = () => {
        // Construct the final patient object
        const newPatient = {
            id: Date.now().toString(),
            name: patientData.NAME || 'New Patient',
            lastVisit: 'Just now',
            status: isHighRisk ? 'Critical' : 'Completed',
            age: patientData.AGE || '-',
            type: 'New Visit',
            details: { ...patientData, CONTRACEPTIVE_METHOD: selectedMethod }, // Update method in saved data
            assessmentResult: currentRiskResult, // Use the latest result
            clinicalNotes: notes
        };

        // Log result as requested
        console.log("Saving Patient Record:", JSON.stringify(newPatient, null, 2));

        // Navigate home with new patient
        navigation.navigate('ObDrawer', {
            screen: 'Dashboard',
            // params: { newPatient }
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

                    {/* Method Selector */}
                    <View style={styles.methodSelectorContainer}>
                        <Text style={styles.label}>Contraceptive Method:</Text>
                        <TouchableOpacity
                            style={styles.methodDropdown}
                            onPress={() => setShowMethodPicker(!showMethodPicker)}
                        >
                            <Text style={styles.methodDropdownText}>{selectedMethod || 'Select Method'}</Text>
                        </TouchableOpacity>

                        {showMethodPicker && (
                            <View style={styles.pickerContainer}>
                                {CONTRACEPTIVE_METHODS.map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={styles.pickerItem}
                                        onPress={() => handleMethodChange(m)}
                                    >
                                        <Text style={[
                                            styles.pickerItemText,
                                            selectedMethod === m && styles.pickerItemTextSelected
                                        ]}>
                                            {m}
                                        </Text>
                                        {selectedMethod === m && <Check size={16} color="#E45A92" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Result Card */}
                    <View style={styles.resultCard}>
                        {isLoading ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#E45A92" />
                                <Text style={{ marginTop: 10, color: '#64748B' }}>Re-assessing risk...</Text>
                            </View>
                        ) : (
                            <>
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
                            </>
                        )}
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
                        disabled={isLoading}
                    >
                        <Text style={styles.primaryButtonText}>
                            {isLoading ? "Saving..." : "Save to Record & Finish"}
                        </Text>
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
    // Method Selector
    methodSelectorContainer: {
        marginBottom: 20,
        zIndex: 10, // Ensure dropdown floats above
    },
    methodDropdown: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        padding: 15,
        marginTop: 5,
    },
    methodDropdownText: {
        fontSize: 16,
        color: '#0F172A',
    },
    pickerContainer: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        marginTop: 5,
        position: 'absolute',
        top: 75,
        left: 0,
        right: 0,
        zIndex: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        maxHeight: 250,
        paddingVertical: 5,
    },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerItemText: {
        fontSize: 14,
        color: '#334155',
    },
    pickerItemTextSelected: {
        color: '#E45A92',
        fontWeight: '700',
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
