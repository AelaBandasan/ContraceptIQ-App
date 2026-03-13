import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
    AlertCircle,
    Info,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
} from 'lucide-react-native';
import { colors, shadows } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EmergencyContraception = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [bmiExpanded, setBmiExpanded] = useState(false);

    const toggleBmi = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setBmiExpanded((prev) => !prev);
    };

    return (
        <View style={styles.safeArea}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
                <TouchableOpacity
                    onPress={() => (navigation as any).openDrawer()}
                    style={styles.menuButton}
                >
                    <View style={styles.menuButtonSolid}>
                        <Ionicons name="menu" size={26} color="#FFF" />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerMainTitle}>Emergency Contraception</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.infoCard, styles.primaryInfoCard]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.infoIconWrap}>
                            <Info size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.cardTitle}>Emergency Contraception</Text>
                    </View>
                    <Text style={styles.cardDescription}>
                        Emergency contraception (EC) refers to methods used after unprotected sexual intercourse to prevent pregnancy. According to WHO guidance, emergency contraceptive pills work primarily by preventing or delaying ovulation and do not disrupt an existing pregnancy.
                    </Text>
                    <Text style={styles.cardDescription}>
                        Users may experience nausea, spotting, or temporary menstrual changes. Medical advice should be sought if the next period is more than one week late, if severe abdominal pain occurs, or if heavy bleeding develops.
                    </Text>
                    <View style={styles.cardLabelBottom}>
                        <Text style={styles.cardLabelText}>For urgent situations</Text>
                    </View>
                </View>

                <View style={[styles.infoCard, styles.usageInfoCard]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.clockIconWrap}>
                            <Clock size={22} color="#2563EB" />
                        </View>
                        <Text style={styles.cardTitle}>When should it be used?</Text>
                    </View>
                    <View style={styles.checklist}>
                        <View style={styles.checkItem}>
                            <CheckCircle2 size={20} color="#10B981" />
                            <Text style={styles.checkText}>When no contraceptive method was used</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <CheckCircle2 size={20} color="#10B981" />
                            <Text style={styles.checkText}>After method failure (broken condom, missed pills)</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <CheckCircle2 size={20} color="#10B981" />
                            <Text style={styles.checkText}>Following sexual assault</Text>
                        </View>
                    </View>
                    <Text style={styles.cardDescription}>
                        EC is intended for occasional use and should be taken as soon as possible after unprotected intercourse for greatest effectiveness.
                    </Text>
                    <View style={styles.urgencyBadgeBottom}>
                        <Clock size={22} color="#0F766E" />
                        <Text style={styles.urgencyBadgeBottomText}>Use as soon as possible</Text>
                    </View>
                </View>

                <View>
                    <TouchableOpacity
                        style={[styles.infoCard, styles.cautionCard]}
                        onPress={toggleBmi}
                        activeOpacity={0.8}
                    >
                        <View style={styles.rowBetween}>
                            <View style={styles.cautionHeaderLeft}>
                                <AlertCircle size={22} color="#D97706" />
                                <Text style={styles.cautionTitle}>Important: BMI Note</Text>
                            </View>
                            {bmiExpanded ? <ChevronUp size={20} color="#92400E" /> : <ChevronDown size={20} color="#92400E" />}
                        </View>
                        <Text style={styles.cautionPreview}>Tap to view clinically important guidance.</Text>

                        {bmiExpanded && (
                            <View style={styles.cautionExpanded}>
                                <Text style={styles.cautionText}>
                                    WHO guidance indicates that the effectiveness of levonorgestrel emergency contraceptive pills may be reduced in individuals with higher body weight or body mass index. In such cases, ulipristal acetate or the copper IUD may provide more reliable protection when available.
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={[styles.infoCard, styles.reassuranceCard]}>
                    <View style={styles.cardHeader}>
                        <CheckCircle2 size={22} color="#15803D" />
                        <Text style={[styles.cardTitle, { color: '#166534' }]}>Common and usually temporary</Text>
                    </View>
                    <Text style={styles.reassuranceText}>
                        After taking emergency contraception, some users may experience temporary side effects such as nausea, mild abdominal discomfort, fatigue, or spotting. The next menstrual period may occur earlier or later than expected.
                    </Text>
                    <Text style={styles.reassuranceText}>
                        These effects are usually short-term and not harmful.
                    </Text>
                </View>

                <View style={styles.adviceCard}>
                    <View style={styles.cardHeader}>
                        <AlertTriangle size={22} color="#C2410C" />
                        <Text style={[styles.cardTitle, { color: '#9A3412' }]}>When to Seek Medical Advice</Text>
                    </View>
                    <Text style={styles.adviceText}>- Next menstrual period is more than one week late</Text>
                    <Text style={styles.adviceText}>- Severe lower abdominal pain develops</Text>
                    <Text style={styles.adviceText}>- Unusually heavy bleeding occurs</Text>
                    <Text style={styles.adviceText}>- Concern about possible pregnancy</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerMainTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
    },
    menuButtonSolid: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 18,
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 18,
        marginBottom: 10,
        ...shadows.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    primaryInfoCard: {
        borderColor: '#FBCFE8',
        backgroundColor: '#FFFDFE',
    },
    usageInfoCard: {
        borderColor: '#BFDBFE',
        backgroundColor: '#F8FBFF',
    },
    infoIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clockIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabelText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#BE185D',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardLabelBottom: {
        alignSelf: 'flex-start',
        backgroundColor: '#FDF2F8',
        borderColor: '#FBCFE8',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginLeft: 10,
        flex: 1,
    },
    cardDescription: {
        fontSize: 15,
        color: colors.text.secondary,
        lineHeight: 22,
        marginTop: 1,
    },
    urgencyBadgeBottom: {
        marginTop: 14,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFEFF',
        borderWidth: 1,
        borderColor: '#A5F3FC',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 6,
    },
    urgencyBadgeBottomText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F766E',
    },
    checklist: {
        marginTop: 2,
        marginBottom: 6,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    checkText: {
        flex: 1,
        fontSize: 15,
        color: '#475569',
        marginLeft: 10,
        lineHeight: 21,
    },
    cautionCard: {
        borderColor: '#FDE68A',
        backgroundColor: '#FFFBEB',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cautionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cautionTitle: {
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '700',
        color: '#92400E',
    },
    cautionPreview: {
        marginTop: 8,
        fontSize: 13,
        color: '#B45309',
    },
    cautionExpanded: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#FDE68A',
    },
    cautionText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
    reassuranceCard: {
        borderColor: '#BBF7D0',
        backgroundColor: '#F0FDF4',
    },
    reassuranceText: {
        fontSize: 14,
        color: '#166534',
        lineHeight: 21,
        marginTop: 4,
    },
    adviceCard: {
        backgroundColor: '#FFF7ED',
        borderRadius: 15,
        padding: 18,
        borderWidth: 1,
        borderColor: '#FED7AA',
        ...shadows.sm,
    },
    adviceText: {
        fontSize: 14,
        color: '#9A3412',
        lineHeight: 22,
        marginBottom: 4,
    },
});

export default EmergencyContraception;
