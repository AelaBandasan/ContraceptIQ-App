import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Clock, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../config/firebaseConfig';
import { useAlert } from '../../context/AlertContext';

type Props = NativeStackScreenProps<RootStackParamList, 'PendingVerification'>;

const PendingVerificationScreen = ({ navigation, route }: Props) => {
    const { showAlert } = useAlert();
    const doctorName = route.params?.doctorName || 'Doctor';
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        const user = auth.currentUser;
        if (!user) {
            navigation.replace('UserStartingScreen');
            return;
        }

        setIsRefreshing(true);
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.verificationStatus === "verified") {
                    const name = userData.fullName || "Dr. " + (userData.email?.split('@')[0] || "User");
                    await AsyncStorage.setItem('@ob_auth_cache', JSON.stringify({
                        verificationStatus: "verified",
                        doctorName: name,
                    }));
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "ObMainTabs", params: { doctorName: name } }],
                    });
                } else {
                    showAlert("Still Pending", "Your account is still under review. We will notify you once it's approved.");
                }
            }
        } catch (error) {
            console.error("Refresh error:", error);
            showAlert("Error", "Could not refresh status. Please try again.");
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Clock size={80} color="#d3347a" />
                </View>
                <Text style={styles.title}>Verification Pending</Text>
                <Text style={styles.message}>
                    Thank you for registering, {doctorName}. Your account is currently under review by our administrators.
                </Text>
                <Text style={styles.subtext}>
                    We are verifying your PRC License details. You will be able to access the doctor dashboard once your account is approved.
                </Text>
                
                <Pressable
                    style={styles.button}
                    onPress={handleRefresh}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <RefreshCw size={20} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Refresh Status</Text>
                        </>
                    )}
                </Pressable>

                <Pressable
                    style={styles.logoutButton}
                    onPress={async () => {
                        try {
                            await AsyncStorage.removeItem('@ob_auth_cache');
                            await signOut(auth);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'UserStartingScreen' }]
                            });
                        } catch (error) {
                            console.error("Error signing out:", error);
                        }
                    }}
                >
                    <Text style={styles.logoutButtonText}>Sign Out</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 32,
        backgroundColor: '#FCE7F3',
        padding: 24,
        borderRadius: 64,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 24,
    },
    subtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 44,
        lineHeight: 20,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#d3347a',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: '#d3347a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    logoutButton: {
        marginTop: 24,
        padding: 10,
    },
    logoutButtonText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default PendingVerificationScreen;
