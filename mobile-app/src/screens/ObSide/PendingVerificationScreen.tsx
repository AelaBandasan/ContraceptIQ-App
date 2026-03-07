import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Clock, ArrowLeft } from 'lucide-react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'PendingVerification'>;

const PendingVerificationScreen = ({ navigation, route }: Props) => {
    const doctorName = route.params?.doctorName || 'Doctor';

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
                    onPress={() => navigation.navigate('UserStartingScreen')}
                >
                    <ArrowLeft size={20} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Return to Home</Text>
                </Pressable>
                <Pressable
                    style={styles.loginButton}
                    onPress={async () => {
                        try {
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
                    <Text style={styles.loginButtonText}>Log Out</Text>
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
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
    },
    subtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 20,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#d3347a',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 16,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loginButton: {
        paddingVertical: 12,
    },
    loginButtonText: {
        color: '#d3347a',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PendingVerificationScreen;
