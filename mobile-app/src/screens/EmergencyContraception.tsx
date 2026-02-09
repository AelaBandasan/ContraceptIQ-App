import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';

const EmergencyContraception = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => (navigation as any).toggleDrawer()} style={styles.menuButton}>
                    <Ionicons name="menu" size={30} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emergency Contraception</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.title}>What is it?</Text>
                    <Text style={styles.text}>
                        Emergency contraception (EC) is a method of birth control used to prevent pregnancy after unprotected sex.
                        It is often called the "morning-after pill," but it can be taken up to 5 days after sex (depending on the type).
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>When to use it?</Text>
                    <Text style={styles.text}>
                        • You didn't use birth control during sex.{'\n'}
                        • Your birth control method failed (e.g., condom broke, missed pills).{'\n'}
                        • You were forced to have unprotected sex.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Types of EC</Text>
                    <Text style={styles.subtitle}>1. Emergency Contraceptive Pills (ECPs)</Text>
                    <Text style={styles.text}>
                        - Levonorgestrel (Plan B): Best taken within 72 hours (3 days).{'\n'}
                        - Ulipristal Acetate (Ella): Effective up to 120 hours (5 days).
                    </Text>

                    <Text style={styles.subtitle}>2. Copper IUD</Text>
                    <Text style={styles.text}>
                        INSERTED by a doctor within 5 days of unprotected sex. It is the most effective form of EC (99.9% effective).
                    </Text>
                </View>

                <View style={[styles.card, styles.disclaimerCard]}>
                    <Ionicons name="alert-circle-outline" size={24} color={colors.primary} />
                    <Text style={styles.disclaimerText}>
                        Emergency contraception is NOT an abortion pill. It prevents pregnancy before it starts.
                        It does not protect against STIs.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    menuButton: {
        marginRight: spacing.md,
    },
    headerTitle: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.semibold,
        color: colors.text.primary,
    },
    content: {
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.background.primary,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    title: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.primary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
        color: colors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    text: {
        fontSize: typography.sizes.base,
        color: colors.text.secondary,
        lineHeight: 24,
    },
    disclaimerCard: {
        backgroundColor: colors.background.primary,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
    },
    disclaimerText: {
        flex: 1,
        marginLeft: spacing.md,
        fontSize: typography.sizes.sm,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
});

export default EmergencyContraception;
