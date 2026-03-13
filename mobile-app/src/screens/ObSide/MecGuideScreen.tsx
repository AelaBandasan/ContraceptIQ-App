import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Info, CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import ObHeader from '../../components/ObHeader';
import { colors, spacing } from '../../theme';

const MecGuideScreen = () => {
    const navigation = useNavigation<any>();

    const categories: {
        title: string;
        subtitle?: string;
        description: string;
        footer: string;
        color: string;
        lightColor: string;
        icon: any;
    }[] = [
            {
                title: 'Green — Safe to Use',
                subtitle: 'No medical restriction for this method.',
                description: 'This method is safe to use for your condition. No special precautions are needed beyond routine guidance.',
                footer: 'You can start this method if you choose.',
                color: colors.success,
                lightColor: '#F0FDF4',
                icon: CheckCircle2,
            },
            {
                title: 'Yellow — Generally Safe',
                subtitle: 'Benefits are greater than possible risks.',
                description: 'This method can be used in most cases. A provider may recommend routine follow-up depending on your situation.',
                footer: 'Safe for most people—ask a provider if you have concerns.',
                color: colors.warning,
                lightColor: '#FFFBEB',
                icon: AlertCircle,
            },
            {
                title: 'Orange — Use With Caution',
                subtitle: 'Not usually recommended unless other methods do not work for you.',
                description: 'This method may carry higher risk for your condition. It should be used only when other options are not suitable and with medical guidance.',
                footer: 'Talk to a healthcare provider before choosing this.',
                color: colors.warningDark,
                lightColor: '#FFF7ED',
                icon: AlertTriangle,
            },
            {
                title: 'Red — Not Recommended',
                subtitle: 'This method should not be used for your condition.',
                description: 'Using this method could cause serious health risk. Choose a safer alternative.',
                footer: 'We will show safer options for you.',
                color: colors.error,
                lightColor: '#FEF2F2',
                icon: XCircle,
            },
        ];

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ObHeader
                title="MEC Color Guide"
                subtitle="WHO category interpretation"
                showBack
                onBackPress={() => navigation.navigate('ObHome')}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {categories.map((category, index) => {
                    const IconComponent = category.icon;
                    return (
                        <View
                            key={index}
                            style={[styles.card, { borderLeftColor: category.color }]}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: category.lightColor }]}>
                                    <IconComponent size={24} color={category.color} />
                                </View>
                                <View style={styles.titleArea}>
                                    <Text style={[styles.categoryTitle, { color: category.color }]}>{category.title}</Text>
                                    {category.subtitle ? <Text style={styles.categorySubtitle}>{category.subtitle}</Text> : null}
                                </View>
                            </View>

                            <View style={styles.cardBody}>
                                <Text style={styles.description}>{category.description}</Text>
                                <View style={[styles.footerBadge, { backgroundColor: category.lightColor, flexDirection: 'row', alignItems: 'center' }]}>
                                    <IconComponent size={14} color={category.color} style={{ marginRight: 6 }} />
                                    <Text style={[styles.categoryFooter, { color: category.color }]}>
                                        {category.footer}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

                <View style={styles.pageFooter}>
                    <Info size={20} color="#64748B" />
                    <Text style={styles.footerText}>
                        Always consult a healthcare professional for final medical decisions regarding your patient.
                    </Text>
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default MecGuideScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAF9',
    },
    scrollContent: {
        padding: spacing.lg,
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
