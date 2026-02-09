import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, BackHandler, Alert, ScrollView } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAssessmentData } from '../context/AssessmentContext';

const SideMenu: React.FC<DrawerContentComponentProps> = (props) => {
    const { state, navigation } = props;
    const assessmentData = useAssessmentData();
    const hasAssessment = !!assessmentData && Object.keys(assessmentData).length > 0;

    // Function to check if a route is focused
    const isFocused = (routeName: string) => {
        return state.routes[state.index].name === routeName;
    };

    const menuItems = [
        // Conditionally shown items
        {
            label: 'My Preferences',
            route: 'Preferences',
            icon: 'options-outline',
            activeIcon: 'options',
            show: hasAssessment, // Only show if assessment started/done
        },
        {
            label: 'Recommendations',
            route: 'Recommendation', // Navigates to Recommendation screen
            icon: 'ribbon-outline',
            activeIcon: 'ribbon',
            show: hasAssessment,
        },
        // Extras
        {
            label: 'Emergency Contraception',
            route: 'Emergency Contraception',
            icon: 'warning-outline',
            activeIcon: 'warning',
            show: true,
        },
    ];

    const supportItems = [
        {
            label: 'FAQs',
            route: 'Contraceptive FAQs',
            icon: 'help-circle-outline',
            activeIcon: 'help-circle',
        },
        {
            label: 'About Us',
            route: 'About Us',
            icon: 'information-circle-outline',
            activeIcon: 'information-circle',
        },
    ];

    const handleFeedback = async () => {
        const url = 'mailto:feedback@contraceptiq.com?subject=App Feedback';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            Linking.openURL(url);
        } else {
            Alert.alert('Error', 'Could not open email client.');
        }
    };

    const handleExit = () => {
        Alert.alert(
            'Exit App',
            'Are you sure you want to exit?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', onPress: () => BackHandler.exitApp() },
            ],
            { cancelable: true }
        );
    };

    const handlePrivacy = () => {
        Alert.alert('Privacy & Disclaimer', 'Privacy Policy and Disclaimer would go here.');
    }

    const renderItem = (item: any, index: number) => {
        if (!item.show && item.show !== undefined) return null;

        const focused = isFocused(item.route);

        return (
            <TouchableOpacity
                key={index}
                style={[styles.menuItem, focused && styles.menuItemActive]}
                onPress={() => navigation.navigate(item.route, item.params)}
            >
                <Ionicons
                    name={focused ? item.activeIcon : item.icon}
                    size={22}
                    color={focused ? colors.primary : colors.text.secondary}
                    style={styles.icon}
                />
                <Text style={[styles.menuLabel, focused && styles.menuLabelActive]}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>ContraceptIQ</Text>
                    <Text style={styles.tagline}>Smart Support.</Text>
                </View>
            </View>

            <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MENU</Text>
                    {menuItems.map((item, index) => renderItem(item, index))}
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SUPPORT</Text>
                    {supportItems.map((item, index) => renderItem(item, index + 10))}

                    {/* Special Actions */}
                    <TouchableOpacity style={styles.menuItem} onPress={handleFeedback}>
                        <Ionicons name="mail-outline" size={22} color={colors.text.secondary} style={styles.icon} />
                        <Text style={styles.menuLabel}>Send Feedback</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
                        <Ionicons name="shield-checkmark-outline" size={22} color={colors.text.secondary} style={styles.icon} />
                        <Text style={styles.menuLabel}>Privacy & Disclaimer</Text>
                    </TouchableOpacity>
                </View>
            </DrawerContentScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                    <Ionicons name="log-out-outline" size={22} color={colors.error} />
                    <Text style={styles.exitText}>Exit App</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>Version 1.0.1</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        padding: spacing.lg,
        paddingTop: spacing['3xl'], // More space for status bar
        backgroundColor: colors.green.light, // Light hint of brand color
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    logoContainer: {
        marginTop: spacing.sm,
    },
    logoText: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        color: colors.primary,
    },
    tagline: {
        fontSize: typography.sizes.sm,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
    scrollContent: {
        paddingTop: spacing.md,
    },
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text.disabled,
        marginLeft: spacing.lg,
        marginBottom: spacing.sm,
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: spacing.lg,
        marginHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
    },
    menuItemActive: {
        backgroundColor: colors.primaryLight + '20', // Low opacity primary
    },
    icon: {
        marginRight: spacing.lg,
    },
    menuLabel: {
        fontSize: typography.sizes.base,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    menuLabelActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.light,
        marginVertical: spacing.sm,
        marginHorizontal: spacing.lg,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        padding: spacing.lg,
    },
    exitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    exitText: {
        marginLeft: spacing.md,
        color: colors.error,
        fontWeight: '600',
        fontSize: typography.sizes.base,
    },
    versionText: {
        fontSize: 10,
        color: colors.text.disabled,
        textAlign: 'center',
    },
});

export default SideMenu;
