import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Share } from 'react-native';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { RootStackScreenProps } from '../types/navigation';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { CONTRACEPTIVE_DETAILS } from '../data/contraceptiveData';

type Props = RootStackScreenProps<'MethodDetail'>;

export const MethodDetail: React.FC<Props> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { methodId } = route.params || {};

    const data = methodId ? CONTRACEPTIVE_DETAILS[methodId] : null;

    if (!data) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.text.secondary} />
                <Text style={styles.errorText}>Information for this method is currently unavailable.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backLink}>Return to Methods</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${data.name} on ContraceptIQ! Efficient, reliable contraceptive info.`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={styles.safeArea}>
            {/* Premium Header - Reverted to Original Pink style */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="chevron-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.screenTitle}>Method Details</Text>
                </View>
                <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                    <Ionicons name="share-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
                {/* Main Info Card */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} style={[styles.mainCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 15 }}>
                        <View style={styles.imageContainer}>
                            <Image source={data.illustration} style={styles.mainImage} />
                        </View>
                        <View style={[styles.mainTextContent, { marginLeft: 16, justifyContent: 'center' }]}>
                            <View style={styles.titleRow}>
                                <Text style={styles.methodTitle}>{data.name}</Text>
                            </View>
                            {data.type && (
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeBadgeText}>{data.type}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Text style={styles.methodDescription}>{data.description}</Text>
                </Animated.View>

                {/* Stats Row */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Effectiveness</Text>
                        <View style={styles.effChipSmall}>
                            <Text style={styles.effChipTextSmall}>{data.perfectEffectiveness || data.effectiveness}</Text>
                        </View>
                        {(data.perfectEffectiveness) && <Text style={styles.statSubText}>(perfect use)</Text>}
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Frequency</Text>
                        <View style={styles.statValueRow}>
                            <Ionicons name={data.frequencyIcon || "time-outline"} size={16} color={colors.primary} />
                            <Text style={[styles.statValue, { marginLeft: 4 }]}>{data.frequency}</Text>
                        </View>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Estimated Price</Text>
                        <Text style={[styles.statValue, { fontSize: 13, textAlign: 'center' }]}>{data.priceRange}</Text>
                    </View>
                </Animated.View>

                {/* How to Use Section */}
                <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>HOW TO USE</Text>
                                <Text style={styles.sectionSubtitle}>{data.name}</Text>
                            </View>
                            <View style={styles.iconBadge}>
                                <MaterialCommunityIcons name="pill" size={30} color={colors.primary} />
                            </View>
                        </View>

                        <View style={styles.usageList}>
                            {Array.isArray(data.howToUse) ? (
                                data.howToUse.map((step, index) => (
                                    <View key={index} style={styles.usageStepRow}>
                                        <Text style={styles.usageStepNumber}>{index + 1}.</Text>
                                        <Text style={styles.usageStepText}>{step}</Text>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.usageStepRow}>
                                    <Text style={styles.usageStepBullet}>•</Text>
                                    <Text style={styles.usageStepText}>{data.howToUse}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.usageBadge}>
                            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                            <Text style={styles.usageBadgeText}>{data.effectiveness} {data.effectiveness.includes('effective') ? '' : 'Effective'}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Benefits & Disadvantages Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.richComparisonContainer}>
                    <View style={[styles.richComparisonBox, styles.benefitsBox]}>
                        <View style={styles.comparisonHeaderRow}>
                            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                                <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                            </View>
                            <Text style={[styles.comparisonTitle, { color: '#16A34A' }]}>Benefits</Text>
                        </View>
                        {data.benefits.map((item, idx) => (
                            <View key={idx} style={styles.richBulletRow}>
                                <View style={styles.checkIconWrapper}>
                                    <Ionicons name="checkmark" size={16} color="#16A34A" />
                                </View>
                                <Text style={styles.richBulletText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={[styles.richComparisonBox, styles.disadvantagesBox]}>
                        <View style={styles.comparisonHeaderRow}>
                            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="warning" size={24} color="#D97706" />
                            </View>
                            <Text style={[styles.comparisonTitle, { color: '#D97706' }]}>Disadvantages</Text>
                        </View>
                        <Text style={styles.sideEffectIntro}>Common side effects include:</Text>
                        {data.disadvantages.map((item, idx) => (
                            <View key={idx} style={styles.richBulletRow}>
                                <View style={styles.warningIconWrapper}>
                                    <Ionicons name="close" size={16} color="#D97706" />
                                </View>
                                <Text style={[styles.richBulletText, { color: '#92400E' }]}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Pregnancy Planning Link */}
                <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.footerContainer}>
                    {data.reversible && (
                        <View style={styles.reversibleBadge}>
                            <Ionicons name="leaf" size={14} color="#16A34A" />
                            <Text style={styles.reversibleText}>Reversible</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.footerLink}>
                        <Text style={styles.footerLinkText}>Explore Pregnancy Planning</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

export default MethodDetail;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    header: {
        backgroundColor: colors.primary,
        paddingHorizontal: 15,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    headerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    mainCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        ...shadows.sm,
    },
    imageContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#F1F8F6',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    mainImage: {
        width: 85,
        height: 85,
        resizeMode: 'contain',
    },
    mainTextContent: {
        flex: 1,
        marginLeft: 15,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    methodTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    typeBadge: {
        backgroundColor: '#E9F9F0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 6,
        marginTop: 2,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#16A34A',
    },
    methodDescription: {
        fontSize: 13,
        color: '#636E72',
        lineHeight: 18,
    },
    statsRow: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        paddingVertical: 15,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        ...shadows.sm,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#F0F0F0',
    },
    statLabel: {
        fontSize: 11,
        color: '#95A5A6',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    statSubText: {
        fontSize: 9,
        color: '#636E72',
        marginTop: 2,
        textAlign: 'center'
    },
    effChipSmall: {
        backgroundColor: '#E9F9F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 2
    },
    effChipTextSmall: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#16A34A',
        textAlign: 'center'
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        ...shadows.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
        textTransform: 'uppercase',
    },
    sectionSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    iconBadge: {
        width: 50,
        height: 50,
        backgroundColor: '#F1F8F6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    usageList: {
        marginBottom: 15,
        marginTop: 10,
    },
    usageStepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    usageStepNumber: {
        fontSize: 14,
        color: '#636E72',
        fontWeight: 'bold',
        marginRight: 8,
        lineHeight: 22,
    },
    usageStepBullet: {
        fontSize: 16,
        color: '#636E72',
        marginRight: 8,
        lineHeight: 22,
    },
    usageStepText: {
        flex: 1,
        fontSize: 14,
        color: '#636E72',
        lineHeight: 22,
    },
    usageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: '#FDF0F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    usageBadgeText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
        marginLeft: 4,
    },
    richComparisonContainer: {
        gap: 16,
        marginBottom: 24,
    },
    richComparisonBox: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        ...shadows.sm,
    },
    benefitsBox: {
        backgroundColor: '#F0FDF4',
        borderColor: '#DCFCE7',
    },
    disadvantagesBox: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FEF3C7',
    },
    comparisonHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    comparisonTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    sideEffectIntro: {
        fontSize: 14,
        color: '#92400E',
        marginBottom: 16,
        fontWeight: '600',
    },
    richBulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    checkIconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    warningIconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    richBulletText: {
        fontSize: 15,
        color: '#3F3F46',
        flex: 1,
        lineHeight: 22,
        fontWeight: '500',
    },
    footerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    reversibleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 12,
    },
    reversibleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#16A34A',
        marginLeft: 6,
    },
    footerLink: {
        paddingVertical: 10,
    },
    footerLinkText: {
        color: colors.primary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        fontSize: 15,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#636E72',
        marginBottom: 10,
    },
    backButton: {
        padding: 10,
        elevation: 3,
    },
    backLink: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
