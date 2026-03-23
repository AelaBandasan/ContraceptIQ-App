import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LogOut, ChevronRight, Settings, Info, Pencil } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ObHeader from '../../components/ObHeader';
import { colors } from '../../theme';
import { useAlert } from '../../context/AlertContext';

const ProfileScreen = ({ navigation }: any) => {
    const { showAlert } = useAlert();
    const { width } = useWindowDimensions();
    const horizontalPadding = width < 360 ? 14 : 20;
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const user = auth.currentUser;
    const email = user?.email || 'N/A';

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        if (!user) return;
        try {
            // Check AsyncStorage for local profile picture first
            const localPic = await AsyncStorage.getItem(`profilePic_${user.uid}`);
            if (localPic) {
                setProfilePic(localPic);
                return;
            }

            // Fallback to Firestore if no local picture is found
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.profilePicUrl) {
                    setProfilePic(data.profilePicUrl);
                }
            }
        } catch (error) {
             console.error('Error fetching profile:', error);
        }
    };

    const handleLogout = () => {
        showAlert(
            'Log Out',
            'Are you sure you want to log out of your account?',
            [
                { text: 'Stay', style: 'cancel' },
                { 
                    text: 'Log Out', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('@ob_auth_cache');
                            await auth.signOut();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'LoginforOB' }],
                            });
                        } catch (error) {
                            console.error('Logout Error:', error);
                        }
                    }
                },
            ]
        );
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        if (!user) return;
        setUploading(true);

        try {
            // Save the URI locally using AsyncStorage instead of Firebase Storage
            await AsyncStorage.setItem(`profilePic_${user.uid}`, uri);
            
            // Still update the Firestore profilePicUrl to point to this local URI 
            // incase other offline fallback systems try to read it
            await updateDoc(doc(db, 'users', user.uid), {
                profilePicUrl: uri
            });

            setProfilePic(uri);
            showAlert('Success', 'Profile picture updated locally!');
        } catch (error) {
            console.error('Upload Error:', error);
            showAlert('Error', 'Failed to save image locally. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const doctorName = email.split('@')[0] || 'Bandasan';

    const handleChangePhoto = () => {
        pickImage();
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ObHeader title="My Profile" subtitle="View and update your personal details." />

            <View pointerEvents="none" style={styles.bgDecorWrap}>
                <View style={styles.bgBlobOne} />
                <View style={styles.bgBlobTwo} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
                <View style={[styles.contentWrap, { paddingHorizontal: horizontalPadding }]}>
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
                            <TouchableOpacity style={styles.avatar} onPress={handleChangePhoto} activeOpacity={0.85} disabled={uploading}>
                                {uploading ? (
                                    <ActivityIndicator size="large" color={colors.primary} />
                                ) : profilePic ? (
                                    <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.silhouetteContainer}>
                                        <Image source={require('../../../assets/image/silhouette.png')} style={styles.avatarImage} />
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleChangePhoto} style={styles.editPhotoBtn} disabled={uploading}>
                                {uploading ? (
                                    <ActivityIndicator size="small" color="#DB2777" />
                                ) : (
                                    <Pencil size={13} color="#DB2777" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.name}>{doctorName}</Text>
                        <Text style={styles.role}>Family Planning Provider</Text>
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
    silhouetteContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
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
