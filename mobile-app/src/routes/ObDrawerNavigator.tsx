import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import {
    LogOut, LayoutDashboard, History, BookOpen, Palette,
    HelpCircle, AlertTriangle, Info, MessageSquare, Settings
} from 'lucide-react-native';
import ObTabNavigator from './ObTabNavigator';
import ObHistoryScreen from '../screens/ObSide/ObHistoryScreen';
import Contraceptivemethods from '../screens/Contraceptivemethods';
import MecGuideScreen from '../screens/ObSide/MecGuideScreen';
import FeedbackScreen from '../screens/ObSide/FeedbackScreen';
import SettingsScreen from '../screens/ObSide/SettingsScreen';
import AboutUs from '../screens/AboutUs';
import Contrafaqs from '../screens/Contrafaqs'; // Using Contrafaqs for Education filler for now
import EmergencyContraception from '../screens/EmergencyContraception';
import { ObDrawerParamList } from '../types/navigation';
import { auth } from '../config/firebaseConfig';
import { colors } from '../theme';

const Drawer = createDrawerNavigator<ObDrawerParamList>();

const CustomObDrawerContent = (props: any) => {
    const { doctorName, state, navigation } = props;

    const handleLogout = async () => {
        try {
            await auth.signOut();
            props.navigation.reset({
                index: 0,
                routes: [{ name: 'LoginforOB' }],
            });
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    // Function to check if a route is focused
    const isFocused = (routeName: string) => {
        return state.routes[state.index].name === routeName;
    };

    const menuItems = [
        { label: 'Home', route: 'ObMainTabs', icon: LayoutDashboard },
        { label: 'Recent Assessments', route: 'ObHistory', icon: History },
        { label: 'Contraceptive Methods', route: 'ObMethods', icon: BookOpen },
        { label: 'MEC Guide / Color Legend', route: 'ObMecGuide', icon: Palette },
    ];

    const supportItems = [
        { label: 'FAQs / Patient Education', route: 'ObEducation', icon: HelpCircle },
        { label: 'Emergency Contraception', route: 'ObEmergency', icon: AlertTriangle },
        { label: 'About Us', route: 'ObAbout', icon: Info },
        { label: 'Send Feedback', route: 'ObFeedback', icon: MessageSquare },
        { label: 'Account Settings', route: 'ObSettings', icon: Settings },
    ];

    const renderItem = (item: any, index: number) => {
        const focused = isFocused(item.route);
        const Icon = item.icon;

        return (
            <TouchableOpacity
                key={index}
                style={[styles.menuItem, focused && styles.menuItemActive]}
                onPress={() => navigation.navigate(item.route)}
            >
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                    <Icon
                        size={20}
                        color="#FFFFFF"
                    />
                </View>
                <Text style={[styles.menuLabel, focused && styles.menuLabelActive]}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
                <View style={styles.imageContainer}>
                    <Text style={{ fontSize: 30 }}>👩‍⚕️</Text>
                </View>
                <Text style={styles.headerTitle}>{doctorName || 'Dr. Bandasan'}</Text>
                <Text style={styles.headerSubtitle}>Obstetrician</Text>
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
                </View>
            </DrawerContentScrollView>

            {/* Logout Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <LogOut size={22} color={colors.error} style={{ marginRight: 12 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>Version 1.0.1</Text>
            </View>
        </View>
    );
};

const ObDrawerNavigator = ({ route }: any) => {
    const doctorName = route?.params?.doctorName;

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomObDrawerContent {...props} doctorName={doctorName} />}
            initialRouteName="ObMainTabs"
            screenOptions={{
                headerShown: false,
                drawerActiveBackgroundColor: '#FCE7F3',
                drawerActiveTintColor: colors.primary, // #E45A92
                drawerInactiveTintColor: '#1E293B',
                drawerLabelStyle: {
                    marginLeft: -20, // Adjust icon-label spacing
                    fontSize: 15,
                    fontWeight: '500',
                },
                drawerItemStyle: {
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    marginHorizontal: 10,
                }
            }}
        >
            <Drawer.Screen
                name="ObMainTabs"
                component={ObTabNavigator}
                options={{
                    title: 'Home',
                    drawerIcon: ({ color }) => <LayoutDashboard size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="ObHistory"
                component={ObHistoryScreen}
                options={{
                    title: 'Recent Assessments',
                    drawerIcon: ({ color }) => <History size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="ObMethods"
                component={Contraceptivemethods as any}
                options={{
                    title: 'Contraceptive Methods',
                    drawerIcon: ({ color }) => <BookOpen size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="ObMecGuide"
                component={MecGuideScreen}
                options={{
                    title: 'MEC Guide / Color Legend',
                    drawerIcon: ({ color }) => <Palette size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="ObEducation"
                component={Contrafaqs as any}
                options={{
                    title: 'FAQs / Patient Education',
                    drawerIcon: ({ color }) => <HelpCircle size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="ObEmergency"
                component={EmergencyContraception as any}
                options={{
                    title: 'Emergency Contraception',
                    drawerIcon: ({ color }) => <AlertTriangle size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="ObAbout"
                component={AboutUs as any}
                options={{
                    title: 'About Us',
                    drawerIcon: ({ color }) => <Info size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="ObFeedback"
                component={FeedbackScreen}
                options={{
                    title: 'Send Feedback',
                    drawerIcon: ({ color }) => <MessageSquare size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="ObSettings"
                component={SettingsScreen}
                options={{
                    title: 'Account Settings',
                    drawerIcon: ({ color }) => <Settings size={22} color={color} />
                }}
            />
        </Drawer.Navigator>
    );
};

export default ObDrawerNavigator;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    drawerHeader: {
        padding: 20,
        paddingTop: 50,
        backgroundColor: colors.primary, // #E45A92
        marginBottom: 10,
    },
    imageContainer: {
        height: 70, width: 70, borderRadius: 35,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    headerSubtitle: { color: '#FFFFFF', fontSize: 13, opacity: 0.8 },
    scrollContent: {
        paddingTop: 8,
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text.disabled,
        marginLeft: 20,
        marginBottom: 8,
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginHorizontal: 8,
        borderRadius: 10,
    },
    menuItemActive: {
        backgroundColor: '#FCE7F3', // Light pink background for active
    },
    iconContainer: {
        width: 42,
        height: 42,
        backgroundColor: colors.primary, // Solid vibrant pink for all icons
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconContainerActive: {
        // Same as base now
    },
    menuLabel: {
        fontSize: 16,
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
        marginVertical: 8,
        marginHorizontal: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        paddingBottom: 30,
    },
    logoutButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    logoutText: { fontSize: 16, fontWeight: '600', color: colors.error },
    versionText: {
        fontSize: 10,
        color: colors.text.disabled,
        textAlign: 'center',
    },
});
