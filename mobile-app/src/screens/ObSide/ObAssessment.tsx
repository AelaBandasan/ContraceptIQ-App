import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    Dimensions, ScrollView, FlatList, Image, StatusBar, Platform, TextInput, Modal, ActivityIndicator, Alert, SectionList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat,
    withTiming, withSequence
} from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { assessDiscontinuationRisk, UserAssessmentData, RiskAssessmentResponse } from '../../services/discontinuationRiskService';
import { calculateMEC, MECResult, MECInput, MEC_CONDITIONS, getMECColor, getMECLabel, MECCategory } from '../../services/mecService';
import RiskAssessmentCard, { generateKeyFactors } from '../../components/RiskAssessmentCard';
import { AlertTriangle, ChevronDown, CheckCircle2, ClipboardList } from 'lucide-react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import ObHeader from '../../components/ObHeader';

interface PatientIntakeData {
    details?: any;
    method_eligibility?: Record<string, number>;
}

interface MethodSection {
    title: string;
    data: string[];
    category: number;
}

// --- DATA CONFIGURATION ---
const GUEST_STEPS = [
    { id: 'NAME', label: "What's your Name?", type: 'text', sub: "Let's get to know you first." },
    { id: 'AGE', label: "What's your Age?", type: 'wheel', sub: "This helps in personalizing results.", range: [15, 55] },
    { id: 'REGION', label: "Your Region", type: 'select', options: ['NCR', 'CAR', 'Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5', 'Region 6', 'Region 7', 'Region 8', 'Region 9', 'Region 10', 'Region 11', 'Region 12', 'Region 13', 'BARMM'] },
    { id: 'EDUC_LEVEL', label: "Education Level", type: 'select', options: ['No formal education', 'Primary', 'Secondary', 'Senior High', 'College undergraduate', 'College graduate'] },
    { id: 'RELIGION', label: "What is your Religion?", type: 'select', options: ['Catholic', 'Christian', 'Muslim', 'INC', 'Prefer not to say'] },
    { id: 'ETHNICITY', label: "Your Ethnicity", type: 'dropdown', options: ['Tagalog', 'Cebuano', 'Ilocano'] },
    { id: 'MARITAL_STATUS', label: "Marital Status", type: 'select', options: ['Single', 'Married', 'Living with partner', 'Separated', 'Divorced', 'Widowed'] },
    { id: 'RESIDING_WITH_PARTNER', label: "Residing with partner?", type: 'select', options: ['Yes', 'No'] },
    { id: 'HOUSEHOLD_HEAD_SEX', label: "Household Head Sex", type: 'select', options: ['Male', 'Female', 'Shared/Both', 'Others'] },
    { id: 'OCCUPATION', label: "Current Occupation", type: 'select', options: ['Unemployed', 'Student', 'Farmer', 'Others'] },
    { id: 'HUSBAND_AGE', label: "Husband's Age", type: 'wheel' },
    { id: 'HUSBAND_EDUC_LEVEL', label: "Husband's Education Level", type: 'select', options: ['No formal education', 'Primary', 'Secondary', 'Senior High', 'College undergraduate', 'College graduate'] },
    { id: 'SMOKE_CIGAR', label: "Smoking Habits", type: 'select', options: ['Never', 'Former smoker', 'Occasional smoker', 'Current daily'] },
    { id: 'PARITY', label: "Number of Births (Parity)", type: 'wheel', range: [0, 5] },
    { id: 'DESIRE_FOR_MORE_CHILDREN', label: "Desire for more children?", type: 'select', options: ['Yes', 'No', 'Not Sure'] },
    { id: 'WANT_LAST_CHILD', label: "Do you want your last child?", type: 'select', options: ['Yes', 'No', 'Not Sure'] },
    { id: 'WANT_LAST_PREGNANCY', label: "Do you want your last pregnancy?", type: 'select', options: ['Yes', 'No', 'Not Sure'] },
    { id: 'LAST_METHOD_DISCONTINUED', label: 'Last Method Discontinued', type: 'select', options: ['Pills', 'Condom', 'Copper IUD', 'Intrauterine Device (IUD)', 'Implant', 'Patch', 'Injectable', 'Withdrawal', 'None'] },
    { id: 'REASON_DISCONTINUED', label: "Reason Discontinued", type: 'select', options: ['Side effects', 'Health concerns', 'Desire to become pregnant', 'None / Not Applicable'] },
    { id: 'HSBND_DESIRE_FOR_MORE_CHILDREN', label: "Husband's Desire for More Children", type: 'select', options: ['Yes', 'No', 'Not Sure'] },
];

const DOCTOR_STEPS = [
    { id: 'MONTH_USE_CURRENT_METHOD', label: "Month of Use Current Method", type: 'select', options: Array.from({ length: 13 }, (_, i) => i.toString()) },
    { id: 'PATTERN_USE', label: "Pattern of Use", type: 'select', options: ['Regular', 'Irregular', 'Not Sure'] },
    { id: 'TOLD_ABT_SIDE_EFFECTS', label: "Told about Side effects?", type: 'select', options: ['Yes by Health Worker', 'Yes by research/friends', 'No'] },
    { id: 'LAST_SOURCE_TYPE', label: 'Last Source Type', type: 'select', options: ['Government health facility', 'Private Clinic/Hospital', 'Pharmacy', 'NGO', 'Online/Telehealth'] },
];

// Method names mapped to their API index (1-based, matching the old CONTRACEPTIVE_METHOD options order)
const METHOD_NAME_TO_INDEX: Record<string, number> = {
    'Pills': 1,
    'Copper IUD': 2,
    'Intrauterine Device (IUD)': 3,
    'Implant': 4,
    'Patch': 5,
    'Injectable': 6,
};

const STEPS = [...GUEST_STEPS];
const ALL_STEPS = [...GUEST_STEPS, ...DOCTOR_STEPS];

interface FloatingIconProps {
    source: any;
    delay?: number;
    size?: number;
    top: number | string; // Allow percentage strings or numbers
    left: number | string;
}

// --- FLOATING ICON COMPONENT ---
const FloatingIcon = ({ source, delay = 0, size = wp('15%'), top, left }: FloatingIconProps) => {
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withRepeat(withSequence(withTiming(-15, { duration: 2500 + delay }), withTiming(0, { duration: 2500 + delay })), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
    return (
        <Animated.View style={[{
            position: 'absolute', top: top as any, left: left as any,
            shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8
        }, animatedStyle]}>
            <View style={{ backgroundColor: 'white', borderRadius: 100, padding: 10 }}>
                <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
            </View>
        </Animated.View>
    );
};

const ObAssessment = ({ navigation, route }: any) => {
    const hasPatientData = !!(route.params?.patientData || route.params?.consultationId || route.params?.viewOnly);
    const initialScreen = hasPatientData ? 'review' : 'welcome';
    const [screen, setScreen] = useState(initialScreen);
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [assessmentResult, setAssessmentResult] = useState<RiskAssessmentResponse | null>(null);
    const [allMethodResults, setAllMethodResults] = useState<Record<string, RiskAssessmentResponse | null>>({});
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [reviewStep, setReviewStep] = useState(0); // 0: Patient Overview, 1: MEC Check, 2: OB Input, 3: Risk Results
    const [methodEligibility, setMethodEligibility] = useState<Record<string, number>>({});

    const [modalVisible, setModalVisible] = useState(false);
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [activeSelectorStep, setActiveSelectorStep] = useState<any>(null);

    const [mecRecommendations, setMecRecommendations] = useState<string[]>([]);
    const isDoctorEval = route?.params?.isDoctorAssessment || !!route?.params?.consultationId;

    // MEC Screen 2 state
    const [medicalConditions, setMedicalConditions] = useState<Record<string, boolean>>({});
    const [mecResults, setMecResults] = useState<MECResult | null>(null);

    // Load data if view only
    // Load data from params (View Only or Imported)
    // Load data from params or fetch from Firestore
    useEffect(() => {
        const loadConsultationData = async () => {
            setIsLoading(true);
            if (route.params?.patientData) {
                const data = route.params.patientData;
                const initialForm = data.details || data;
                setFormData(initialForm);

                if (data.mec_recommendations) {
                    setMecRecommendations(data.mec_recommendations);
                }
                if (data.method_eligibility) {
                    setMethodEligibility(data.method_eligibility);
                }

                if (screen !== 'review') setScreen('review');
            } else if (route.params?.consultationId) {
                try {
                    const docRef = doc(db, 'consultations', route.params.consultationId);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const data = snap.data() as any;
                        const patientData = data.patientData || {};
                        const initialForm = patientData.details || patientData;
                        setFormData(initialForm);
                        if (patientData.mec_recommendations) {
                            setMecRecommendations(patientData.mec_recommendations);
                        }
                        if (patientData.method_eligibility) {
                            setMethodEligibility(patientData.method_eligibility);
                        }
                    } else {
                        Alert.alert("Error", "Consultation record not found.");
                    }
                } catch (error) {
                    console.error("Fetch Error:", error);
                    Alert.alert("Error", "Failed to load patient data.");
                }
            }

            // Force 'review' mode if we have valid patient context
            if (hasPatientData) {
                setScreen('review');
            }
            setIsLoading(false);
        };

        loadConsultationData();
    }, [route.params]);

    // --- MEC SORTING LOGIC ---
    const getSortedMethods = (): MethodSection[] => {
        // Find which methods the doctor can select
        const allMethods = ALL_STEPS.find(s => s.id === 'CONTRACEPTIVE_METHOD')?.options || [];

        const tier1: string[] = [];
        const tier2: string[] = [];
        const tier3: string[] = [];

        // Map of UI Dropdown Names -> MEC Calculator Keys
        const nameToKey: Record<string, keyof MECResult> = {
            'Pills': 'CHC',
            'Patch': 'CHC',
            'Injectable': 'DMPA',
            'Implant': 'Implant',
            'Copper IUD': 'Cu-IUD',
            'Intrauterine Device (IUD)': 'LNG-IUD',
            'Condom': 'Cu-IUD', // Shouldn't hit this since we removed it, but kept for safety
            'Withdrawal': 'POP' // Shouldn't hit this since we removed it, but kept for safety
        };

        allMethods.forEach(method => {
            // Find the MEC key for this dropdown option
            const mecKey = nameToKey[method];

            // Get category. If we have mecResults from the calculator, use that.
            // Otherwise, fallback to methodEligibility (from db/guest phase) or default to 1.
            let cat = 1;
            if (mecResults && mecKey) {
                cat = mecResults[mecKey] || 1;
            } else if (methodEligibility && Object.keys(methodEligibility).length > 0) {
                // The old DB might store it by UI name, so we check both the UI name and the mapped key
                cat = methodEligibility[method] || methodEligibility[mecKey as string] || 1;
            }

            if (cat === 1) {
                tier1.push(method);
            } else if (cat === 2) {
                tier2.push(method);
            } else if (cat === 3) {
                tier3.push(method);
            }
            // Cat 4 is effectively filtered out by not pushing
        });

        const sections: MethodSection[] = [];
        if (tier1.length > 0) sections.push({ title: 'Tier 1 - Preferred', data: tier1.sort(), category: 1 });
        if (tier2.length > 0) sections.push({ title: 'Tier 2 - Generally Allowed', data: tier2.sort(), category: 2 });
        if (tier3.length > 0) sections.push({ title: 'Tier 3 - Use With Caution', data: tier3.sort(), category: 3 });

        return sections;
    };

    const handleMethodSelect = (method: string) => {
        const sections = getSortedMethods();
        // Find category
        let category = 0;
        for (const sec of sections) {
            if (sec.data.includes(method)) {
                category = sec.category;
                break;
            }
        }

        setSelectorVisible(false);
        updateVal(method, 'CONTRACEPTIVE_METHOD');

        // User can manually re-generate risk using the button
        // if (assessmentResult || reviewStep === 1) {
        //     assessRisk({ 'CONTRACEPTIVE_METHOD': method });
        // }

        if (category === 3) {
            setTimeout(() => {
                Alert.alert(
                    "Note",
                    "This method is MEC Category 3 for this patient.",
                    [{ text: "OK" }]
                );
            }, 500);
        }
    };

    const step = STEPS[currentStep] || STEPS[0];

    const handleNext = () => {
        if (screen === 'review') {
            if (reviewStep < 3) {
                setReviewStep(reviewStep + 1);
            }
            return;
        }

        if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
        else setScreen('review');
    };

    const handleBack = () => {
        if (screen === 'review') {
            if (reviewStep > 0) {
                setReviewStep(reviewStep - 1);
                return;
            } else {
                if (isDoctorEval) navigation.goBack();
                else setScreen('welcome');
                return;
            }
        }

        if (currentStep > 0) setCurrentStep(currentStep - 1);
        else {
            if (isDoctorEval) navigation.goBack();
            else setScreen('welcome');
        }
    };

    const mapFormDataToApi = (data: any): UserAssessmentData => {
        // Helper to get index + 1 (1-based) or default to 1
        const getIndex = (key: string, list: string[] | undefined) => {
            if (!list) return 1;
            const idx = list.indexOf(data[key]);
            return idx !== -1 ? idx + 1 : 1;
        };

        const getNumber = (key: string, def = 0) => {
            const val = parseInt(data[key]);
            return isNaN(val) ? def : val;
        };

        return {
            AGE: getNumber('AGE', 25),
            REGION: getIndex('REGION', ALL_STEPS.find(s => s.id === 'REGION')?.options),
            EDUC_LEVEL: getIndex('EDUC_LEVEL', ALL_STEPS.find(s => s.id === 'EDUC_LEVEL')?.options),
            RELIGION: getIndex('RELIGION', ALL_STEPS.find(s => s.id === 'RELIGION')?.options),
            ETHNICITY: getIndex('ETHNICITY', ALL_STEPS.find(s => s.id === 'ETHNICITY')?.options),
            MARITAL_STATUS: getIndex('MARITAL_STATUS', ALL_STEPS.find(s => s.id === 'MARITAL_STATUS')?.options),
            RESIDING_WITH_PARTNER: data['RESIDING_WITH_PARTNER'] === 'Yes' ? 1 : 0,
            HOUSEHOLD_HEAD_SEX: getIndex('HOUSEHOLD_HEAD_SEX', ALL_STEPS.find(s => s.id === 'HOUSEHOLD_HEAD_SEX')?.options),
            OCCUPATION: getIndex('OCCUPATION', ALL_STEPS.find(s => s.id === 'OCCUPATION')?.options),
            HUSBANDS_EDUC: getIndex('HUSBAND_EDUC_LEVEL', ALL_STEPS.find(s => s.id === 'HUSBAND_EDUC_LEVEL')?.options),
            HUSBAND_AGE: getNumber('HUSBAND_AGE', 30),
            PARTNER_EDUC: getIndex('HUSBAND_EDUC_LEVEL', ALL_STEPS.find(s => s.id === 'HUSBAND_EDUC_LEVEL')?.options), // Fallback if same field used
            SMOKE_CIGAR: (data['SMOKE_CIGAR'] === 'Thinking about quitting' || data['SMOKE_CIGAR'] === 'Current daily') ? 1 : 0,
            PARITY: getNumber('PARITY', 0),
            DESIRE_FOR_MORE_CHILDREN: getIndex('DESIRE_FOR_MORE_CHILDREN', ALL_STEPS.find(s => s.id === 'DESIRE_FOR_MORE_CHILDREN')?.options),
            WANT_LAST_CHILD: getIndex('WANT_LAST_CHILD', ALL_STEPS.find(s => s.id === 'WANT_LAST_CHILD')?.options),
            WANT_LAST_PREGNANCY: getIndex('WANT_LAST_PREGNANCY', ALL_STEPS.find(s => s.id === 'WANT_LAST_PREGNANCY')?.options),
            CONTRACEPTIVE_METHOD: getIndex('CONTRACEPTIVE_METHOD', ALL_STEPS.find(s => s.id === 'CONTRACEPTIVE_METHOD')?.options),
            MONTH_USE_CURRENT_METHOD: getNumber('MONTH_USE_CURRENT_METHOD', 1),
            PATTERN_USE: getIndex('PATTERN_USE', ALL_STEPS.find(s => s.id === 'PATTERN_USE')?.options),
            TOLD_ABT_SIDE_EFFECTS: data['TOLD_ABT_SIDE_EFFECTS']?.includes('Yes') ? 1 : 0,
            LAST_SOURCE_TYPE: getIndex('LAST_SOURCE_TYPE', ALL_STEPS.find(s => s.id === 'LAST_SOURCE_TYPE')?.options),
            LAST_METHOD_DISCONTINUED: getIndex('LAST_METHOD_DISCONTINUED', ALL_STEPS.find(s => s.id === 'LAST_METHOD_DISCONTINUED')?.options),
            REASON_DISCONTINUED: getIndex('REASON_DISCONTINUED', ALL_STEPS.find(s => s.id === 'REASON_DISCONTINUED')?.options),
            HSBND_DESIRE_FOR_MORE_CHILDREN: getIndex('HSBND_DESIRE_FOR_MORE_CHILDREN', ALL_STEPS.find(s => s.id === 'HSBND_DESIRE_FOR_MORE_CHILDREN')?.options),
        };
    };

    const assessRisk = async (overrideData?: any) => {
        setIsLoading(true);
        try {
            // 1. Map Data (use override data if provided, else current formData)
            const dataToAssess = { ...formData, ...overrideData };
            const apiData = mapFormDataToApi(dataToAssess);

            // 2. Call API
            const result = await assessDiscontinuationRisk(apiData);

            // 3. Set Result Inline
            setAssessmentResult(result);

        } catch (error: any) {
            Alert.alert("Assessment Failed", error.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Assess risk for ALL MEC-eligible methods (cat 1-3)
    const assessAllEligibleMethods = async () => {
        setIsLoading(true);
        try {
            // Get eligible methods from MEC results (cat 1-3)
            const eligibleMethods: string[] = [];
            const nameToKey: Record<string, keyof MECResult> = {
                'Pills': 'CHC',
                'Patch': 'CHC',
                'Injectable': 'DMPA',
                'Implant': 'Implant',
                'Copper IUD': 'Cu-IUD',
                'Intrauterine Device (IUD)': 'LNG-IUD',
            };

            // Collect all methods with MEC cat 1-3
            Object.keys(METHOD_NAME_TO_INDEX).forEach(methodName => {
                const mecKey = nameToKey[methodName];
                let cat = 1;
                if (mecResults && mecKey) {
                    cat = mecResults[mecKey] || 1;
                } else if (methodEligibility && Object.keys(methodEligibility).length > 0) {
                    cat = methodEligibility[methodName] || methodEligibility[mecKey as string] || 1;
                }
                if (cat <= 3) {
                    eligibleMethods.push(methodName);
                }
            });

            if (eligibleMethods.length === 0) {
                Alert.alert("No Eligible Methods", "No methods are eligible based on MEC results.");
                setIsLoading(false);
                return;
            }

            // Run risk assessment for each eligible method
            const results: Record<string, RiskAssessmentResponse | null> = {};
            for (const methodName of eligibleMethods) {
                try {
                    const dataToAssess = { ...formData, CONTRACEPTIVE_METHOD: methodName };
                    const apiData = mapFormDataToApi(dataToAssess);
                    const result = await assessDiscontinuationRisk(apiData);
                    results[methodName] = result;
                } catch (error: any) {
                    console.error(`Risk assessment failed for ${methodName}:`, error.message);
                    results[methodName] = null;
                }
            }

            setAllMethodResults(results);
        } catch (error: any) {
            Alert.alert("Assessment Failed", error.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssessSubmit = () => assessRisk();

    const savePatientData = async (status: string) => {
        setIsLoading(true);
        try {
            const consultationId = route.params?.consultationId;

            // Build a summary of risk results for all methods
            const riskSummary: Record<string, any> = {};
            Object.entries(allMethodResults).forEach(([method, result]) => {
                if (result) {
                    riskSummary[method] = {
                        riskLevel: result.risk_level,
                        probability: result.xgb_probability || 0,
                        recommendation: result.recommendation,
                        confidence: result.confidence,
                    };
                }
            });

            // If we have a consultationId (from retrieval), update the Firestore document
            if (consultationId) {
                const currentUser = auth.currentUser;
                const obName = route.params?.doctorName || "Dr. " + (currentUser?.email?.split('@')[0] || "OB");

                await updateDoc(doc(db, 'consultations', consultationId), {
                    // Update Patient & Clinical Data
                    patientData: {
                        ...formData,
                        mec_recommendations: mecRecommendations
                    },
                    // Save multi-method risk results
                    riskResults: riskSummary,
                    // Legacy single result (use first HIGH risk or first result)
                    riskResult: assessmentResult ? {
                        riskLevel: assessmentResult.risk_level,
                        probability: assessmentResult.xgb_probability || 0,
                        recommendation: assessmentResult.recommendation,
                        confidence: assessmentResult.confidence
                    } : null,
                    // Add OB & Metadata
                    obId: currentUser?.uid || "unknown",
                    obName: obName,
                    clinicalNotes: clinicalNotes || "Patient assessment completed.",
                    assessedAt: new Date().toISOString(),
                    status: status.toLowerCase()
                });

                Alert.alert("Success", "Consultation record updated.");
            }

            navigation.navigate('ObMainTabs', {
                screen: 'ObHome',
            });
        } catch (error: any) {
            console.error("Save Error:", error);
            Alert.alert("Save Failed", "Could not update consultation record.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDraft = () => {
        savePatientData('Waiting');
    };

    const handleSaveAndFinish = () => {
        // Final save with multi-method results
        const resultCount = Object.values(allMethodResults).filter(r => r !== null).length;
        if (resultCount === 0) {
            Alert.alert("No Assessment", "Please generate risk assessments first.");
            return;
        }
        // Check if any method has HIGH risk
        const hasHighRisk = Object.values(allMethodResults).some(r => r?.risk_level === 'HIGH');
        savePatientData(hasHighRisk ? 'Critical' : 'Completed');
    };

    const updateVal = (val: string, fieldId?: string) => {
        setFormData({ ...formData, [fieldId || step.id]: val });
    };

    // Toggle a medical condition on/off for MEC Screen 2
    const toggleCondition = (condId: string) => {
        setMedicalConditions(prev => ({ ...prev, [condId]: !prev[condId] }));
        // Clear previous results when conditions change
        setMecResults(null);
    };

    // Run the WHO MEC eligibility check
    const runMecCheck = () => {
        const smokingRaw = formData['SMOKE_CIGAR'] || 'Never';
        const smokingMap: Record<string, MECInput['smokingStatus']> = {
            'Never': 'never',
            'Former smoker': 'former',
            'Occasional smoker': 'occasional',
            'Current daily': 'current_daily',
        };

        const mecInput: MECInput = {
            age: parseInt(formData['AGE']) || 25,
            smokingStatus: smokingMap[smokingRaw] || 'never',
            cigarettesPerDay: smokingRaw === 'Current daily' ? 15 : 0,
            // Spread medical conditions from doctor toggles
            ...medicalConditions,
        };

        const results = calculateMEC(mecInput);
        setMecResults(results);

        // Update methodEligibility for downstream use
        const eligibility: Record<string, number> = {};
        (Object.keys(results) as Array<keyof MECResult>).forEach(key => {
            eligibility[key] = results[key];
        });
        setMethodEligibility(eligibility);

        // Update mecRecommendations (Cat 1 and 2 methods)
        const recommended = (Object.keys(results) as Array<keyof MECResult>)
            .filter(key => results[key] <= 2)
            .map(key => key);
        setMecRecommendations(recommended);
    };

    // --- RENDER HELPERS ---

    // Empty State for Tab Navigation (doctor with no patient selected)
    if (isDoctorEval && !isLoading && !route.params?.patientData && !route.params?.consultationId && !formData?.NAME) {
        return (
            <View style={[styles.container, { backgroundColor: '#F8F9FB' }]}>
                <StatusBar barStyle="light-content" />
                <ObHeader title="Patient Assessment" subtitle="Assess" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    {/* Illustration */}
                    <View style={{
                        width: 96, height: 96, borderRadius: 48,
                        backgroundColor: '#FFF1F5', justifyContent: 'center', alignItems: 'center',
                        marginBottom: 24, borderWidth: 2, borderColor: '#FCE7F3',
                    }}>
                        <ClipboardList size={44} color="#E45A92" />
                    </View>

                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}>
                        No Active Assessment
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 28, paddingHorizontal: 16, lineHeight: 20 }}>
                        Enter a patient's 6-digit code to load their intake data and begin the clinical encounter.
                    </Text>

                    {/* Inline Code Entry */}
                    <View style={{ width: '100%', maxWidth: 320 }}>
                        <TextInput
                            style={{
                                backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0',
                                borderRadius: 14, padding: 16, fontSize: 22, fontWeight: 'bold',
                                textAlign: 'center', letterSpacing: 6, color: '#1E293B',
                            }}
                            placeholder="A 7 X 2 9 P"
                            placeholderTextColor="#CBD5E1"
                            value={clinicalNotes} // Reusing clinicalNotes temporarily as code input
                            onChangeText={(text) => setClinicalNotes(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                            maxLength={6}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#E45A92', borderRadius: 14, padding: 16,
                                alignItems: 'center', marginTop: 12,
                                opacity: (clinicalNotes?.length ?? 0) < 6 ? 0.5 : 1,
                            }}
                            disabled={(clinicalNotes?.length ?? 0) < 6}
                            onPress={async () => {
                                // Navigate to dashboard which handles claiming
                                navigation.navigate('ObHome', { autoClaimCode: clinicalNotes });
                            }}
                        >
                            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>Claim & Start Assessment</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24, width: '100%', maxWidth: 320 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                        <Text style={{ marginHorizontal: 12, fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>OR</Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                    </View>

                    {/* Secondary: Go to Dashboard */}
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row', alignItems: 'center',
                            borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14,
                            paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF',
                        }}
                        onPress={() => navigation.navigate('ObHome')}
                    >
                        <Text style={{ color: '#64748B', fontWeight: '600', fontSize: 14 }}>Select from Dashboard Queue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (screen === 'welcome') {
        return (
            <SafeAreaView style={styles.container}>
                <ObHeader title="New Patient Assessment" subtitle="Intake Form" />

                <View style={styles.content}>
                    <StatusBar barStyle="light-content" />

                    {/* Floating Contraceptives Section */}
                    <View style={styles.animationContainer}>
                        <FloatingIcon
                            source={require('../../../assets/tempLogo.png')}
                            top={hp('22%')} left={wp('38%')} size={wp('23%')}
                        />
                        {/* ... keep other icons ... */}
                        <FloatingIcon
                            source={require('../../../assets/image/copperiud.png')} // IUD
                            top={hp('17%')} left={wp('70%')} delay={0} size={wp('18%')}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/implantt.png')} // Condom/Other
                            top={hp('7%')} left={wp('38%')} delay={0} size={wp('16%')}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/injectables.png')} // Condom/Other
                            top={hp('18%')} left={wp('9%')} delay={300} size={wp('18%')}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/leviud.png')} // Condom/Other
                            top={hp('33%')} left={wp('9%')} delay={100} size={wp('16%')}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/patchh.png')} // Condom/Other
                            top={hp('41%')} left={wp('40%')} delay={200} size={wp('19%')}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/pillss.png')} // Condom/Other
                            top={hp('34%')} left={wp('70%')} delay={40} size={wp('16%')}
                        />
                    </View>

                    {/* Content Card */}
                    <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 40 : 20 }]}>

                        <Text style={styles.brandName}>CONTRACEPTIQ</Text>
                        <Text style={styles.welcomeTitle}>Let's find what's best for you</Text>

                        {/* Bottom Section: Custom Button Bar Layout */}
                        <View style={styles.bottomBarContainer}>
                            <View style={styles.pillContainer}>
                                <TouchableOpacity style={styles.textBtn}>
                                    <Text style={styles.doItLaterText}>Do it later</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.assessmentBtn} onPress={() => setScreen('onboarding')}>
                                    <Text style={styles.assessmentBtnText}>Start Assessment</Text>
                                    <Text style={styles.arrowIcon}> »</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#F8F9FB' }]}>
            <StatusBar barStyle="light-content" />

            {/* Header added to top of progress bar */}
            <ObHeader
                title="Patient Assessment"
                subtitle={formData?.NAME || "New Patient"}
            />

            {screen === 'onboarding' && (
                <View style={styles.progressHeader}>
                    <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} /></View>
                </View>
            )}

            <View style={styles.stepContent}>
                {screen === 'onboarding' ? (
                    <View style={{ flex: 1 }}>
                        {step.type === 'text' ? (
                            <View style={{ width: '100%', alignItems: 'center' }}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#94A3B8"
                                    value={formData[step.id] || ''}
                                    onChangeText={(val) => updateVal(val)}
                                />
                            </View>
                        ) : step.type === 'wheel' ? (
                            <Picker selectedValue={formData[step.id] || '25'} onValueChange={(val) => updateVal(val)}>
                                {Array.from({ length: (step as any).range ? ((step as any).range[1] - (step as any).range[0] + 1) : 50 }, (_, i) => {
                                    const val = ((step as any).range ? (step as any).range[0] : 18) + i;
                                    return <Picker.Item key={val} label={val.toString()} value={val.toString()} />;
                                })}
                            </Picker>
                        ) : step.type === 'select' ? (
                            <FlatList data={step.options} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.optionBtn, formData[step.id] === item && styles.selectedBtn]} onPress={() => updateVal(item)}>
                                    <Text style={[styles.optionText, formData[step.id] === item && styles.selectedText]}>{item}</Text>
                                </TouchableOpacity>
                            )} />
                        ) : (
                            <View style={styles.dropdown}><Picker selectedValue={formData[step.id]} onValueChange={(val) => updateVal(val)}>{step.options?.map(o => <Picker.Item key={o} label={o} value={o} />)}</Picker></View>
                        )}
                    </View>
                ) : (



                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* ===== SCREEN 1: Patient Overview (Read-Only) ===== */}
                        {reviewStep === 0 && (
                            <>
                                {mecRecommendations.length > 0 && (
                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={[styles.sectionTitle, { color: '#E45A92' }]}>Pre-Computed MEC</Text>
                                        <View style={[styles.cardSection, { backgroundColor: '#FFF5F9', borderColor: '#FCE7F3' }]}>
                                            <View style={styles.reviewRow}>
                                                <View>
                                                    <Text style={styles.reviewL}>Recommended Methods</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                                        {mecRecommendations.map((rec, idx) => (
                                                            <View key={idx} style={{ backgroundColor: '#E45A92', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{rec}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Patient Demographics & History</Text>
                                <View style={styles.cardSection}>
                                    {GUEST_STEPS.map((s) => (
                                        <View key={s.id} style={styles.reviewRow}>
                                            <View><Text style={styles.reviewL}>{s.label}</Text><Text style={styles.reviewV}>{formData[s.id] || '---'}</Text></View>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* ===== SCREEN 2: MEC Eligibility Check ===== */}
                        {reviewStep === 1 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: '#E45A92' }]}>Medical Eligibility Check</Text>
                                <Text style={[styles.helperText, { textAlign: 'left', marginBottom: 4 }]}>Patient: {formData['NAME'] || 'Unknown'} • Age: {formData['AGE'] || '?'} • Smoking: {formData['SMOKE_CIGAR'] || 'Unknown'}</Text>
                                <Text style={[styles.helperText, { textAlign: 'left', marginBottom: 16 }]}>Toggle any conditions the patient has, then tap "Run Eligibility Check."</Text>

                                {/* Condition Toggles */}
                                <View style={styles.cardSection}>
                                    {MEC_CONDITIONS.map((cond) => (
                                        <TouchableOpacity
                                            key={cond.id}
                                            style={[styles.reviewRow, { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }]}
                                            onPress={() => toggleCondition(cond.id)}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.reviewV, { fontSize: 15 }]}>{cond.label}</Text>
                                                <Text style={[styles.reviewL, { fontSize: 12 }]}>{cond.description}</Text>
                                            </View>
                                            <View style={{
                                                width: 28, height: 28, borderRadius: 14,
                                                backgroundColor: medicalConditions[cond.id] ? '#EF4444' : '#E2E8F0',
                                                justifyContent: 'center', alignItems: 'center',
                                            }}>
                                                {medicalConditions[cond.id] && <CheckCircle2 size={16} color="#FFF" />}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Run MEC Button */}
                                <TouchableOpacity
                                    onPress={runMecCheck}
                                    style={[styles.dashboardStyleBtn, { marginTop: 16 }]}
                                >
                                    <Text style={styles.dashboardStyleBtnText}>{mecResults ? 'Re-Run Eligibility Check' : 'Run Eligibility Check'}</Text>
                                </TouchableOpacity>

                                {/* MEC Results Table */}
                                {mecResults && (
                                    <View style={{ marginTop: 20 }}>
                                        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Eligibility Results</Text>
                                        <View style={styles.cardSection}>
                                            {(Object.keys(mecResults) as Array<keyof MECResult>).map((methodKey) => {
                                                const cat = mecResults[methodKey];
                                                return (
                                                    <View key={methodKey} style={[styles.reviewRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                                        <Text style={[styles.reviewV, { flex: 1, fontSize: 15 }]}>{methodKey}</Text>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                            <View style={{
                                                                width: 28, height: 28, borderRadius: 14,
                                                                backgroundColor: getMECColor(cat),
                                                                justifyContent: 'center', alignItems: 'center',
                                                            }}>
                                                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>{cat}</Text>
                                                            </View>
                                                            <Text style={{ fontSize: 11, color: '#64748B', maxWidth: 140 }} numberOfLines={2}>{getMECLabel(cat)}</Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}
                            </>
                        )}

                        {/* ===== SCREEN 3: OB Clinical Input ===== */}
                        {reviewStep === 2 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: '#E45A92' }]}>Clinical Input</Text>
                                <Text style={[styles.helperText, { textAlign: 'left', marginBottom: 12 }]}>Fill in the clinical variables for this patient.</Text>

                                <View style={styles.cardSection}>
                                    {DOCTOR_STEPS.map((dStep) => (
                                        <View key={dStep.id} style={{ marginBottom: 20 }}>
                                            <Text style={styles.inputLabel}>{dStep.label}</Text>
                                            <TouchableOpacity
                                                style={styles.dropdownButton}
                                                onPress={() => {
                                                    setActiveSelectorStep(dStep);
                                                    setSelectorVisible(true);
                                                }}
                                            >
                                                <Text style={formData[dStep.id] ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                                                    {formData[dStep.id] || "Select Option"}
                                                </Text>
                                                <ChevronDown size={20} color="#64748B" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {/* Clinical Notes Input */}
                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={styles.inputLabel}>Clinical Notes</Text>
                                        <TextInput
                                            style={[styles.textInput, { height: 100, textAlignVertical: 'top', paddingTop: 10 }]}
                                            placeholder="Add instructions, observations, or next steps..."
                                            placeholderTextColor="#94A3B8"
                                            value={clinicalNotes}
                                            onChangeText={setClinicalNotes}
                                            multiline
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                        {/* ===== SCREEN 4: Model-Generated Risk for All Methods ===== */}
                        {reviewStep === 3 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: '#E45A92' }]}>Discontinuation Risk Results</Text>
                                <Text style={[styles.helperText, { textAlign: 'left', marginBottom: 16 }]}>Risk predictions for all eligible contraceptive methods based on MEC eligibility.</Text>

                                {isLoading ? (
                                    <View style={{ padding: 40, alignItems: 'center' }}>
                                        <ActivityIndicator size="large" color="#E45A92" />
                                        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>Assessing risk for all eligible methods...</Text>
                                    </View>
                                ) : Object.keys(allMethodResults).length > 0 ? (
                                    <>
                                        {Object.entries(allMethodResults).map(([methodName, result]) => {
                                            if (!result) return (
                                                <View key={methodName} style={[styles.cardSection, { marginBottom: 12, opacity: 0.5 }]}>
                                                    <Text style={styles.reviewV}>{methodName}</Text>
                                                    <Text style={[styles.reviewL, { color: '#EF4444' }]}>Assessment failed</Text>
                                                </View>
                                            );

                                            // Get MEC category for badge
                                            const nameToKey: Record<string, keyof MECResult> = {
                                                'Pills': 'CHC', 'Patch': 'CHC', 'Injectable': 'DMPA',
                                                'Implant': 'Implant', 'Copper IUD': 'Cu-IUD',
                                                'Intrauterine Device (IUD)': 'LNG-IUD',
                                            };
                                            const mecKey = nameToKey[methodName];
                                            const mecCat = mecResults && mecKey ? mecResults[mecKey] : null;

                                            return (
                                                <View key={methodName} style={{ marginBottom: 12 }}>
                                                    {/* Method name + MEC badge header */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                                                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>{methodName}</Text>
                                                        {mecCat && (
                                                            <View style={{ backgroundColor: getMECColor(mecCat as MECCategory), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>MEC {mecCat}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <RiskAssessmentCard
                                                        riskLevel={result.risk_level}
                                                        confidence={result.confidence}
                                                        recommendation={result.recommendation}
                                                        contraceptiveMethod={methodName}
                                                        keyFactors={generateKeyFactors(formData, result.risk_level)}
                                                        upgradedByDt={result.upgraded_by_dt}
                                                    />
                                                </View>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <View style={[styles.cardSection, { alignItems: 'center', padding: 30 }]}>
                                        <ClipboardList size={40} color="#CBD5E1" />
                                        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14, textAlign: 'center' }}>
                                            Tap "Generate Risk for All Methods" to run predictions.
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}

            </View>

            <View style={styles.stepFooter}>
                {screen === 'review' ? (
                    <View style={styles.reviewFooterContainer}>
                        {reviewStep === 0 ? (
                            /* Screen 1 Footer: Next to MEC */
                            <View style={{ width: '100%', marginTop: 10 }}>
                                <TouchableOpacity
                                    onPress={handleNext}
                                    style={styles.dashboardStyleBtn}
                                >
                                    <Text style={styles.dashboardStyleBtnText}>Next: Run Eligibility Check</Text>
                                    <Text style={[styles.arrow, { color: '#FFF', marginLeft: 6, fontSize: 16 }]}>»</Text>
                                </TouchableOpacity>
                            </View>
                        ) : reviewStep === 1 ? (
                            /* Screen 2 Footer: Next to OB Input (only if MEC is done) */
                            <View style={{ width: '100%', gap: 10 }}>
                                <TouchableOpacity
                                    onPress={handleNext}
                                    style={[styles.dashboardStyleBtn, !mecResults && { opacity: 0.5 }]}
                                    disabled={!mecResults}
                                >
                                    <Text style={styles.dashboardStyleBtnText}>Next: Clinical Input</Text>
                                    <Text style={[styles.arrow, { color: '#FFF', marginLeft: 6, fontSize: 16 }]}>»</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleBack}
                                    style={styles.dashboardStyleBtnSecondary}
                                >
                                    <Text style={styles.dashboardStyleBtnSecondaryText}>Back to Patient Overview</Text>
                                </TouchableOpacity>
                            </View>
                        ) : reviewStep === 2 ? (
                            /* Screen 3 Footer: Next to Risk Results */
                            <View style={{ width: '100%', gap: 10 }}>
                                <TouchableOpacity
                                    onPress={handleNext}
                                    style={styles.dashboardStyleBtn}
                                >
                                    <Text style={styles.dashboardStyleBtnText}>Next: Generate Risk Results</Text>
                                    <Text style={[styles.arrow, { color: '#FFF', marginLeft: 6, fontSize: 16 }]}>»</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleBack}
                                    style={styles.dashboardStyleBtnSecondary}
                                >
                                    <Text style={styles.dashboardStyleBtnSecondaryText}>Back to MEC Check</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* Screen 4 Footer: Generate All / Save & Finish */
                            <View style={{ width: '100%', gap: 10 }}>
                                <TouchableOpacity
                                    onPress={assessAllEligibleMethods}
                                    style={[styles.dashboardStyleBtn, { backgroundColor: '#E45A92' }]}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.dashboardStyleBtnText}>
                                            {Object.keys(allMethodResults).length > 0 ? 'Re-Generate All Risks' : 'Generate Risk for All Methods'}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {Object.keys(allMethodResults).length > 0 && (
                                    <TouchableOpacity
                                        onPress={handleSaveAndFinish}
                                        style={[styles.dashboardStyleBtn, { backgroundColor: '#10B981' }]}
                                    >
                                        <Text style={styles.dashboardStyleBtnText}>Save & Finish</Text>
                                        <CheckCircle2 color="#FFF" size={18} style={{ marginLeft: 6 }} />
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    onPress={handleBack}
                                    style={styles.dashboardStyleBtnSecondary}
                                >
                                    <Text style={styles.dashboardStyleBtnSecondaryText}>Back to Clinical Input</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.pillBar}>
                        <TouchableOpacity onPress={handleBack} style={styles.backBtn}><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleNext}
                            style={[styles.nextBtn, { flex: 1, marginLeft: 15, justifyContent: 'center' }]}
                        >
                            <Text style={styles.nextBtnText}>Continue</Text>
                            <Text style={styles.arrow}> »</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Unified Modal Selector for OB Input fields */}
            {screen === 'review' && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={selectorVisible}
                    onRequestClose={() => setSelectorVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.selectorContent}>
                            <View style={styles.selectorHeader}>
                                <Text style={styles.selectorTitle}>Select {activeSelectorStep?.label || 'Option'}</Text>
                                <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                                    <X size={24} color="#1E293B" />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={activeSelectorStep?.options || []}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.methodItem}
                                        onPress={() => {
                                            if (activeSelectorStep) {
                                                updateVal(item, activeSelectorStep.id);
                                                setSelectorVisible(false);
                                            }
                                        }}
                                    >
                                        <Text style={styles.methodText}>{item}</Text>
                                        {activeSelectorStep && formData[activeSelectorStep.id] === item && <CheckCircle2 size={18} color="#E45A92" />}
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default ObAssessment;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d3347a',
    },
    // Welcome Screen Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: '#d3347a',
        borderBottomWidth: 1,
        borderBottomColor: '#d3347a',
    },
    content: {
        flex: 1,
    },
    animationContainer: {
        flex: 1,
        zIndex: 10,
    },
    footer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 45,
        borderTopRightRadius: 45,
        paddingHorizontal: 35,
        paddingTop: 25,
        alignItems: 'center',
    },
    brandName: {
        fontSize: 14,
        color: '#d3347a',
        fontWeight: '800',
        letterSpacing: 3,
    },
    welcomeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1D2939',
        textAlign: 'center',
        lineHeight: 36,
        fontStyle: 'italic',
        paddingBottom: 10,
    },
    bottomBarContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    pillContainer: {
        backgroundColor: '#d3347a', // Primary Pink
        height: 90,
        borderRadius: 45,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        shadowColor: '#d3347a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    textBtn: {
        paddingLeft: 30,
    },
    doItLaterText: {
        color: '#FFD3E2',
        fontSize: 16,
        fontWeight: '600',
    },
    assessmentBtn: {
        backgroundColor: '#FFFFFF',
        height: 70,
        borderRadius: 35,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    assessmentBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    arrowIcon: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
        marginLeft: 5,
    },
    // Assessment Flow Styles
    progressHeader: { padding: 20 },
    progressBg: { height: 6, backgroundColor: '#F2F4F7', borderRadius: 3 },
    progressFill: { height: 6, backgroundColor: '#d3347a', borderRadius: 3 },
    stepContent: { flex: 1, paddingHorizontal: 25 },
    title: { fontSize: 26, fontWeight: '800', color: '#101828', textAlign: 'center' },
    subTitle: { fontSize: 15, color: '#667085', textAlign: 'center', marginTop: 8, marginBottom: 25 },
    optionBtn: { backgroundColor: '#F9FAFB', padding: 18, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: '#EAECF0' },
    selectedBtn: { backgroundColor: '#d3347a', borderColor: '#d3347a' },
    optionText: { fontSize: 16, fontWeight: '600', color: '#475467', textAlign: 'center' },
    selectedText: { color: '#FFF' },
    dropdown: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12 },
    stepFooter: { padding: 20, paddingBottom: 30 },
    pillBar: { backgroundColor: '#d3347a', height: 85, borderRadius: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
    backBtn: { paddingLeft: 20 },
    backBtnText: { color: '#FFD3E2', fontSize: 16, fontWeight: '600' },
    nextBtn: { backgroundColor: '#FFF', height: 65, borderRadius: 33, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30 },
    nextBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
    arrow: { fontSize: 18, fontWeight: '800', color: '#000' },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    reviewL: { fontSize: 13, color: '#667085' },
    reviewV: { fontSize: 16, color: '#101828', fontWeight: '700' },
    editText: { color: '#d3347a', fontWeight: '700' },

    // New Styles
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
    cardSection: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#475467', marginBottom: 8 },
    wheelContainer: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', height: 150 },
    textInput: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 16,
        fontSize: 18,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    // New Footer Styles for Review Screen
    reviewFooterContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
    },
    dashboardStyleBtn: {
        backgroundColor: '#E45A92',
        borderRadius: 12,
        height: 48,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#E45A92',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    dashboardStyleBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    dashboardStyleBtnSecondary: {
        backgroundColor: 'transparent',
        paddingVertical: 10,
        width: '100%',
        alignItems: 'center',
    },
    dashboardStyleBtnSecondaryText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#101828',
    },
    closeModalBtn: {
        marginTop: 20,
        backgroundColor: '#d3347a',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeModalBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    // Selector Styles
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dropdownTextSelected: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },
    dropdownTextPlaceholder: {
        fontSize: 16,
        color: '#94A3B8',
    },
    helperText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    selectorContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        height: '80%', // Bottom sheet style
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    selectorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    selectorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    sectionHeader: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 10,
        marginTop: 15,
    },
    sectionHeaderText: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    methodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 5,
        backgroundColor: '#F8FAFC',
    },
    methodText: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
    }
});