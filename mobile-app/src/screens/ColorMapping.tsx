import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { DrawerScreenProps } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { Info, CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react-native';

type Props = DrawerScreenProps<'ColorMapping'>;

const ColorMapping: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const categories = [
        {
            title: 'Green — Safe to Use',
            subtitle: 'Category 1: No restriction',
            description: 'You can safely use this method. There are no known medical reasons to avoid it.',
            footer: 'Recommended option',
            color: '#0D9488', // Teal/Green
            lightColor: '#F0FDFA',
            icon: CheckCircle2,
        },
        {
            title: 'Yellow — Generally Safe',
            subtitle: 'Category 2: Benefits outweigh risks',
            description: 'This method is generally safe for you. In most cases, the benefits are greater than any possible risks.',
            footer: 'Monitor if needed',
            color: '#CA8A04', // Dark Yellow
            lightColor: '#FEFCE8',
            icon: AlertCircle,
        },
        {
            title: 'Orange — Use with Caution',
            subtitle: 'Category 3: Risks usually outweigh benefits',
            description: 'This method may not be the best choice for you. You should talk with a healthcare provider before using it.',
            footer: 'Medical advice recommended',
            color: '#EA580C', // Orange
            lightColor: '#FFF7ED',
            icon: AlertTriangle,
        },
        {
            title: 'Red — Not Recommended',
            subtitle: 'Category 4: Unacceptable health risk',
            description: 'You should not use this method because it may be unsafe for your condition.',
            footer: 'Avoid this method',
            color: '#DC2626', // Red
            lightColor: '#FEF2F2',
            icon: XCircle,
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuButton}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                        style={styles.gradient}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerAppTitle}>ContraceptIQ</Text>
                    <Text style={styles.headerTagline}>What the Colors Mean</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introSection}>
                    <Text style={styles.introSubtitle}>
                        These colors show how safe each contraceptive method is for you based on World Health Organization (WHO) medical eligibility criteria.
                    </Text>
                </View>

                {categories.map((category, index) => {
                    const IconComponent = category.icon;
                    return (
                        <View key={index} style={[styles.card, { borderLeftColor: category.color }]}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: category.lightColor }]}>
                                    <IconComponent size={24} color={category.color} />
                                </View>
                                <View style={styles.titleArea}>
                                    <Text style={[styles.categoryTitle, { color: category.color }]}>{category.title}</Text>
                                    <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                                </View>
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={styles.description}>{category.description}</Text>
                                <View style={[styles.footerBadge, { backgroundColor: category.lightColor }]}>
                                    <Text style={[styles.categoryFooter, { color: category.color }]}>
                                        {category.footer === 'Recommended option' ? '✅ ' : '⚠️ '}{category.footer}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

                <View style={styles.pageFooter}>
                    <Info size={20} color="#64748B" />
                    <Text style={styles.footerText}>Always consult a healthcare professional for final medical advice decisions regarding your reproductive health.</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default ColorMapping;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAF9',
    },
    header: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    menuButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        marginLeft: 15,
    },
    headerAppTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerTagline: {
        fontSize: 14,
        color: '#FFDBEB',
        fontStyle: 'italic',
        marginTop: 4,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    introSection: {
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    introSubtitle: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 22,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginBottom: 20,
        padding: 20,
        borderLeftWidth: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    titleArea: {
        flex: 1,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    categorySubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    cardBody: {
        paddingLeft: 0,
    },
    description: {
        fontSize: 14.5,
        color: '#334155',
        lineHeight: 22,
        marginBottom: 16,
    },
    footerBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    categoryFooter: {
        fontSize: 13,
        fontWeight: '700',
    },
    pageFooter: {
        marginTop: 10,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        gap: 12,
    },
    footerText: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
});
