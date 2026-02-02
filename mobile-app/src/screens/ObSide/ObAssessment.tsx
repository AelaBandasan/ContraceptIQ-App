import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    Dimensions, ScrollView, FlatList, Image, StatusBar, Platform, TextInput, Modal, ActivityIndicator, Alert, SectionList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, X } from 'lucide-react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat,
    withTiming, withSequence
} from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { assessDiscontinuationRisk, UserAssessmentData, RiskAssessmentResponse } from '../../services/discontinuationRiskService';
import RiskAssessmentCard from '../../components/RiskAssessmentCard';
import { AlertTriangle, ChevronDown, CheckCircle2 } from 'lucide-react-native';

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
const STEPS = [
    { id: 'NAME', label: "What's your Name?", type: 'text', sub: "Let's get to know you first." },
    { id: 'AGE', label: "What's your Age?", type: 'wheel', sub: "This helps in personalizing results." },
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
    { id: 'CONTRACEPTIVE_METHOD', label: "Contraceptive Method", type: 'select', options: ['None', 'Pills', 'Condom', 'Copper IUD', 'Intrauterine Device (IUD)', 'Implant', 'Patch', 'Injectable', 'Withdrawal'] },
    { id: 'MONTH_USE_CURRENT_METHOD', label: "Month of Use Current Method", type: 'wheel', range: [0, 12] },
    { id: 'PATTERN_USE', label: "Pattern of Use", type: 'select', options: ['Regular', 'Irregular', 'Not Sure'] },
    { id: 'TOLD_ABT_SIDE_EFFECTS', label: "Told about Side effects?", type: 'select', options: ['Yes by Health Worker', 'Yes by research/friends', 'No'] },
    { id: 'LAST_SOURCE_TYPE', label: 'Last Source Type', type: 'select', options: ['Government health facility', 'Private Clinic/Hospital', 'Pharmacy', 'NGO', 'Online/Telehealth'] },
    { id: 'LAST_METHOD_DISCONTINUED', label: 'Last Method Discontinued', type: 'select', options: ['Pills', 'Condom', 'Copper IUD', 'Intrauterine Device (IUD)', 'Implant', 'Patch', 'Injectable', 'Withdrawal'] },
    { id: 'REASON_DISCONTINUED', label: "Reason Discontinued", type: 'select', options: ['Side effects', 'Health concerns', 'Desire to become pregnant'] },
    { id: 'HSBND_DESIRE_FOR_MORE_CHILDREN', label: "Husband's Desire for More Children", type: 'select', options: ['Yes', 'No', 'Not Sure'] },
];

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
    const [screen, setScreen] = useState('welcome'); // 'welcome', 'onboarding', 'review'
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [assessmentResult, setAssessmentResult] = useState<RiskAssessmentResponse | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [methodSelectorVisible, setMethodSelectorVisible] = useState(false);
    const isViewOnly = route?.params?.viewOnly;

    // Load data if view only
    // Load data from params (View Only or Imported)
    useEffect(() => {
        if (route.params?.patientData) {
            const data = route.params.patientData;
            // Handle both legacy mock structure (data.details) and flat API structure (data)
            const initialForm = data.details || data;

            setFormData(initialForm);

            if (isViewOnly || route.params?.imported) {
                // If view only or imported, go to review screen to verify details
                setScreen('review');
            }
        }
    }, [route.params]);

    // --- MEC SORTING LOGIC ---
    const getSortedMethods = (): MethodSection[] => {
        // Fallback mock eligibility if none provided (for manual testing)
        const eligibility = route.params?.patientData?.method_eligibility || {
            'Pills': 1, 'Implant': 1, 'Condom': 1, // Tier 1
            'Injectable': 2, 'Patch': 2,           // Tier 2
            'Copper IUD': 3, 'Intrauterine Device (IUD)': 3 // Tier 3
        };

        const allMethods = STEPS.find(s => s.id === 'CONTRACEPTIVE_METHOD')?.options || [];

        const tier1: string[] = [];
        const tier2: string[] = [];
        const tier3: string[] = [];

        allMethods.forEach(method => {
            if (method === 'None' || method === 'Withdrawal') {
                // Always allow basic methods? Or categorize them? 
                // Assuming they are standard/always allowed -> Tier 1 for now or skip checking
                tier1.push(method);
                return;
            }

            const cat = eligibility[method]; // Get category

            if (!cat) {
                // If method not in eligibility list, maybe default to Tier 2 or 1? 
                // Or separate "Unknown"? defaulting to Tier 2 for safety.
                tier2.push(method);
            } else if (cat === 1) {
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

        setMethodSelectorVisible(false);
        updateVal(method);

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
        if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
        else setScreen('review');
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
        else {
            if (isViewOnly) navigation.goBack();
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
            REGION: getIndex('REGION', STEPS.find(s => s.id === 'REGION')?.options),
            EDUC_LEVEL: getIndex('EDUC_LEVEL', STEPS.find(s => s.id === 'EDUC_LEVEL')?.options),
            RELIGION: getIndex('RELIGION', STEPS.find(s => s.id === 'RELIGION')?.options),
            ETHNICITY: getIndex('ETHNICITY', STEPS.find(s => s.id === 'ETHNICITY')?.options),
            MARITAL_STATUS: getIndex('MARITAL_STATUS', STEPS.find(s => s.id === 'MARITAL_STATUS')?.options),
            RESIDING_WITH_PARTNER: data['RESIDING_WITH_PARTNER'] === 'Yes' ? 1 : 0,
            HOUSEHOLD_HEAD_SEX: getIndex('HOUSEHOLD_HEAD_SEX', STEPS.find(s => s.id === 'HOUSEHOLD_HEAD_SEX')?.options),
            OCCUPATION: getIndex('OCCUPATION', STEPS.find(s => s.id === 'OCCUPATION')?.options),
            HUSBANDS_EDUC: getIndex('HUSBAND_EDUC_LEVEL', STEPS.find(s => s.id === 'HUSBAND_EDUC_LEVEL')?.options),
            HUSBAND_AGE: getNumber('HUSBAND_AGE', 30),
            PARTNER_EDUC: getIndex('HUSBAND_EDUC_LEVEL', STEPS.find(s => s.id === 'HUSBAND_EDUC_LEVEL')?.options), // Fallback if same field used
            SMOKE_CIGAR: getIndex('SMOKE_CIGAR', STEPS.find(s => s.id === 'SMOKE_CIGAR')?.options),
            PARITY: getNumber('PARITY', 0),
            DESIRE_FOR_MORE_CHILDREN: getIndex('DESIRE_FOR_MORE_CHILDREN', STEPS.find(s => s.id === 'DESIRE_FOR_MORE_CHILDREN')?.options),
            WANT_LAST_CHILD: getIndex('WANT_LAST_CHILD', STEPS.find(s => s.id === 'WANT_LAST_CHILD')?.options),
            WANT_LAST_PREGNANCY: getIndex('WANT_LAST_PREGNANCY', STEPS.find(s => s.id === 'WANT_LAST_PREGNANCY')?.options),
            CONTRACEPTIVE_METHOD: getIndex('CONTRACEPTIVE_METHOD', STEPS.find(s => s.id === 'CONTRACEPTIVE_METHOD')?.options),
            MONTH_USE_CURRENT_METHOD: getNumber('MONTH_USE_CURRENT_METHOD', 1),
            PATTERN_USE: getIndex('PATTERN_USE', STEPS.find(s => s.id === 'PATTERN_USE')?.options),
            TOLD_ABT_SIDE_EFFECTS: data['TOLD_ABT_SIDE_EFFECTS']?.includes('Yes') ? 1 : 0,
            LAST_SOURCE_TYPE: getIndex('LAST_SOURCE_TYPE', STEPS.find(s => s.id === 'LAST_SOURCE_TYPE')?.options),
            LAST_METHOD_DISCONTINUED: getIndex('LAST_METHOD_DISCONTINUED', STEPS.find(s => s.id === 'LAST_METHOD_DISCONTINUED')?.options),
            REASON_DISCONTINUED: getIndex('REASON_DISCONTINUED', STEPS.find(s => s.id === 'REASON_DISCONTINUED')?.options),
            HSBND_DESIRE_FOR_MORE_CHILDREN: getIndex('HSBND_DESIRE_FOR_MORE_CHILDREN', STEPS.find(s => s.id === 'HSBND_DESIRE_FOR_MORE_CHILDREN')?.options),
        };
    };

    const handleAssessSubmit = async () => {
        setIsLoading(true);
        try {
            // 1. Map Data
            const apiData = mapFormDataToApi(formData);

            // 2. Call API
            const result = await assessDiscontinuationRisk(apiData);

            // 3. Navigate to Result Screen
            navigation.navigate('AssessmentResultScreen', {
                riskResult: result,
                patientData: formData
            });

        } catch (error: any) {
            Alert.alert("Assessment Failed", error.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const savePatientData = (status: string) => {
        const newPatient = {
            id: Date.now().toString(),
            name: formData.NAME || 'New Patient',
            lastVisit: 'Just now',
            status: status,
            age: formData.AGE || '-',
            type: 'New Visit',
            details: formData,
            assessmentResult: null // No assessment result when saving draft
        };
        navigation.navigate('ObDrawer', {
            screen: 'ObHomeScreen',
            params: { newPatient }
        });
    };

    const handleSaveDraft = () => {
        savePatientData('Waiting');
    };

    const updateVal = (val: string) => {
        if (!isViewOnly) setFormData({ ...formData, [step.id]: val });
    };

    // Shared Header Component
    const Header = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => (navigation as any).openDrawer()} style={{ marginRight: 10 }}>
                <Menu size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ width: 24 }} />
        </View>
    );

    // --- RENDER HELPERS ---
    if (screen === 'welcome') {
        return (
            <SafeAreaView style={styles.container}>
                <Header />

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
        <SafeAreaView style={[styles.container, { backgroundColor: '#FFF' }]}>
            <StatusBar barStyle="light-content" />

            {/* Header added to top of progress bar */}
            <Header />

            {screen === 'onboarding' && (
                <View style={styles.progressHeader}>
                    <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} /></View>
                </View>
            )}

            <View style={styles.stepContent}>
                <Text style={styles.title}>{screen === 'review' ? "Review Info" : step.label}</Text>
                <Text style={styles.subTitle}>{screen === 'review' ? "Double check patient details." : step.sub || "Tap to select an option."}</Text>

                {screen === 'onboarding' ? (
                    <View style={{ flex: 1 }}>
                        {step.type === 'text' ? (
                            <View style={{ width: '100%', alignItems: 'center' }}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#94A3B8"
                                    value={formData[step.id] || ''}
                                    onChangeText={updateVal}
                                />
                            </View>
                        ) : step.type === 'wheel' ? (
                            <Picker selectedValue={formData[step.id] || '25'} onValueChange={updateVal}>
                                {Array.from({ length: step.range ? (step.range[1] - step.range[0] + 1) : 50 }, (_, i) => {
                                    const val = (step.range ? step.range[0] : 18) + i;
                                    return <Picker.Item key={val} label={val.toString()} value={val.toString()} />;
                                })}
                            </Picker>
                        ) : step.id === 'CONTRACEPTIVE_METHOD' ? (
                            <View style={{ width: '100%' }}>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setMethodSelectorVisible(true)}
                                >
                                    <Text style={formData[step.id] ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                                        {formData[step.id] || "Select Method"}
                                    </Text>
                                    <ChevronDown size={20} color="#64748B" />
                                </TouchableOpacity>
                                <Text style={styles.helperText}>Sorted by Medical Eligibility (MEC)</Text>
                                <View style={{ height: 20 }} />

                                <Modal
                                    animationType="slide"
                                    transparent={true}
                                    visible={methodSelectorVisible}
                                    onRequestClose={() => setMethodSelectorVisible(false)}
                                >
                                    <View style={styles.modalOverlay}>
                                        <View style={styles.selectorContent}>
                                            <View style={styles.selectorHeader}>
                                                <Text style={styles.selectorTitle}>Select Contraceptive Method</Text>
                                                <TouchableOpacity onPress={() => setMethodSelectorVisible(false)}>
                                                    <X size={24} color="#1E293B" />
                                                </TouchableOpacity>
                                            </View>

                                            <SectionList
                                                sections={getSortedMethods()}
                                                keyExtractor={(item, index) => item + index}
                                                renderItem={({ item, section }) => (
                                                    <TouchableOpacity
                                                        style={styles.methodItem}
                                                        onPress={() => handleMethodSelect(item)}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            {section.category === 3 && (
                                                                <AlertTriangle size={18} color="#D97706" style={{ marginRight: 10 }} />
                                                            )}
                                                            <Text style={[
                                                                styles.methodText,
                                                                section.category === 3 && { color: '#B45309' }
                                                            ]}>{item}</Text>
                                                        </View>
                                                        {formData[step.id] === item && <CheckCircle2 size={18} color="#E45A92" />}
                                                    </TouchableOpacity>
                                                )}
                                                renderSectionHeader={({ section: { title, category } }) => (
                                                    <View style={[
                                                        styles.sectionHeader,
                                                        category === 1 ? { backgroundColor: '#DCFCE7' } :
                                                            category === 2 ? { backgroundColor: '#E0F2FE' } :
                                                                { backgroundColor: '#FEF3C7' }
                                                    ]}>
                                                        <Text style={[
                                                            styles.sectionHeaderText,
                                                            category === 1 ? { color: '#166534' } :
                                                                category === 2 ? { color: '#0369A1' } :
                                                                    { color: '#92400E' }
                                                        ]}>{title}</Text>
                                                    </View>
                                                )}
                                                stickySectionHeadersEnabled={false}
                                                contentContainerStyle={{ paddingBottom: 20 }}
                                            />
                                        </View>
                                    </View>
                                </Modal>
                            </View>
                        ) : step.type === 'select' ? (
                            <FlatList data={step.options} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.optionBtn, formData[step.id] === item && styles.selectedBtn]} onPress={() => updateVal(item)}>
                                    <Text style={[styles.optionText, formData[step.id] === item && styles.selectedText]}>{item}</Text>
                                </TouchableOpacity>
                            )} />
                        ) : (
                            <View style={styles.dropdown}><Picker selectedValue={formData[step.id]} onValueChange={updateVal}>{step.options?.map(o => <Picker.Item key={o} label={o} value={o} />)}</Picker></View>
                        )}
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {STEPS.map((s, idx) => (
                            <View key={s.id} style={styles.reviewRow}>
                                <View><Text style={styles.reviewL}>{s.label}</Text><Text style={styles.reviewV}>{formData[s.id] || '---'}</Text></View>
                                {!isViewOnly && (
                                    <TouchableOpacity onPress={() => { setScreen('onboarding'); setCurrentStep(idx); }}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>

            <View style={styles.stepFooter}>
                {screen === 'review' ? (
                    <View style={styles.reviewFooterContainer}>
                        <TouchableOpacity
                            onPress={handleAssessSubmit}
                            style={styles.primaryActionBtn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.primaryActionBtnText}>Generate Risk Assessment</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSaveDraft}
                            style={styles.secondaryActionBtn}
                        >
                            <Text style={styles.secondaryActionBtnText}>Save Draft & Exit</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.pillBar}>
                        <TouchableOpacity onPress={handleBack} style={styles.backBtn}><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
                        {/* Maximize space in left -> Continue button expands */}
                        {!isViewOnly && (
                            <TouchableOpacity
                                onPress={handleNext}
                                style={[styles.nextBtn, { flex: 1, marginLeft: 15, justifyContent: 'center' }]}
                            >
                                <Text style={styles.nextBtnText}>Continue</Text>
                                <Text style={styles.arrow}> »</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
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
    primaryActionBtn: {
        backgroundColor: '#E45A92',
        borderRadius: 30,
        height: 56,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#E45A92',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryActionBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryActionBtn: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    secondaryActionBtnText: {
        color: '#E45A92',
        fontSize: 15,
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