import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Dimensions, Share } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackScreenProps } from '../types/navigation';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { CONTRACEPTIVE_DETAILS } from '../data/contraceptiveData';

type Props = RootStackScreenProps<'MethodDetail'>;

export const MethodDetail: React.FC<Props> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { methodId } = route.params || {};

    // Senior Dev Note: In a production Supabase integration, 
    // we would replace this static lookup with a useQuery() hook:
    // const { data, isLoading, error } = useContraceptiveData(methodId);
    const data = methodId ? CONTRACEPTIVE_DETAILS[methodId] : null;

    // TODO: Implement loading state when switching to dynamic API calls
    // if (isLoading) return <LoadingSpinner />;

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
            {/* Premium Header */}
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contraceptiq</Text>
                <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                    <Ionicons name="share-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
                {/* Main Info Card */}
                <View style={styles.mainCard}>
                    <View style={styles.imageContainer}>
                        <Image source={data.illustration} style={styles.mainImage} />
                    </View>
                    <View style={styles.mainTextContent}>
                        <Text style={styles.methodTitle}>{data.name}</Text>
                        <Text style={styles.methodDescription}>{data.description}</Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Effectiveness</Text>
                        <Text style={styles.statValue}>{data.effectiveness}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Frequency</Text>
                        <View style={styles.statValueRow}>
                            <Ionicons name="time-outline" size={16} color={colors.primary} />
                            <Text style={[styles.statValue, { marginLeft: 4 }]}>{data.frequency}</Text>
                        </View>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Estimated Price</Text>
                        <Text style={styles.statValue}>{data.priceRange}</Text>
                    </View>
                </View>

                {/* How to Use Section */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>How to Use</Text>
                            <Text style={styles.sectionSubtitle}>{data.name}</Text>
                        </View>
                        <View style={styles.iconBadge}>
                            <MaterialCommunityIcons name="pill" size={30} color={colors.primary} />
                        </View>
                    </View>
                    <View style={styles.usageList}>
                        {data.howToUse.map((step, index) => (
                            <Text key={index} style={styles.usageStep}>
                                {index + 1}. {step}
                            </Text>
                        ))}
                    </View>
                    <View style={styles.usageBadge}>
                        <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                        <Text style={styles.usageBadgeText}>{data.effectiveness} Effective</Text>
                    </View>
                </View>

                {/* Benefits & Disadvantages Section */}
                <View style={styles.comparisonContainer}>
                    <View style={[styles.comparisonBox, styles.benefitsBox]}>
                        <Text style={[styles.comparisonTitle, { color: '#2E8B57' }]}>Benefits</Text>
                        {data.benefits.map((item, idx) => (
                            <View key={idx} style={styles.bulletRow}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.bulletText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={[styles.comparisonBox, styles.disadvantagesBox]}>
                        <Text style={[styles.comparisonTitle, { color: '#E45A92' }]}>Disadvantages</Text>
                        {data.disadvantages.map((item, idx) => (
                            <View key={idx} style={styles.bulletRow}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.bulletText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Pregnancy Planning Link */}
                <TouchableOpacity style={styles.footerLink}>
                    <Text style={styles.footerLinkText}>Explore Pregnancy Planning</Text>
                </TouchableOpacity>
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
        paddingHorizontal: 15,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        ...shadows.md,
    },
    headerButton: {
        padding: 5,
    },
    headerTitle: {
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
    methodTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
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
        marginBottom: 15,
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
    },
    usageStep: {
        fontSize: 14,
        color: '#636E72',
        lineHeight: 22,
        marginBottom: 6,
    },
    usageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: '#F1F8F6',
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
    comparisonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    comparisonBox: {
        flex: 0.48,
        borderRadius: 15,
        padding: 15,
        ...shadows.sm,
    },
    benefitsBox: {
        backgroundColor: '#E9F9F0',
    },
    disadvantagesBox: {
        backgroundColor: '#FDF0F5',
    },
    comparisonTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    bulletRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    bullet: {
        fontSize: 14,
        marginRight: 5,
    },
    bulletText: {
        fontSize: 13,
        color: '#2D3436',
        flex: 1,
    },
    footerLink: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    footerLinkText: {
        color: colors.primary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
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
    },
    backLink: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
