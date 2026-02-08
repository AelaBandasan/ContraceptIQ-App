import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ClipboardList, User } from 'lucide-react-native';
import DoctorDashboardScreen from '../screens/ObSide/DoctorDashboardScreen';
import RecordsScreen from '../screens/ObSide/RecordsScreen';
import ProfileScreen from '../screens/ObSide/ProfileScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
    primary: '#E45A92',
    inactive: '#94A3B8',
    background: '#FFFFFF'
};

const ObTabNavigator = ({ route }: any) => {
    // Pass initial params if needed (like doctorName)
    const doctorName = route?.params?.doctorName;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.inactive,
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                }
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DoctorDashboardScreen}
                initialParams={{ doctorName }}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <LayoutDashboard color={color} size={size} />
                    )
                }}
            />
            <Tab.Screen
                name="Records"
                component={RecordsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <ClipboardList color={color} size={size} />
                    )
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <User color={color} size={size} />
                    )
                }}
            />
        </Tab.Navigator>
    );
};

export default ObTabNavigator;
