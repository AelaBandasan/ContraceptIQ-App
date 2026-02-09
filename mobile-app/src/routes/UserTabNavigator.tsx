import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, List, BookOpen } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import Whatsrightforme from '../screens/Whatsrightforme';
import Contraceptivemethods from '../screens/Contraceptivemethods';
import Diduknow from '../screens/Diduknow';
import { colors, typography, shadows } from '../theme';
import { UserTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<UserTabParamList>();

const UserTabNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.text.secondary,
                tabBarLabelStyle: {
                    fontSize: 12, // slightly smaller than typography.sizes.xs (12) to fit
                    fontWeight: '500',
                    paddingBottom: 4,
                },
                tabBarStyle: {
                    backgroundColor: colors.background.primary,
                    borderTopWidth: 1,
                    borderTopColor: colors.border.light,
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 10), // Sufficient height for touch targets
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 8,
                    // Add shadow/elevation
                    ...shadows.lg,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Home color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="What's Right for Me?"
                component={Whatsrightforme}
                options={{
                    tabBarLabel: 'Find Method',
                    tabBarIcon: ({ color, size }) => (
                        <Search color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Contraceptive Methods"
                component={Contraceptivemethods}
                options={{
                    tabBarLabel: 'Methods',
                    tabBarIcon: ({ color, size }) => (
                        <List color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Did You Know?"
                component={Diduknow}
                options={{
                    tabBarLabel: 'Learn',
                    tabBarIcon: ({ color, size }) => (
                        <BookOpen color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default UserTabNavigator;
