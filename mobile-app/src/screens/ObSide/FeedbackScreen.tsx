import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquareText, Sparkles } from 'lucide-react-native';
import { colors, shadows } from '../../theme';
import ObHeader from '../../components/ObHeader';

const FeedbackScreen = ({ navigation }: any) => {
    const [feedback, setFeedback] = useState('');

    const maxLength = 500;
    const charsLeft = maxLength - feedback.length;

    const handleSubmit = () => {
        if (!feedback.trim()) {
            Alert.alert('Feedback Required', 'Please enter your feedback before submitting.');
            return;
        }

        Alert.alert('Thank You', 'Your feedback has been sent!');
        setFeedback('');
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ObHeader title="Send Feedback" subtitle="How are we doing?" showBack onBackPress={() => navigation.navigate('ObProfile')} />

            <View pointerEvents="none" style={styles.bgDecorWrap}>
                <View style={styles.bgBlobOne} />
                <View style={styles.bgBlobTwo} />
            </View>

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.topInfoCard}>
                        <View style={styles.topInfoIconWrap}>
                            <Sparkles size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.topInfoText}>Your feedback helps us improve clinical workflows and patient support.</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View style={styles.cardIconWrap}>
                                <MessageSquareText size={20} color={colors.primary} />
                            </View>
                            <View style={styles.cardTitleWrap}>
                                <Text style={styles.label}>How can we improve ContraceptIQ?</Text>
                                <Text style={styles.hint}>Share bugs, feature requests, or workflow suggestions.</Text>
                            </View>
                        </View>

                        <TextInput
                            style={styles.input}
                            multiline
                            maxLength={maxLength}
                            placeholder="Type your feedback here..."
                            placeholderTextColor="#94A3B8"
                            value={feedback}
                            onChangeText={setFeedback}
                            textAlignVertical="top"
                        />

                        <View style={styles.footerRow}>
                            <Text style={styles.counterText}>{charsLeft} characters left</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, !feedback.trim() && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={!feedback.trim()}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[colors.primary, '#D22E73']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.btnText}>Submit Feedback</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default FeedbackScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    flex: { flex: 1 },
    bgDecorWrap: {
        ...StyleSheet.absoluteFillObject,
    },
    bgBlobOne: {
        position: 'absolute',
        top: 90,
        right: -90,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(236, 72, 153, 0.10)',
    },
    bgBlobTwo: {
        position: 'absolute',
        bottom: 120,
        left: -95,
        width: 210,
        height: 210,
        borderRadius: 105,
        backgroundColor: 'rgba(244, 114, 182, 0.08)',
    },
    content: { padding: 18, paddingBottom: 36 },
    topInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FFF5FA',
        borderWidth: 1,
        borderColor: '#F8D6E5',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
    },
    topInfoIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topInfoText: {
        flex: 1,
        fontSize: 14,
        color: '#6B4254',
        fontWeight: '600',
        lineHeight: 18,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F3DCE8',
        padding: 16,
        ...shadows.sm,
        shadowColor: colors.primary,
        shadowOpacity: 0.08,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    cardIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FDF2F8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    cardTitleWrap: {
        flex: 1,
    },
    label: { fontSize: 16.5, color: colors.text.primary, fontWeight: '800' },
    hint: { marginTop: 2, fontSize: 14, color: colors.text.secondary, fontWeight: '500' },
    input: {
        backgroundColor: '#FFFCFE',
        borderRadius: 12,
        padding: 16,
        minHeight: 170,
        borderWidth: 1,
        borderColor: '#EFD8E5',
        marginBottom: 10,
        color: '#1E293B',
        fontSize: 15,
        lineHeight: 21,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 14,
    },
    counterText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    btnText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
});
