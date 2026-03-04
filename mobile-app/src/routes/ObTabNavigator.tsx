import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ClipboardList, User, Award, Book, History } from 'lucide-react-native';
import DoctorDashboardScreen from '../screens/ObSide/DoctorDashboardScreen';
import ObHistoryScreen from '../screens/ObSide/ObHistoryScreen';
import ObAssessment from '../screens/ObSide/ObAssessment';
import Whatsrightforme from '../screens/Whatsrightforme'; // Reusing for New Assessment
import Recommendation from '../screens/Recommendation';   // Reusing
import Contraceptivemethods from '../screens/ObSide/Contraceptivemethods';
import ProfileScreen from '../screens/ObSide/ProfileScreen';
import MecGuideScreen from '../screens/ObSide/MecGuideScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import Contrafaqs from '../screens/Contrafaqs';
import EmergencyContraception from '../screens/EmergencyContraception';
import AboutUs from '../screens/AboutUs';
import ObAccountSettings from '../screens/ObSide/ObAccountSettings';
import { ObTabParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';

const Tab = createBottomTabNavigator<ObTabParamList>();

const ObTabNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary, // #E45A92
                tabBarInactiveTintColor: colors.text.secondary, // Slate Gray
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: colors.border.light,
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 8,
                    ...shadows.lg,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    paddingBottom: 4,
                }
            }}
        >
            <Tab.Screen
                name="ObHome"
                component={DoctorDashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <LayoutDashboard color={color} size={size} />
                    )
                }}
            />
            <Tab.Screen
                name="ObAssessment"
                component={ObAssessment as any}
                initialParams={{ isDoctorAssessment: true }}
                options={{
                    tabBarLabel: 'Assess',
                    tabBarIcon: ({ color, size }) => (
                        <ClipboardList color={color} size={size} />
                    )
                }}
            />
            <Tab.Screen
                name="ObHistory"
                component={ObHistoryScreen}
                options={{
                    tabBarLabel: 'History',
                    tabBarIcon: ({ color, size }) => (
                        <History color={color} size={size} />
                    )
                }}
            />
            <Tab.Screen
                name="ObRecommendations"
                component={Recommendation as any}
                initialParams={{ isDoctorAssessment: true }}
                options={{
                    tabBarLabel: 'Results',
                    tabBarIcon: ({ color, size }) => (
                        <Award color={color} size={size} />
                    )
                }}
            />
            <Tab.Screen
                name="ObMethods"
                component={Contraceptivemethods as any}
                initialParams={{ isDoctorAssessment: true }}
                options={{
                    tabBarButton: () => null,
                    tabBarItemStyle: { display: 'none' },
                }}
            />
            <Tab.Screen
                name="ObProfile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <User color={color} size={size} />
                    )
                }}
            />
            <Tab.Screen
                name="ObMecGuide"
                component={MecGuideScreen}
                options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
            />
            <Tab.Screen
                name="ObFeedback"
                component={FeedbackScreen}
                options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
            />
            <Tab.Screen
                name="ObEducation"
                component={Contrafaqs}
                options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
            />
            <Tab.Screen
                name="ObEmergency"
                component={EmergencyContraception}
                options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
            />
            <Tab.Screen
                name="ObAbout"
                component={AboutUs}
                options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
            />
            <Tab.Screen
                name="ObSettings"
                component={ObAccountSettings}
                options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
            />
        </Tab.Navigator>
    );
};

export default ObTabNavigator;
