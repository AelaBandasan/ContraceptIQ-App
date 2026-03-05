import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
    AlertCircle,
    Info,
    CheckCircle2,
    Clock,
    ArrowRightLeft,
    AlertTriangle,
    ChevronDown,
    ChevronUp
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, shadows, borderRadius } from '../theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EmergencyContraception = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [bmiExpanded, setBmiExpanded] = useState(false);

    const toggleBmi = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setBmiExpanded(!bmiExpanded);
    };

    return (
        <View style={styles.safeArea}>
            {/* Header - Branded with Menu Toggle */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.menuButton}
                >
                    <View
                        style={styles.menuButtonSolid}
                    >
                        <Ionicons name="chevron-back" size={26} color="#FFF" />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerMainTitle}>Emergency Contraception</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Section: What is EC? */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Info size={22} color={colors.primary} />
                        <Text style={styles.cardTitle}>What is EC?</Text>
                    </View>
                    <Text style={styles.cardDescription}>
                        Emergency contraception (EC) is used to prevent pregnancy after contraceptive failure or unprotected sex.
                    </Text>
                    <View style={styles.highlightBar} />
                </View>

                {/* Section: Usage Guide Checklist */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Clock size={22} color={colors.primary} />
                        <Text style={styles.cardTitle}>When should it be used?</Text>
                    </View>
                    <View style={styles.checklist}>
                        <View style={styles.checkItem}>
                            <CheckCircle2 size={18} color="#10B981" />
                            <Text style={styles.checkText}>Condom broke or slipped</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <CheckCircle2 size={18} color="#10B981" />
                            <Text style={styles.checkText}>Missed 2 or more birth control pills</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <CheckCircle2 size={18} color="#10B981" />
                            <Text style={styles.checkText}>Diaphragm or cap was dislodged</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <CheckCircle2 size={18} color="#10B981" />
                            <Text style={styles.checkText}>Had unprotected sex</Text>
                        </View>
                    </View>
                </View>

                {/* Section: Comparison Table */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ArrowRightLeft size={22} color={colors.primary} />
                        <Text style={styles.cardTitle}>EC Comparison Guide</Text>
                    </View>

                    <View style={styles.table}>
                        <View style={[styles.tableHeader, { backgroundColor: '#F8FAFC' }]}>
                            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Method</Text>
                            <Text style={styles.tableHeaderText}>Effectiveness</Text>
                            <Text style={styles.tableHeaderText}>Timeframe</Text>
                        </View>

                        <View style={styles.tableRow}>
                            <Text style={[styles.methodName, { flex: 1.2 }]}>EC Pills (Levonorgestrel)</Text>
                            <Text style={styles.tableCell}>~89%</Text>
                            <Text style={styles.tableCell}>Within 72 hrs</Text>
                        </View>

                        <View style={styles.tableRow}>
                            <Text style={[styles.methodName, { flex: 1.2 }]}>Copper IUD</Text>
                            <Text style={[styles.tableCell, { fontWeight: '700', color: '#10B981' }]}>99.9%</Text>
                            <Text style={styles.tableCell}>Within 5 days</Text>
                        </View>
                    </View>
                </View>

                {/* Section: Interactive BMI Note */}
                <TouchableOpacity
                    style={[styles.card, styles.bmiCard]}
                    onPress={toggleBmi}
                    activeOpacity={0.7}
                >
                    <View style={styles.row}>
                        <AlertCircle size={22} color="#D97706" />
                        <Text style={styles.bmiTitle}>Important: BMI Note</Text>
                        {bmiExpanded ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                    </View>
                    <Text style={styles.bmiPreview}>
                        If over 165lbs, certain pills are less effective. Tap to see why.
                    </Text>

                    {bmiExpanded && (
                        <View style={styles.bmiExpandedContent}>
                            <Text style={styles.bmiText}>
                                Standard ECPs (Levonorgestrel) may lose effectiveness in individuals with a BMI over 25 or weight above 165lbs. In these cases, the Ella (Ulipristal) pill or a Copper IUD is highly recommended as they maintain full efficacy.
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Section: Side Effects */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ActivityIcon />
                        <Text style={styles.cardTitle}>What to Expect</Text>
                    </View>
                    <View style={styles.sideEffectGrid}>
                        <View style={styles.effectItem}>
                            <Text style={styles.effectEmoji}>🤢</Text>
                            <Text style={styles.effectLabel}>Nausea</Text>
                        </View>
                        <View style={styles.effectItem}>
                            <Text style={styles.effectEmoji}>🚑</Text>
                            <Text style={styles.effectLabel}>Fatigue</Text>
                        </View>
                        <View style={styles.effectItem}>
                            <Text style={styles.effectEmoji}>🤕</Text>
                            <Text style={styles.effectLabel}>Headache</Text>
                        </View>
                    </View>
                </View>

                {/* Section: Medical Advice Box */}
                <View style={styles.adviceBox}>
                    <View style={styles.adviceHeader}>
                        <AlertTriangle size={24} color="#FFF" />
                        <Text style={styles.adviceTitle}>When to Seek Medical Advice</Text>
                    </View>
                    <Text style={styles.adviceContent}>
                        • If you vomit within 2 hours of taking the pill.{'\n'}
                        • If your next period is more than 7 days late.{'\n'}
                        • If you experience sudden, severe abdominal pain.{'\n'}
                        • If you have persistent unusual bleeding.
                    </Text>
                </View>

                {/* Bottom Spacer */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

// Helper Icon Component
const ActivityIcon = () => (
    <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="pulse" size={20} color={colors.primary} />
    </View>
)

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
    headerAppTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFDBEB',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    headerMainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 2,
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
        padding: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 10,
    },
    cardDescription: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    highlightBar: {
        height: 4,
        width: 40,
        backgroundColor: colors.primary,
        borderRadius: 2,
        marginTop: 15,
    },
    checklist: {
        marginTop: 4,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkText: {
        fontSize: 14,
        color: '#475569',
        marginLeft: 12,
    },
    table: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tableHeaderText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    methodName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
    },
    tableCell: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        textAlign: 'left',
    },
    bmiCard: {
        borderColor: '#FEF3C7',
        backgroundColor: '#FFFBEB',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bmiTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#92400E',
        marginLeft: 10,
    },
    bmiPreview: {
        fontSize: 13,
        color: '#B45309',
        marginTop: 8,
        lineHeight: 18,
    },
    bmiExpandedContent: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#FEF3C7',
    },
    bmiText: {
        fontSize: 13,
        color: '#92400E',
        lineHeight: 20,
    },
    sideEffectGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    effectItem: {
        alignItems: 'center',
        flex: 1,
    },
    effectEmoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    effectLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    adviceBox: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 20,
        marginTop: 8,
        ...shadows.md,
    },
    adviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    adviceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        marginLeft: 12,
    },
    adviceContent: {
        fontSize: 13,
        color: '#CBD5E1',
        lineHeight: 22,
    },
});

export default EmergencyContraception;
