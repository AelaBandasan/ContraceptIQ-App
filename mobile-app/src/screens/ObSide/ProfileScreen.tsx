import React from 'react';
import { Alert, StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../config/firebaseConfig';
import { LogOut, ChevronRight, Settings, Info, MessageSquare, Pencil } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ObHeader from '../../components/ObHeader';
import { colors } from '../../theme';

const ProfileScreen = ({ navigation }: any) => {
    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigation.reset({
                index: 0,
                routes: [{ name: 'LoginforOB' }],
            });
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    const user = auth.currentUser;
    const email = user?.email || 'N/A';

    // Simple placeholder for name logic or passed params
    const doctorName = 'Dr. ' + (email.split('@')[0] || 'Bandasan');

    const handleChangePhoto = () => {
        Alert.alert('Profile Picture', 'Profile photo upload will be available in a future update.');
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ObHeader title="My Profile" subtitle={doctorName} />

            <View pointerEvents="none" style={styles.bgDecorWrap}>
                <View style={styles.bgBlobOne} />
                <View style={styles.bgBlobTwo} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
                <View style={styles.contentWrap}>
                    <LinearGradient
                        colors={['#F3EDF2', '#F3EDF2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.profileCard}
                    >
                        <LinearGradient
                            colors={['#F472B6', '#DB2777', '#BE185D']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.profileTopAccent}
                        />
                        <View style={styles.avatarWrap}>
                            <TouchableOpacity style={styles.avatar} onPress={handleChangePhoto} activeOpacity={0.85}>
                                <Image source={require('../../../assets/image/doctorcat.png')} style={styles.avatarImage} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleChangePhoto} style={styles.editPhotoBtn}>
                                <Pencil size={13} color="#DB2777" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.name}>{doctorName}</Text>
                        <Text style={styles.role}>Obstetrician - ContraceptIQ</Text>
                        <Text style={styles.email}>{email}</Text>
                    </LinearGradient>

                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Account & Support</Text>
                        <Text style={styles.sectionHint}>Manage your professional profile</Text>
                    </View>

                    <View style={styles.section}>
                        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ObAbout')}>
                            <View style={styles.rowIcon}>
                                <Info size={20} color="#DB2777" />
                            </View>
                            <Text style={styles.rowText}>About Us</Text>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ObFeedback')}>
                            <View style={styles.rowIcon}>
                                <MessageSquare size={20} color="#DB2777" />
                            </View>
                            <Text style={styles.rowText}>Send Feedback</Text>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ObSettings')}>
                            <View style={styles.rowIcon}>
                                <Settings size={20} color="#DB2777" />
                            </View>
                            <Text style={styles.rowText}>Account Settings</Text>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.row} onPress={handleLogout}>
                            <View style={[styles.rowIcon, styles.logoutIcon]}>
                                <LogOut size={20} color="#DB2777" />
                            </View>
                            <Text style={[styles.rowText, styles.logoutText]}>Log Out</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.versionContainer}>
                        <Text style={styles.versionText}>Version 1.0.0</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    bgDecorWrap: {
        ...StyleSheet.absoluteFillObject,
    },
    bgBlobOne: {
        position: 'absolute',
        top: -70,
        right: -80,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(236, 72, 153, 0.10)',
    },
    bgBlobTwo: {
        position: 'absolute',
        bottom: 130,
        left: -90,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(244, 114, 182, 0.08)',
    },
    contentWrap: {
        paddingHorizontal: 20,
        paddingTop: 18,
    },
    profileCard: {
        alignItems: 'center',
        paddingTop: 34,
        paddingBottom: 22,
        paddingHorizontal: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E7D8E2',
        overflow: 'hidden',
    },
    profileTopAccent: {
        position: 'absolute',
        top: 12,
        alignSelf: 'center',
        width: 132,
        height: 8,
        borderRadius: 999,
    },
    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: '#FFF7FB',
        borderWidth: 2,
        borderColor: '#F472B6',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: 8,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    editPhotoBtn: {
        position: 'absolute',
        right: -6,
        top: 60,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F8EDF3',
        borderWidth: 1,
        borderColor: '#F8A4CC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: { fontSize: 28, fontWeight: '800', color: colors.text.primary, marginBottom: 5, letterSpacing: -0.4, textAlign: 'center' },
    role: { fontSize: 17, color: colors.primary, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    email: {
        fontSize: 13,
        color: colors.primary,
        textAlign: 'center',
        backgroundColor: '#F8EDF3',
        borderWidth: 1,
        borderColor: '#F8A4CC',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 5,
    },

    sectionHeaderRow: {
        marginTop: 18,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
    },
    sectionHint: {
        marginTop: 2,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },

    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 5,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        padding: 16,
    },
    rowIcon: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16,
    },
    logoutIcon: { backgroundColor: '#FDF2F8' },
    rowText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1E293B' },
    logoutText: { color: '#EF4444' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 68 },

    versionContainer: { alignItems: 'center', paddingTop: 18, paddingBottom: 8 },
    versionText: { color: '#CBD5E1', fontSize: 12 },
});
