import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { DrawerScreenProps } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';

type Props = DrawerScreenProps<'ColorMapping'>;

const ColorMapping: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const categories = [
        {
            title: 'Green — Safe to Use',
            subtitle: 'Category 1: No restriction',
            description: 'You can safely use this method. There are no known medical reasons to avoid it.',
            footer: '✅ Recommended option',
            color: '#4CAF50',
            lightColor: '#E8F5E9',
        },
        {
            title: 'Yellow — Generally Safe',
            subtitle: 'Category 2: Benefits outweigh risks',
            description: 'This method is generally safe for you. In most cases, the benefits are greater than any possible risks.',
            footer: '⚠️ Monitor if needed',
            color: '#FBC02D',
            lightColor: '#FFFDE7',
        },
        {
            title: 'Orange — Use with Caution',
            subtitle: 'Category 3: Risks usually outweigh benefits',
            description: 'This method may not be the best choice for you. You should talk with a healthcare provider before using it.',
            footer: '⚠️ Medical advice recommended',
            color: '#FB8C00',
            lightColor: '#FFF3E0',
        },
        {
            title: 'Red — Not Recommended',
            subtitle: 'Category 4: Unacceptable health risk',
            description: 'You should not use this method because it may be unsafe for your condition.',
            footer: '❌ Avoid this method',
            color: '#F44336',
            lightColor: '#FFEBEE',
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>What the Colors Mean</Text>
                <View style={{ width: 44 }} /> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.introSection}>
                    <Text style={styles.introSubtitle}>
                        These colors show how safe each contraceptive method is for you based on your answers.
                    </Text>
                </View>

                {categories.map((category, index) => (
                    <View key={index} style={[styles.card, { borderLeftColor: category.color }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.colorDot, { backgroundColor: category.color }]} />
                            <Text style={[styles.categoryTitle, { color: category.color }]}>{category.title}</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                            <Text style={styles.description}>{category.description}</Text>
                            <Text style={styles.categoryFooter}>{category.footer}</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.pageFooter}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
                    <Text style={styles.footerText}>Always consult a healthcare professional for final medical advice.</Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default ColorMapping;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: 15,
        backgroundColor: '#FFF',
        ...shadows.sm,
    },
    backButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
    },
    headerTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: '700',
        color: colors.text.primary,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 40,
    },
    introSection: {
        marginBottom: 25,
        paddingHorizontal: 5,
    },
    introSubtitle: {
        fontSize: 16,
        color: colors.text.secondary,
        lineHeight: 24,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        marginBottom: 20,
        padding: spacing.lg,
        borderLeftWidth: 6,
        ...shadows.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    cardBody: {
        paddingLeft: 2,
    },
    categorySubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    description: {
        fontSize: 15,
        color: colors.text.secondary,
        lineHeight: 22,
        marginBottom: 12,
    },
    categoryFooter: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text.primary,
    },
    pageFooter: {
        marginTop: 10,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
        borderRadius: borderRadius.md,
        gap: 10,
    },
    footerText: {
        flex: 1,
        fontSize: 13,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
});
