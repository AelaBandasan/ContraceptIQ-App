import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { LogOut, LayoutDashboard, FileText } from 'lucide-react-native';
import ObHomeScreen from '../screens/ObSide/ObHomeScreen';
import ObAssessment from '../screens/ObSide/ObAssessment';
import { ObDrawerParamList } from '../types/navigation';

const Drawer = createDrawerNavigator<ObDrawerParamList>();

const COLORS = {
    primary: '#E45A92',
    white: '#FFFFFF',
    text: '#1E293B',
    border: '#E2E8F0',
    red: '#EF4444',
    background: '#F8FAFC'
};

const CustomObDrawerContent = (props: any) => {
    const { doctorName } = props;
    return (
        <View style={{ flex: 1, backgroundColor: COLORS.white }}>
            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                {/* Drawer Header */}
                <View style={styles.drawerHeader}>
                    <View style={styles.imageContainer}>
                        {/* Placeholder for Logo or Profile Image if available */}
                        <Text style={{ fontSize: 30 }}>👩‍⚕️</Text>
                    </View>
                    <Text style={styles.headerTitle}>{doctorName || 'Dr. Bandasan'}</Text>
                    <Text style={styles.headerSubtitle}>Obstetrician</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: COLORS.white, paddingTop: 10 }}>
                    <DrawerItemList {...props} />
                </View>
            </DrawerContentScrollView>

            {/* Logout Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => props.navigation.navigate('LoginforOB')}
                >
                    <LogOut size={20} color={COLORS.red} style={{ marginRight: 12 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const ObDrawerNavigator = ({ route }: any) => {
    const doctorName = route?.params?.doctorName;

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomObDrawerContent {...props} doctorName={doctorName} />}
            screenOptions={{
                headerShown: false,
                drawerActiveBackgroundColor: '#FCE7F3',
                drawerActiveTintColor: COLORS.primary,
                drawerInactiveTintColor: COLORS.text,
                drawerLabelStyle: {
                    marginLeft: 10,
                    fontSize: 15,
                    fontWeight: '500',
                },
            }}
        >
            <Drawer.Screen
                name="ObHomeScreen"
                component={ObHomeScreen}
                initialParams={{ doctorName }}
                options={{
                    title: 'Dashboard',
                    drawerIcon: ({ color }) => <LayoutDashboard size={22} color={color} />
                }}
            />
            <Drawer.Screen
                name="ObAssessment"
                component={ObAssessment}
                options={{
                    title: 'Assessment',
                    drawerIcon: ({ color }) => <FileText size={22} color={color} />
                }}
            />
        </Drawer.Navigator>
    );
};

const styles = StyleSheet.create({
    drawerHeader: {
        padding: 20,
        paddingTop: 40,
        backgroundColor: COLORS.primary,
        marginBottom: 10,
    },
    imageContainer: {
        height: 70,
        width: 70,
        borderRadius: 35,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: COLORS.white,
        fontSize: 13,
        opacity: 0.8,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: 20 + 10, // approximate safe area
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 15,
        fontFamily: 'Roboto',
        fontWeight: '500',
        color: COLORS.text,
    },
});

export default ObDrawerNavigator;
