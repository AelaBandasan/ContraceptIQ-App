import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
    Dimensions, ScrollView, FlatList, Image, StatusBar, Platform, TextInput
} from 'react-native';
import { Menu } from 'lucide-react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat,
    withTiming, withSequence
} from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

const { width, height } = Dimensions.get('window');

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
    top: number;
    left: number;
}

// --- FLOATING ICON COMPONENT ---
const FloatingIcon = ({ source, delay = 0, size = 60, top, left }: FloatingIconProps) => {
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withRepeat(withSequence(withTiming(-15, { duration: 2500 + delay }), withTiming(0, { duration: 2500 + delay })), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
    return (
        <Animated.View style={[{
            position: 'absolute', top, left,
            shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8
        }, animatedStyle]}>
            <View style={{ backgroundColor: 'white', borderRadius: 100, padding: 10 }}>
                <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
            </View>
        </Animated.View>
    );
};

// ... (imports remain same, not replacing entire file to be safe, targeting the component implementation)
const ObAssessment = ({ navigation, route }: any) => {
    const [screen, setScreen] = useState('welcome'); // 'welcome', 'onboarding', 'review'
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const isViewOnly = route?.params?.viewOnly;

    // Load data if view only
    useEffect(() => {
        if (isViewOnly && route.params?.patientData) {
            setFormData(route.params.patientData.details || {});
            setScreen('review'); // Go directly to review
        }
    }, [isViewOnly]);

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

    const handleSubmit = () => {
        const newPatient = {
            id: Date.now().toString(),
            name: formData.NAME || 'New Patient',
            lastVisit: 'Just now',
            status: 'Waiting',
            age: formData.AGE || '-',
            type: 'New Visit',
            details: formData
        };
        alert("Assessment Submitted!");
        navigation.navigate('ObHomeScreen', { newPatient });
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
                            top={height * 0.22} left={width * 0.38} size={90}
                        />
                        {/* ... keep other icons ... */}
                        <FloatingIcon
                            source={require('../../../assets/image/copperiud.png')} // IUD
                            top={height * 0.17} left={width * 0.70} delay={0} size={70}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/implantt.png')} // Condom/Other
                            top={height * 0.07} left={width * 0.38} delay={0} size={65}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/injectables.png')} // Condom/Other
                            top={height * 0.18} left={width * 0.09} delay={300} size={70}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/leviud.png')} // Condom/Other
                            top={height * 0.33} left={width * 0.09} delay={100} size={65}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/patchh.png')} // Condom/Other
                            top={height * 0.41} left={width * 0.4} delay={200} size={75}
                        />
                        <FloatingIcon
                            source={require('../../../assets/image/pillss.png')} // Condom/Other
                            top={height * 0.34} left={width * 0.70} delay={40} size={65}
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
                <View style={styles.pillBar}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
                    {/* Maximize space in left -> Continue button expands */}
                    {!isViewOnly && (
                        <TouchableOpacity onPress={screen === 'review' ? handleSubmit : handleNext} style={[styles.nextBtn, { flex: 1, marginLeft: 15, justifyContent: 'center' }]}>
                            <Text style={styles.nextBtnText}>{screen === 'review' ? "Submit" : "Continue"}</Text>
                            <Text style={styles.arrow}> »</Text>
                        </TouchableOpacity>
                    )}
                </View>
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
    }
});