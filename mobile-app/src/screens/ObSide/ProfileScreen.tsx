import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../config/firebaseConfig';
import { LogOut, User, ChevronRight, Settings } from 'lucide-react-native';

const ProfileScreen = ({ navigation }: any) => {
    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigation.reset({
                index: 0,
                routes: [{ name: 'LoginforOB' }],
            });
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    const user = auth.currentUser;
    const email = user?.email || 'N/A';

    // Simple placeholder for name logic or passed params
    const doctorName = "Dr. " + (email.split('@')[0] || "Bandasan");

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Profile</Text>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={{ fontSize: 32 }}>👩‍⚕️</Text>
                </View>
                <Text style={styles.name}>{doctorName}</Text>
                <Text style={styles.role}>Obstetrician - ContraceptIQ</Text>
                <Text style={styles.email}>{email}</Text>
            </View>

            {/* Settings List */}
            <View style={styles.section}>
                <TouchableOpacity style={styles.row}>
                    <View style={styles.rowIcon}>
                        <Settings size={20} color="#64748B" />
                    </View>
                    <Text style={styles.rowText}>Account Settings</Text>
                    <ChevronRight size={20} color="#CBD5E1" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.row} onPress={handleLogout}>
                    <View style={[styles.rowIcon, { backgroundColor: '#FEE2E2' }]}>
                        <LogOut size={20} color="#EF4444" />
                    </View>
                    <Text style={[styles.rowText, { color: '#EF4444' }]}>Log Out</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.versionContainer}>
                <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
        </SafeAreaView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: '#FFFFFF' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
    profileCard: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#FFFFFF',
        marginTop: 20,
        marginHorizontal: 20,
        borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#FCE7F3',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 15
    },
    name: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
    role: { fontSize: 14, color: '#E45A92', fontWeight: '600', marginBottom: 8 },
    email: { fontSize: 14, color: '#64748B' },

    section: {
        marginTop: 20,
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 5
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        padding: 16
    },
    rowIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16
    },
    rowText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1E293B' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 68 },

    versionContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 },
    versionText: { color: '#CBD5E1', fontSize: 12 }
});
