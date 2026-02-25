import { KeyboardAvoidingView, StyleSheet, Text, TouchableOpacity, View, Image, TextInput, Platform, Pressable, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, FileText, Calendar } from 'lucide-react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';

interface OBUserData {
    uid: string;
    fullName: string;
    email: string;
    role: 'OB';
    prcLicenseNumber: string;
    birthdate: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    createdAt: string;
}

const SignupforOB = ({ navigation }: any) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [prcLicense, setPrcLicense] = useState('');
    const [birthdate, setBirthdate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const validatePrc = (value: string) => {
        // Only allow digits, max 7
        const cleaned = value.replace(/[^0-9]/g, '');
        return cleaned.slice(0, 7);
    };

    const handleSignup = async () => {
        // Validation
        if (!fullName || !email || !password || !confirmPassword || !prcLicense || !birthdate) {
            Alert.alert('Incomplete', 'Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }

        if (prcLicense.length !== 7) {
            Alert.alert('Invalid PRC License', 'PRC License Number must be exactly 7 digits.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user details to Firestore with pending verification
            const userData: OBUserData = {
                uid: user.uid,
                fullName,
                email,
                role: 'OB',
                prcLicenseNumber: prcLicense,
                birthdate: birthdate.toISOString().split('T')[0], // "YYYY-MM-DD"
                verificationStatus: 'pending',
                createdAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'users', user.uid), userData);

            // Navigate to Pending Verification screen
            navigation.reset({
                index: 0,
                routes: [{ name: 'PendingVerification', params: { doctorName: fullName } }],
            });
        } catch (error: any) {
            console.error(error);
            let errorMessage = 'Registration failed. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please sign in instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password must be at least 6 characters.';
            }
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const onDateChange = (_event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setBirthdate(selectedDate);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../../assets/tempLogo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>ContraceptIQ</Text>
                        <Text style={styles.welcomeText}>Create your OB Account</Text>
                        <Text style={styles.subtext}>Your expertise. Smarter contraceptive care.</Text>
                    </View>

                    <View style={styles.form}>
                        {/* Full Name */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <Text style={styles.microcopy}>As it appears on your PRC ID</Text>
                            <View style={styles.inputWrapper}>
                                <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Dr. Juan Dela Cruz"
                                    placeholderTextColor="#9CA3AF"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Minimum 6 characters"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </Pressable>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputWrapper}>
                                <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Re-enter password"
                                    placeholderTextColor="#9CA3AF"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <Pressable
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeIcon}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </Pressable>
                            </View>
                        </View>

                        {/* PRC License Number */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>PRC License Number</Text>
                            <Text style={styles.microcopy}>7-digit number from your PRC ID</Text>
                            <View style={styles.inputWrapper}>
                                <FileText size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="0000000"
                                    placeholderTextColor="#9CA3AF"
                                    value={prcLicense}
                                    onChangeText={(v) => setPrcLicense(validatePrc(v))}
                                    keyboardType="number-pad"
                                    maxLength={7}
                                />
                                {prcLicense.length === 7 && (
                                    <Text style={{ color: '#22C55E', fontSize: 16 }}>✓</Text>
                                )}
                            </View>
                        </View>

                        {/* Birthdate */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Birthdate</Text>
                            <Pressable
                                style={styles.inputWrapper}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <Text style={[styles.input, { paddingTop: Platform.OS === 'ios' ? 16 : 0, color: birthdate ? '#111827' : '#9CA3AF' }]}>
                                    {birthdate ? formatDate(birthdate) : 'Select your birthdate'}
                                </Text>
                            </Pressable>
                        </View>

                        {/* Android DatePicker */}
                        {showDatePicker && Platform.OS === 'android' && (
                            <DateTimePicker
                                value={birthdate || new Date(1990, 0, 1)}
                                mode="date"
                                display="default"
                                maximumDate={new Date()}
                                minimumDate={new Date(1940, 0, 1)}
                                onChange={onDateChange}
                            />
                        )}

                        {/* iOS DatePicker Modal */}
                        {Platform.OS === 'ios' && (
                            <Modal
                                visible={showDatePicker}
                                transparent
                                animationType="slide"
                            >
                                <View style={styles.modalOverlay}>
                                    <View style={styles.modalContent}>
                                        <View style={styles.modalHeader}>
                                            <Text style={styles.modalTitle}>Select Birthdate</Text>
                                            <Pressable onPress={() => setShowDatePicker(false)}>
                                                <Text style={styles.modalDone}>Done</Text>
                                            </Pressable>
                                        </View>
                                        <DateTimePicker
                                            value={birthdate || new Date(1990, 0, 1)}
                                            mode="date"
                                            display="spinner"
                                            maximumDate={new Date()}
                                            minimumDate={new Date(1940, 0, 1)}
                                            onChange={onDateChange}
                                        />
                                    </View>
                                </View>
                            </Modal>
                        )}

                        {/* Sign Up Button */}
                        <Pressable
                            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                            onPress={handleSignup}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#d3347a', '#e83c91']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.signupButtonText}>Create Account</Text>
                                        <ArrowRight size={20} color="#FFFFFF" />
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>

                        <View style={styles.registerSection}>
                            <Text style={styles.registerText}>Already have an account? </Text>
                            <Pressable onPress={() => navigation.navigate('LoginforOB')}>
                                <Text style={styles.registerLink}>Sign In</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingHorizontal: 24,
    },
    logoSection: {
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    logoContainer: {
        width: 90,
        height: 90,
        marginBottom: 12,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    subtext: {
        fontSize: 13,
        color: '#6B7280',
    },
    form: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    microcopy: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 6,
        fontStyle: 'italic',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    eyeIcon: {
        padding: 4,
    },
    signupButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    signupButtonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    signupButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    registerSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    registerText: {
        fontSize: 14,
        color: '#6B7280',
    },
    registerLink: {
        fontSize: 14,
        color: '#E45A92',
        fontWeight: '700',
    },
    // iOS DatePicker Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    modalDone: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E45A92',
    },
});

export default SignupforOB;
