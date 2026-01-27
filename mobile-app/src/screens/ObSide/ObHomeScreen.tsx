import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, User, Calendar, ChevronRight, Activity, Users, Clock, AlertCircle, Menu } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Mock Data for Patients
const INITIAL_PATIENTS = [
    { id: '1', name: 'Sarah Johnson', lastVisit: 'Today, 9:00 AM', status: 'Waiting', age: 28, type: 'Check-up' },
    { id: '2', name: 'Emily Davis', lastVisit: '10:30 AM', status: 'In Progress', age: 34, type: 'Ultrasound' },
    { id: '3', name: 'Jessica Wilson', lastVisit: 'Jan 25', status: 'Completed', age: 31, type: 'Follow-up' },
    { id: '4', name: 'Michael Brown', lastVisit: 'Jan 20', status: 'Completed', age: 29, type: 'Consultation' },
    { id: '5', name: 'Amanda Miller', lastVisit: 'Jan 15', status: 'Cancelled', age: 25, type: 'Check-up' },
];

const COLORS = {
    primary: '#E45A92',
    primaryLight: '#FCE7F3',
    secondary: '#6366F1',
    secondaryLight: '#E0E7FF',
    background: '#F8FAFC',
    white: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
};

const ObHomeScreen = ({ navigation, route }: any) => {
    // Attempt to keep using the same initial state, but it will be updated
    const [patients, setPatients] = useState(INITIAL_PATIENTS);

    // Initial check for params when screen mounts or updates
    useEffect(() => {
        if (route.params?.newPatient) {
            const newPatientData = route.params.newPatient;
            setPatients(prev => {
                // simple check to avoid duplicates if effect runs twice
                if (prev.some(p => p.id === newPatientData.id)) return prev;
                return [newPatientData, ...prev];
            });
            // Clear params to prevent re-adding
            navigation.setParams({ newPatient: null });
        }
    }, [route.params?.newPatient]);

    // Attempt to get name from route params, or fallback to parent (Drawer) params if possible or just default
    // Note: Standard React Navigation doesn't auto-pass parent params to child screens.
    // However, we passed it to ObDrawer.
    // For simplicity, we can trust the header in the drawer, but if we want it in the dashboard greeting:
    // We'd need to access the parent navigator's params.
    // A cleaner way is to pass it as initialParams to this screen in the navigator.

    // Let's try to get it from the parent navigator params since ObHomeScreen is inside ObDrawer
    // Actually, in ObDrawerNavigator we can pass it via initialParams

    // For now, let's just default to 'Dr. Bandasan' and I'll update ObDrawerNavigator to pass it down properly in the next step if needed.
    // BUT user asked to match name.

    // Let's rely on ObDrawerNavigator to pass it as initialParam.
    const doctorName = route?.params?.doctorName || 'Dr. Bandasan';

    // Stats Calculations (Mock)
    const stats = {
        totalPatients: patients.length + 119, // Mock total
        appointmentsToday: patients.filter(p => p.lastVisit.includes('Today') || p.lastVisit === 'Just now').length + 5,
        criticalAlerts: 2
    };



    const StatusBadge = ({ status }: { status: string }) => {
        let color = COLORS.textSecondary;
        let bg = COLORS.background;

        switch (status) {
            case 'Waiting': color = COLORS.warning; bg = '#FEF3C7'; break;
            case 'In Progress': color = COLORS.secondary; bg = COLORS.secondaryLight; break;
            case 'Completed': color = COLORS.success; bg = '#D1FAE5'; break;
            case 'Cancelled': color = COLORS.danger; bg = '#FEE2E2'; break;
        }

        return (
            <View style={[styles.badge, { backgroundColor: bg }]}>
                <Text style={[styles.badgeText, { color: color }]}>{status}</Text>
            </View>
        );
    };

    const renderPatientItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.patientCard}
            onPress={() => navigation.navigate('ObAssessment', { viewOnly: true, patientData: item })}
        >
            <View style={styles.patientInfo}>
                <View style={[styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>{item.name ? item.name.charAt(0) : '?'}</Text>
                </View>
                <View>
                    <Text style={styles.patientName}>{item.name}</Text>
                    <Text style={styles.patientDetails}>{item.type} • {item.lastVisit}</Text>
                </View>
            </View>
            <StatusBadge status={item.status} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => (navigation as any).openDrawer()} style={{ marginRight: 10 }}>
                        <Menu size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greeting}>Good Morning,</Text>
                        <Text style={styles.doctorName}>{doctorName}</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <User size={24} color={COLORS.primary} />
                    </View>
                </View>

                {/* Dashboard Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                            <Users size={20} color="#2563EB" />
                        </View>
                        <Text style={styles.statValue}>{stats.totalPatients}</Text>
                        <Text style={styles.statLabel}>Total Patients</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#FCE7F3' }]}>
                            <Calendar size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.statValue}>{stats.appointmentsToday}</Text>
                        <Text style={styles.statLabel}>Appointments</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                            <AlertCircle size={20} color={COLORS.danger} />
                        </View>
                        <Text style={styles.statValue}>{stats.criticalAlerts}</Text>
                        <Text style={styles.statLabel}>Alerts</Text>
                    </View>
                </View>

                {/* Search & List Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Queue</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {/* Patient List */}
                <View style={styles.listContainer}>
                    <FlatList
                        data={patients}
                        renderItem={renderPatientItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]} // Added padding for floating button
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                {/* Floating Bottom Section */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={styles.addNewPatientButton}
                        onPress={() => navigation.navigate('ObAssessment')}
                    >
                        <Plus size={20} color={COLORS.white} />
                        <Text style={styles.addNewPatientText}>Add new patient</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ObHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    doctorName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerIcon: {
        padding: 8,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconBox: {
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    seeAll: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    patientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 18,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    patientDetails: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'transparent',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    addNewPatientButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 30,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    addNewPatientText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
});
