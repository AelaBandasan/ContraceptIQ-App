import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Lock, User, Mail, Eye, EyeOff,
    CheckCircle, ShieldCheck
} from 'lucide-react-native';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
} from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import ObHeader from '../../components/ObHeader';
import { colors, shadows } from '../../theme';
import { useAlert } from '../../context/AlertContext';

// ─── Section wrapper ─────────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionCard}>{children}</View>
    </View>
);

// ─── Password input ──────────────────────────────────────────────────────────
const PasswordInput = ({
    label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => {
    const [show, setShow] = useState(false);
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor="#CBD5E1"
                    secureTextEntry={!show}
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShow(s => !s)} style={styles.eyeBtn}>
                    {show ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const ObAccountSettings = ({ navigation }: any) => {
    const { showAlert } = useAlert();
    const user = auth.currentUser;

    // Change password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    // ── Change password ──────────────────────────────────────────────────────
    const handleChangePassword = async () => {
        if (!currentPassword) {
            showAlert('Validation', 'Please enter your current password.');
            return;
        }
        if (newPassword.length < 8) {
            showAlert('Validation', 'New password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            showAlert('Validation', 'New passwords do not match.');
            return;
        }
        if (!user?.email) return;

        setSavingPassword(true);
        try {
            // Re-authenticate first (Firebase requires this for sensitive operations)
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showAlert('Success', 'Password changed successfully.');
        } catch (err: any) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                showAlert('Error', 'Current password is incorrect.');
            } else if (err.code === 'auth/weak-password') {
                showAlert('Error', 'New password is too weak. Use at least 8 characters.');
            } else {
                showAlert('Error', err.message || 'Could not change password.');
            }
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ObHeader title="Account Settings" subtitle="Security & profile" showBack onBackPress={() => navigation.navigate('ObProfile')} />

            <View pointerEvents="none" style={styles.bgDecorWrap}>
                <View style={styles.bgBlobOne} />
                <View style={styles.bgBlobTwo} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.topInfoCard}>
                        <ShieldCheck size={20} color={colors.primary} />
                        <Text style={styles.topInfoText}>Manage your profile security and credentials from this screen.</Text>
                    </View>

                    {/* Account Info (read-only) */}
                    <Section title="Account Info">
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Mail size={20} color="#E45A92" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{user?.email || '—'}</Text>
                            </View>
                            <ShieldCheck size={20} color="#10B981" />
                        </View>
                    </Section>


                    {/* Change Password */}
                    <Section title="Change Password">
                        <Text style={styles.sectionNote}>
                            You'll be asked to verify your current password before setting a new one.
                        </Text>
                        <PasswordInput
                            label="Current Password"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            placeholder="Enter current password"
                        />
                        <View style={styles.rowDivider} />
                        <PasswordInput
                            label="New Password"
                            value={newPassword}
                            onChange={setNewPassword}
                            placeholder="At least 8 characters"
                        />
                        <View style={styles.rowDivider} />
                        <PasswordInput
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Repeat new password"
                        />

                        {/* Password strength hint */}
                        {newPassword.length > 0 && (
                            <View style={styles.strengthRow}>
                                {[4, 6, 8, 12].map((min, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.strengthBar,
                                            newPassword.length >= min && { backgroundColor: newPassword.length >= 12 ? '#10B981' : newPassword.length >= 8 ? '#F59E0B' : '#EF4444' }
                                        ]}
                                    />
                                ))}
                                <Text style={styles.strengthLabel}>
                                    {newPassword.length < 6 ? 'Too short' : newPassword.length < 8 ? 'Weak' : newPassword.length < 12 ? 'Good' : 'Strong'}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.saveBtn, { marginTop: 16 }, savingPassword && styles.saveBtnDisabled]}
                            onPress={handleChangePassword}
                            disabled={savingPassword}
                        >
                            {savingPassword
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <>
                                    <Lock size={16} color="#FFF" />
                                    <Text style={styles.saveBtnText}>Update Password</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </Section>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ObAccountSettings;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    bgDecorWrap: {
        ...StyleSheet.absoluteFillObject,
    },
    bgBlobOne: {
        position: 'absolute',
        top: 80,
        right: -90,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(236, 72, 153, 0.09)',
    },
    bgBlobTwo: {
        position: 'absolute',
        bottom: 100,
        left: -100,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(244, 114, 182, 0.07)',
    },

    scroll: { padding: 16 },
    topInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF5FA',
        borderWidth: 1,
        borderColor: '#F8D6E5',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
    },
    topInfoText: {
        flex: 1,
        fontSize: 14,
        color: '#6B4254',
        fontWeight: '600',
    },

    // Section
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#8A7A83', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3DCE8',
        ...shadows.sm,
        shadowColor: colors.primary,
        shadowOpacity: 0.06,
    },
    sectionNote: { fontSize: 14, color: colors.text.secondary, marginBottom: 14, lineHeight: 19 },

    // Info rows
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF0F6', justifyContent: 'center', alignItems: 'center' },
    infoLabel: { fontSize: 13.5, color: '#6B4254', fontWeight: '500', marginBottom: 2 },
    infoValue: { fontSize: 14.5, color: colors.text.primary, fontWeight: '600' },
    rowDivider: { height: 1, backgroundColor: '#F8FAFC', marginVertical: 12 },

    // Inputs
    inputGroup: { marginBottom: 4 },
    inputLabel: { fontSize: 15, fontWeight: '700', color: '#6B4254', marginBottom: 6 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFCFE', borderRadius: 12, borderWidth: 1, borderColor: '#EFD8E5', paddingHorizontal: 14 },
    input: { flex: 1, fontSize: 15, color: '#1E293B', paddingVertical: 13 },
    eyeBtn: { padding: 6 },

    // Password strength
    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
    strengthLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginLeft: 4 },

    // Save button
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, marginTop: 12 },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

});
