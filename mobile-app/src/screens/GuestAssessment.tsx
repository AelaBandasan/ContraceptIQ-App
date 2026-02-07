import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, TextInput, ScrollView, FlatList, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, ChevronRight } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { UserAssessmentData } from '../services/discontinuationRiskService';
import { ActivityIndicator, Alert } from 'react-native';

// --- PHASE 1 DATA FIELDS (Guest Input) ---
const STEPS = [
    { id: 'NAME', label: "What's your Name?", type: 'text', sub: "Let's get to know you first." },
    // Demographics
    { id: 'AGE', label: "What's your Age?", type: 'wheel', sub: "This helps in personalizing results." },
    { id: 'REGION', label: "Your Region", type: 'select', options: ['NCR', 'CAR', 'Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5', 'Region 6', 'Region 7', 'Region 8', 'Region 9', 'Region 10', 'Region 11', 'Region 12', 'Region 13', 'BARMM'] },
    { id: 'EDUC_LEVEL', label: "Education Level", type: 'select', options: ['No formal education', 'Primary', 'Secondary', 'Senior High', 'College undergraduate', 'College graduate'] },
    { id: 'RELIGION', label: "What is your Religion?", type: 'select', options: ['Catholic', 'Christian', 'Muslim', 'INC', 'Prefer not to say'] },
    { id: 'ETHNICITY', label: "Your Ethnicity", type: 'dropdown', options: ['Tagalog', 'Cebuano', 'Ilocano'] },
    { id: 'MARITAL_STATUS', label: "Marital Status", type: 'select', options: ['Single', 'Married', 'Living with partner', 'Separated', 'Divorced', 'Widowed'] },
    { id: 'RESIDING_WITH_PARTNER', label: "Residing with partner?", type: 'select', options: ['Yes', 'No'] },
    { id: 'HOUSEHOLD_HEAD_SEX', label: "Household Head Sex", type: 'select', options: ['Male', 'Female', 'Shared/Both', 'Others'] },
    { id: 'OCCUPATION', label: "Current Occupation", type: 'select', options: ['Unemployed', 'Student', 'Farmer', 'Others'] },

    // Partner & History
    { id: 'HUSBAND_AGE', label: "Husband's Age", type: 'wheel' },
    { id: 'HUSBAND_EDUC_LEVEL', label: "Husband's Education Level", type: 'select', options: ['No formal education', 'Primary', 'Secondary', 'Senior High', 'College undergraduate', 'College graduate'] },
    { id: 'PARTNER_EDUC', label: "Partner's Education Level", type: 'select', options: ['No formal education', 'Primary', 'Secondary', 'Senior High', 'College undergraduate', 'College graduate'] },
    { id: 'HSBND_DESIRE_FOR_MORE_CHILDREN', label: "Husband's Desire for More Children", type: 'select', options: ['Yes', 'No', 'Not Sure'] },

    { id: 'SMOKE_CIGAR', label: "Smoking Habits", type: 'select', options: ['Never', 'Former smoker', 'Occasional smoker', 'Current daily'] },
    { id: 'PARITY', label: "Number of Births (Parity)", type: 'wheel', range: [0, 5] },
    { id: 'DESIRE_FOR_MORE_CHILDREN', label: "Desire for more children?", type: 'select', options: ['Yes', 'No', 'Not Sure'] },
    { id: 'WANT_LAST_CHILD', label: "Do you want your last child?", type: 'select', options: ['Yes', 'No', 'Not Sure'] },
    { id: 'WANT_LAST_PREGNANCY', label: "Do you want your last pregnancy?", type: 'select', options: ['Yes', 'No', 'Not Sure'] },

    { id: 'LAST_METHOD_DISCONTINUED', label: 'Last Method Discontinued', type: 'select', options: ['Pills', 'Condom', 'Copper IUD', 'Intrauterine Device (IUD)', 'Implant', 'Patch', 'Injectable', 'Withdrawal', 'None'] },
    { id: 'REASON_DISCONTINUED', label: "Reason Discontinued", type: 'select', options: ['Side effects', 'Health concerns', 'Desire to become pregnant', 'None / Not Applicable'] },
];

const GuestAssessment = ({ navigation, route }: any) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const step = STEPS[currentStep];

    const { preFilledData } = (route.params as any) || {};

    useEffect(() => {
        if (preFilledData) {
            setFormData((prev: any) => ({
                ...prev,
                ...preFilledData,
                // Ensure prefs are stored if needed in details
                prefs: preFilledData.prefs
            }));
        }
    }, [preFilledData]);

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Assessment Complete -> Go to Consultation Code Generation
            setLoading(true);
            try {
                const patientData = {
                    details: formData,
                    method_eligibility: {
                        'Pills': parseInt(formData['AGE'] || '25') > 35 && formData['SMOKE_CIGAR'] === 'Current daily' ? 3 : 1,
                        'Implant': 1,
                        'Condom': 1,
                        'Injectable': 1,
                        'Patch': 2,
                        'Copper IUD': 1,
                        'Intrauterine Device (IUD)': 1
                    },
                    mec_recommendations: ['Pills']
                };

                navigation.navigate('ConsultationCodeScreen', { patientData, riskResult: null });
            } catch (error: any) {
                console.error("Guest Assessment Error:", error);
                Alert.alert("Submission Error",
                    "Message: " + (error.message || JSON.stringify(error))
                );
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
        else navigation.goBack();
    };

    const updateVal = (val: string) => {
        setFormData({ ...formData, [step.id]: val });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
                    <Text style={{ color: 'white', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Guest Intake</Text>
                <View style={{ width: 50 }} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressHeader}>
                <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>Question {currentStep + 1} of {STEPS.length}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.questionLabel}>{step.label}</Text>
                <Text style={styles.questionSub}>{step.sub}</Text>

                <View style={styles.inputContainer}>
                    {step.type === 'text' ? (
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type here..."
                            placeholderTextColor="#94A3B8"
                            value={formData[step.id] || ''}
                            onChangeText={updateVal}
                        />
                    ) : step.type === 'wheel' ? (
                        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16 }}>
                            <Picker selectedValue={formData[step.id] || '25'} onValueChange={updateVal}>
                                {Array.from({ length: step.range ? (step.range[1] - step.range[0] + 1) : 50 }, (_, i) => {
                                    const val = (step.range ? step.range[0] : 18) + i;
                                    return <Picker.Item key={val} label={val.toString()} value={val.toString()} />;
                                })}
                            </Picker>
                        </View>
                    ) : step.type === 'select' ? (
                        <FlatList
                            data={step.options}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.optionBtn, formData[step.id] === item && styles.selectedBtn]}
                                    onPress={() => { updateVal(item); }}
                                >
                                    <Text style={[styles.optionText, formData[step.id] === item && styles.selectedText]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <View style={styles.dropdown}>
                            <Picker selectedValue={formData[step.id]} onValueChange={updateVal}>
                                <Picker.Item label="Select..." value="" />
                                {step.options?.map(o => <Picker.Item key={o} label={o} value={o} />)}
                            </Picker>
                        </View>
                    )}
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn} disabled={loading}>
                    <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNext} style={styles.nextBtn} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#000" />
                    ) : (
                        <>
                            <Text style={styles.nextBtnText}>Next</Text>
                            <ChevronRight size={20} color="#000" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default GuestAssessment;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#E45A92',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    progressHeader: {
        padding: 20,
    },
    progressBg: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        marginBottom: 8,
    },
    progressFill: {
        height: 6,
        backgroundColor: '#E45A92',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'right',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    questionLabel: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    questionSub: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 32,
    },
    inputContainer: {
        flex: 1,
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 16,
        fontSize: 18,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    optionBtn: {
        backgroundColor: '#F8FAFC',
        padding: 18,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    selectedBtn: {
        backgroundColor: '#E45A92',
        borderColor: '#E45A92',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475467',
        textAlign: 'center',
    },
    selectedText: {
        color: '#FFF',
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
    },
    footer: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    backBtn: {
        padding: 16,
    },
    backBtnText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '600',
    },
    nextBtn: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: '#E45A92',
    },
    nextBtnText: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
    },
});
