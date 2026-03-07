import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import ObHeader from '../../components/ObHeader';

const FeedbackScreen = () => {
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        Alert.alert('Thank You', 'Your feedback has been sent!');
        setFeedback('');
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ObHeader title="Send Feedback" subtitle="How are we doing?" />
            <View style={styles.content}>
                <Text style={styles.label}>How can we improve ContraceptIQ?</Text>
                <TextInput
                    style={styles.input}
                    multiline
                    placeholder="Type your feedback here..."
                    value={feedback}
                    onChangeText={setFeedback}
                    textAlignVertical="top"
                />
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.btnText}>Submit Feedback</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default FeedbackScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    content: { padding: 20 },
    label: { fontSize: 16, color: '#334155', marginBottom: 12 },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        height: 150,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        color: '#1E293B'
    },
    button: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
